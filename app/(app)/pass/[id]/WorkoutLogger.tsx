"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { HowToToggle } from "@/components/ExerciseDemo";
import ExercisePicker from "@/components/ExercisePicker";
import { formatClock, formatDate, muscleLabel } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { Equipment, Exercise, RatingMap, Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { addExerciseToWorkoutAction, deleteWorkoutAction, finishWorkoutAction } from "../../actions";

export type PreviousSets = Record<
  string,
  {
    date: string;
    sets: { set_number: number; reps: number | null; weight_kg: number | null; duration_seconds: number | null; distance_m: number | null }[];
  }
>;

type Item = WorkoutExercise & { sets: WorkoutSet[] };

export default function WorkoutLogger({
  workout,
  initialItems,
  exercises,
  equipment,
  previous,
  ratings,
}: {
  workout: Workout;
  initialItems: Item[];
  exercises: Exercise[];
  equipment: Equipment[];
  previous: PreviousSets;
  ratings: RatingMap;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [picker, setPicker] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState(false);
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const exById = new Map(exercises.map((e) => [e.id, e]));
  const eqById = new Map(equipment.map((e) => [e.id, e]));

  // Klocka för passtid och vilotimer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // Håll skärmen tänd under passet (där det stöds)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const request = () => nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    request();
    const onVis = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  // Vilotimer klar → vibrera och pip
  const restLeft = rest ? Math.ceil((rest.endsAt - now) / 1000) : 0;
  const alerted = useRef(false);
  useEffect(() => {
    if (!rest) {
      alerted.current = false;
      return;
    }
    if (restLeft <= 0 && !alerted.current) {
      alerted.current = true;
      try {
        navigator.vibrate?.([200, 100, 200]);
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch {
        /* ignorera */
      }
      setTimeout(() => setRest(null), 2500);
    }
  }, [restLeft, rest]);

  function persistSet(set: WorkoutSet, immediate = false) {
    const timers = saveTimers.current;
    clearTimeout(timers.get(set.id));
    const run = async () => {
      const { error } = await supabase
        .from("gym_sets")
        .update({
          reps: set.reps,
          weight_kg: set.weight_kg,
          duration_seconds: set.duration_seconds,
          distance_m: set.distance_m,
          completed: set.completed,
        })
        .eq("id", set.id);
      setSaveError(Boolean(error));
    };
    if (immediate) run();
    else timers.set(set.id, setTimeout(run, 700));
  }

  function updateSet(itemId: string, setId: string, patch: Partial<WorkoutSet>, immediate = false) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          sets: it.sets.map((s) => {
            if (s.id !== setId) return s;
            const next = { ...s, ...patch };
            persistSet(next, immediate);
            return next;
          }),
        };
      }),
    );
  }

  function toggleDone(item: Item, set: WorkoutSet) {
    const done = !set.completed;
    updateSet(item.id, set.id, { completed: done }, true);
    const ex = exById.get(item.exercise_id);
    if (done && ex?.measure !== "cardio") {
      const isLast = item.sets.every((s) => s.id === set.id || s.completed);
      const restSec = isLast ? Math.min(item.rest_seconds, 120) : item.rest_seconds;
      setRest({ endsAt: Date.now() + restSec * 1000, total: restSec });
    }
  }

  async function addSet(item: Item) {
    const last = item.sets[item.sets.length - 1];
    const { data, error } = await supabase
      .from("gym_sets")
      .insert({
        workout_exercise_id: item.id,
        set_number: (last?.set_number ?? 0) + 1,
        reps: last?.reps ?? null,
        weight_kg: last?.weight_kg ?? null,
        duration_seconds: last?.duration_seconds ?? null,
        distance_m: last?.distance_m ?? null,
        target_reps: last?.target_reps ?? null,
        target_seconds: last?.target_seconds ?? null,
      })
      .select("*")
      .single();
    if (error || !data) return setSaveError(true);
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, sets: [...it.sets, data as WorkoutSet] } : it)));
  }

  async function removeSet(item: Item, set: WorkoutSet) {
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, sets: it.sets.filter((s) => s.id !== set.id) } : it)));
    await supabase.from("gym_sets").delete().eq("id", set.id);
  }

  async function removeItem(item: Item) {
    if (!confirm(`Ta bort ${exById.get(item.exercise_id)?.name ?? "övningen"} från passet?`)) return;
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    await supabase.from("gym_workout_exercises").delete().eq("id", item.id);
  }

  function saveItemNotes(item: Item, value: string) {
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, notes: value } : it)));
    clearTimeout(saveTimers.current.get(item.id));
    saveTimers.current.set(
      item.id,
      setTimeout(() => supabase.from("gym_workout_exercises").update({ notes: value }).eq("id", item.id).then(), 800),
    );
  }

  function addExercise(ex: Exercise) {
    setPicker(false);
    startTransition(async () => {
      const res = await addExerciseToWorkoutAction(workout.id, ex.id);
      setItems((prev) => [...prev, { ...res.workoutExercise, sets: res.sets }]);
    });
  }

  async function flushSaves() {
    // Spara allt som väntar innan passet avslutas
    const pendingSets = items.flatMap((it) => it.sets);
    saveTimers.current.forEach((t) => clearTimeout(t));
    saveTimers.current.clear();
    await Promise.all(
      pendingSets.map((s) =>
        supabase
          .from("gym_sets")
          .update({ reps: s.reps, weight_kg: s.weight_kg, duration_seconds: s.duration_seconds, distance_m: s.distance_m, completed: s.completed })
          .eq("id", s.id),
      ),
    );
    await Promise.all(items.map((it) => supabase.from("gym_workout_exercises").update({ notes: it.notes }).eq("id", it.id)));
  }

  function finish() {
    startTransition(async () => {
      await flushSaves();
      await finishWorkoutAction(workout.id, notes);
    });
  }

  function abort() {
    if (!confirm("Avbryta och radera passet? Inget sparas.")) return;
    startTransition(async () => {
      await deleteWorkoutAction(workout.id);
    });
  }

  const elapsed = (now - Date.parse(workout.started_at)) / 1000;
  const totalSets = items.reduce((n, it) => n + it.sets.length, 0);
  const doneSets = items.reduce((n, it) => n + it.sets.filter((s) => s.completed).length, 0);

  return (
    <div className="space-y-4 pb-24">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Pågående pass</p>
          <h1 className="h-display text-3xl">{workout.title}</h1>
        </div>
        <div className="text-right">
          <p className="h-display text-3xl tabular">{formatClock(elapsed)}</p>
          <p className="text-xs text-muted tabular">
            {doneSets}/{totalSets} set
          </p>
        </div>
      </header>

      {saveError && (
        <p className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          Kunde inte spara senaste ändringen. Kontrollera uppkopplingen.
        </p>
      )}

      {items.length === 0 && <p className="card text-muted">Inga övningar ännu. Lägg till din första nedan.</p>}

      {items.map((item) => {
        const ex = exById.get(item.exercise_id);
        if (!ex) return null;
        const prev = previous[item.exercise_id];
        const allDone = item.sets.length > 0 && item.sets.every((s) => s.completed);
        return (
          <article key={item.id} className={`card space-y-3 ${allDone ? "border-accent/40" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{ex.name}</h2>
                <p className="text-sm text-muted">
                  {eqById.get(ex.equipment_id)?.emoji} {muscleLabel(ex.primary_muscle)}
                  {ex.unilateral && " · reps per sida"}
                  {ex.equipment_id === "hantlar" && ex.measure === "weight_reps" && " · kg per hantel"}
                </p>
                {prev && prev.sets.length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    Förra ({formatDate(prev.date, { day: "numeric", month: "short", timeZone: "Europe/Stockholm" })}):{" "}
                    {prev.sets.map((s) => describeSet(ex, s)).join(", ")}
                  </p>
                )}
              </div>
              <button onClick={() => removeItem(item)} className="px-2 text-muted" aria-label="Ta bort övning">
                ✕
              </button>
            </div>

            <HowToToggle name={ex.name} description={ex.description} />

            <div className="space-y-2">
              <SetHeader measure={ex.measure} />
              {item.sets.map((set, idx) => (
                <div
                  key={set.id}
                  className={`grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-xl ${set.completed ? "opacity-70" : ""}`}
                >
                  <button
                    className="text-center text-sm text-muted"
                    onClick={() => item.sets.length > 1 && confirm("Ta bort setet?") && removeSet(item, set)}
                    aria-label={`Set ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                  <SetInputs ex={ex} set={set} onChange={(patch) => updateSet(item.id, set.id, patch)} />
                  <button
                    onClick={() => toggleDone(item, set)}
                    className={`h-11 rounded-xl border text-lg font-bold ${
                      set.completed ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface-2 text-muted"
                    }`}
                    aria-label={set.completed ? "Markera som ej klar" : "Markera som klar"}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="btn-ghost flex-1 py-2 text-sm" onClick={() => addSet(item)}>
                ＋ Set
              </button>
              <RestPicker
                value={item.rest_seconds}
                onChange={(v) => {
                  setItems((p) => p.map((it) => (it.id === item.id ? { ...it, rest_seconds: v } : it)));
                  supabase.from("gym_workout_exercises").update({ rest_seconds: v }).eq("id", item.id).then();
                }}
              />
            </div>
            <textarea
              className="input min-h-0 py-2 text-sm"
              rows={1}
              placeholder="Anteckning…"
              value={item.notes}
              onChange={(e) => saveItemNotes(item, e.target.value)}
            />
          </article>
        );
      })}

      <button className="btn-ghost w-full" onClick={() => setPicker(true)} disabled={pending}>
        ＋ Lägg till övning
      </button>

      <div className="card space-y-2">
        <label className="label" htmlFor="wnotes">Anteckningar om passet</label>
        <textarea
          id="wnotes"
          className="input"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Hur kändes det?"
        />
      </div>

      {confirmFinish ? (
        <div className="card space-y-3 border-accent">
          <p>
            Avsluta passet? {doneSets < totalSets && `${totalSets - doneSets} set är inte markerade som klara och tas bort.`}
          </p>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setConfirmFinish(false)}>
              Fortsätt träna
            </button>
            <button className="btn-primary flex-1" onClick={finish} disabled={pending}>
              {pending ? "Sparar…" : "Avsluta"}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-primary w-full py-4 text-lg" onClick={() => setConfirmFinish(true)} disabled={pending}>
          Avsluta passet
        </button>
      )}
      <button className="w-full py-2 text-sm text-danger" onClick={abort} disabled={pending}>
        Avbryt och radera passet
      </button>

      {rest && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 shadow-xl shadow-black/50">
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-line)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="3"
                  strokeDasharray={100.5}
                  strokeDashoffset={100.5 * (1 - Math.max(0, restLeft) / rest.total)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">{restLeft > 0 ? "Vila" : "Dags!"}</p>
              <p className="h-display text-3xl tabular">{restLeft > 0 ? formatClock(restLeft) : "Kör 💪"}</p>
            </div>
            <button
              className="btn-ghost px-3 py-2 text-sm"
              onClick={() => setRest((r) => (r ? { endsAt: r.endsAt + 15000, total: r.total + 15 } : r))}
            >
              +15 s
            </button>
            <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setRest(null)}>
              Hoppa
            </button>
          </div>
        </div>
      )}

      {picker && (
        <ExercisePicker
          exercises={exercises}
          equipment={equipment.filter((e) => e.enabled)}
          ratings={ratings}
          title="Lägg till övning"
          excludeIds={items.map((i) => i.exercise_id)}
          onPick={addExercise}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}

function describeSet(
  ex: Exercise,
  s: { reps: number | null; weight_kg: number | null; duration_seconds: number | null; distance_m: number | null },
) {
  switch (ex.measure) {
    case "weight_reps":
      return `${s.weight_kg != null ? Number(s.weight_kg) : "–"}×${s.reps ?? "–"}`;
    case "reps":
      return `${s.reps ?? "–"}${s.weight_kg ? ` (+${Number(s.weight_kg)} kg)` : ""}`;
    case "time":
      return `${s.duration_seconds ?? "–"} s`;
    case "cardio":
      return `${Math.round((s.duration_seconds ?? 0) / 60)} min${s.distance_m ? ` / ${s.distance_m} m` : ""}`;
  }
}

function SetHeader({ measure }: { measure: Exercise["measure"] }) {
  const cols: Record<Exercise["measure"], [string, string]> = {
    weight_reps: ["Kg", "Reps"],
    reps: ["Reps", "Extra kg"],
    time: ["Sekunder", ""],
    cardio: ["Minuter", "Meter"],
  };
  const [a, b] = cols[measure];
  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 text-xs text-muted">
      <span className="text-center">Set</span>
      <span>{a}</span>
      <span>{b}</span>
      <span />
    </div>
  );
}

function SetInputs({ ex, set, onChange }: { ex: Exercise; set: WorkoutSet; onChange: (p: Partial<WorkoutSet>) => void }) {
  const num = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));
  const cls = "input h-11 py-0 text-center text-lg tabular";
  switch (ex.measure) {
    case "weight_reps":
      return (
        <>
          <input className={cls} type="number" inputMode="decimal" step="0.5" value={set.weight_kg ?? ""} placeholder="kg" onChange={(e) => onChange({ weight_kg: num(e.target.value) })} />
          <input className={cls} type="number" inputMode="numeric" value={set.reps ?? ""} placeholder={set.target_reps ? String(set.target_reps) : "reps"} onChange={(e) => onChange({ reps: num(e.target.value) })} />
        </>
      );
    case "reps":
      return (
        <>
          <input className={cls} type="number" inputMode="numeric" value={set.reps ?? ""} placeholder={set.target_reps ? String(set.target_reps) : "reps"} onChange={(e) => onChange({ reps: num(e.target.value) })} />
          <input className={cls} type="number" inputMode="decimal" step="0.5" value={set.weight_kg ?? ""} placeholder="–" onChange={(e) => onChange({ weight_kg: num(e.target.value) })} />
        </>
      );
    case "time":
      return (
        <>
          <input className={cls} type="number" inputMode="numeric" value={set.duration_seconds ?? ""} placeholder="sek" onChange={(e) => onChange({ duration_seconds: num(e.target.value) })} />
          <span />
        </>
      );
    case "cardio":
      return (
        <>
          <input
            className={cls}
            type="number"
            inputMode="decimal"
            value={set.duration_seconds != null ? Math.round((set.duration_seconds / 60) * 10) / 10 : ""}
            placeholder="min"
            onChange={(e) => {
              const v = num(e.target.value);
              onChange({ duration_seconds: v == null ? null : Math.round(v * 60) });
            }}
          />
          <input className={cls} type="number" inputMode="numeric" value={set.distance_m ?? ""} placeholder="m" onChange={(e) => onChange({ distance_m: num(e.target.value) })} />
        </>
      );
  }
}

function RestPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const options = [...new Set([30, 45, 60, 90, 120, 150, 180, value])].sort((a, b) => a - b);
  return (
    <label className="btn-ghost relative flex-1 py-2 text-sm">
      ⏱ Vila {formatClock(value)}
      <select
        className="absolute inset-0 opacity-0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Vilotid"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {formatClock(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

