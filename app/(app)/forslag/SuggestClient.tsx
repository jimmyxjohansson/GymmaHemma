"use client";

import { useEffect, useState, useTransition } from "react";
import ExercisePicker from "@/components/ExercisePicker";
import { FOCUS_LABELS, GOAL_LABELS, formatDuration, muscleLabel } from "@/lib/labels";
import type { Equipment, Exercise, Focus, Goal, PlannedExercise } from "@/lib/types";
import { planExerciseAction, startWorkoutAction, suggestAction } from "../actions";

const MINUTES = [20, 30, 45, 60, 75];
const STORAGE_KEY = "gymma-forslag";

type Prefs = { minutes: number; focus: Focus; goal: Goal; equipment: string[] };

export default function SuggestClient({
  equipment,
  exercises,
  empty,
}: {
  equipment: Equipment[];
  exercises: Exercise[];
  empty: boolean;
}) {
  const [prefs, setPrefs] = useState<Prefs>({
    minutes: 45,
    focus: "helkropp",
    goal: "muskler",
    equipment: equipment.map((e) => e.id),
  });
  const [plan, setPlan] = useState<{ title: string; items: PlannedExercise[]; estimatedMinutes: number } | null>(
    empty ? { title: "Eget pass", items: [], estimatedMinutes: 0 } : null,
  );
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "swap"; index: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [starting, startStarting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Kom ihåg senaste valen på den här enheten
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Prefs | null;
      if (saved) {
        const valid = saved.equipment.filter((id) => equipment.some((e) => e.id === id));
        setPrefs({ ...saved, equipment: valid.length ? valid : equipment.map((e) => e.id) });
      }
    } catch {
      /* ignorera */
    }
  }, [equipment]);

  function update(p: Partial<Prefs>) {
    const next = { ...prefs, ...p };
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignorera */
    }
  }

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await suggestAction(prefs);
        if (res.items.length === 0) setError("Hittade inga övningar för de valen. Testa fler redskap.");
        setPlan(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Något gick fel");
      }
    });
  }

  function setItem(index: number, patch: Partial<PlannedExercise>) {
    if (!plan) return;
    setPlan({ ...plan, items: plan.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  }

  function move(index: number, dir: -1 | 1) {
    if (!plan) return;
    const items = [...plan.items];
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    [items[index], items[j]] = [items[j], items[index]];
    setPlan({ ...plan, items });
  }

  function pick(ex: Exercise) {
    if (!plan || !picker) return;
    const swapIndex = picker.mode === "swap" ? picker.index : -1;
    const current = swapIndex >= 0 ? plan.items[swapIndex] : undefined;
    setPicker(null);
    startTransition(async () => {
      const planned = await planExerciseAction(
        ex.id,
        prefs.goal,
        current ? { sets: current.sets, reps: current.reps, rest_seconds: current.rest_seconds } : undefined,
      );
      setPlan((p) => {
        if (!p) return p;
        if (swapIndex >= 0) {
          return { ...p, items: p.items.map((it, i) => (i === swapIndex ? planned : it)) };
        }
        return { ...p, items: [...p.items, planned] };
      });
    });
  }

  function start() {
    if (!plan) return;
    startStarting(async () => {
      await startWorkoutAction({
        title: plan.title,
        focus: empty ? null : prefs.focus,
        goal: empty ? null : prefs.goal,
        minutes: empty ? null : prefs.minutes,
        items: plan.items,
      });
    });
  }

  const eqById = new Map(equipment.map((e) => [e.id, e]));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="h-display text-4xl">{empty ? "Eget pass" : "Nytt pass"}</h1>
        {!empty && <p className="text-muted">Välj förutsättningar så sätter appen ihop ett pass.</p>}
      </header>

      {!empty && (
        <section className="card space-y-4">
          <Field label="Tid">
            <div className="flex flex-wrap gap-2">
              {MINUTES.map((m) => (
                <button key={m} className={`chip ${prefs.minutes === m ? "chip-on" : ""}`} onClick={() => update({ minutes: m })}>
                  {m} min
                </button>
              ))}
            </div>
          </Field>
          <Field label="Fokus">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FOCUS_LABELS) as Focus[]).map((f) => (
                <button key={f} className={`chip ${prefs.focus === f ? "chip-on" : ""}`} onClick={() => update({ focus: f })}>
                  {FOCUS_LABELS[f]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Mål">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                <button
                  key={g}
                  className={`rounded-xl border p-2 text-left ${prefs.goal === g ? "border-accent bg-accent/10" : "border-line bg-surface-2"}`}
                  onClick={() => update({ goal: g })}
                >
                  <span className="block font-semibold">{GOAL_LABELS[g].label}</span>
                  <span className="text-xs text-muted">{GOAL_LABELS[g].desc}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Redskap idag">
            <div className="flex flex-wrap gap-2">
              {equipment.map((e) => {
                const on = prefs.equipment.includes(e.id);
                return (
                  <button
                    key={e.id}
                    className={`chip ${on ? "chip-on" : ""}`}
                    onClick={() =>
                      update({ equipment: on ? prefs.equipment.filter((x) => x !== e.id) : [...prefs.equipment, e.id] })
                    }
                  >
                    {e.emoji} {e.name}
                  </button>
                );
              })}
            </div>
          </Field>
          <button className="btn-primary w-full" onClick={generate} disabled={pending || prefs.equipment.length === 0}>
            {pending ? "Sätter ihop…" : plan ? "Föreslå ett nytt" : "Föreslå pass"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </section>
      )}

      {plan && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <input
              className="h-display w-full bg-transparent text-2xl outline-none"
              value={plan.title}
              onChange={(e) => setPlan({ ...plan, title: e.target.value })}
              aria-label="Passets namn"
            />
            {plan.estimatedMinutes > 0 && <span className="shrink-0 text-sm text-muted">ca {plan.estimatedMinutes} min</span>}
          </div>

          {plan.items.map((it, i) => (
            <article key={`${it.exercise_id}-${i}`} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{it.name}</h3>
                  <p className="text-sm text-muted">
                    {eqById.get(it.equipment_id)?.emoji} {muscleLabel(it.primary_muscle)}
                    {it.unilateral && " · per sida"}
                  </p>
                  {it.hint && <p className="mt-1 text-xs text-accent">{it.hint}</p>}
                </div>
                <div className="flex shrink-0 gap-1 text-muted">
                  <IconBtn label="Flytta upp" onClick={() => move(i, -1)}>↑</IconBtn>
                  <IconBtn label="Flytta ned" onClick={() => move(i, 1)}>↓</IconBtn>
                  <IconBtn label="Byt övning" onClick={() => setPicker({ mode: "swap", index: i })}>⇄</IconBtn>
                  <IconBtn label="Ta bort" onClick={() => setPlan({ ...plan, items: plan.items.filter((_, j) => j !== i) })}>✕</IconBtn>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {it.measure !== "cardio" && (
                  <NumField label="Set" value={it.sets} onChange={(v) => setItem(i, { sets: Math.max(1, Math.min(10, v ?? 1)) })} />
                )}
                {(it.measure === "weight_reps" || it.measure === "reps") && (
                  <NumField label="Reps" value={it.reps} onChange={(v) => setItem(i, { reps: v })} />
                )}
                {it.measure === "weight_reps" && (
                  <NumField label="Kg" value={it.weight_kg} step={0.5} onChange={(v) => setItem(i, { weight_kg: v })} />
                )}
                {it.measure === "time" && (
                  <NumField label="Sekunder" value={it.seconds} onChange={(v) => setItem(i, { seconds: v })} />
                )}
                {it.measure === "cardio" && (
                  <NumField
                    label="Minuter"
                    value={it.seconds != null ? Math.round(it.seconds / 60) : null}
                    onChange={(v) => setItem(i, { seconds: v != null ? v * 60 : null })}
                  />
                )}
                {it.measure !== "cardio" && (
                  <NumField label="Vila (s)" value={it.rest_seconds} onChange={(v) => setItem(i, { rest_seconds: v ?? 60 })} />
                )}
              </div>
            </article>
          ))}

          <button className="btn-ghost w-full" onClick={() => setPicker({ mode: "add" })} disabled={pending}>
            ＋ Lägg till övning
          </button>

          <div className="sticky bottom-20 pt-2">
            <button className="btn-primary w-full py-4 text-lg shadow-lg shadow-black/40" onClick={start} disabled={starting}>
              {starting ? "Startar…" : `Starta passet${plan.items.length ? ` (${plan.items.length} övningar)` : ""}`}
            </button>
          </div>
          {plan.items.some((p) => p.measure === "cardio") && (
            <p className="text-center text-xs text-muted">
              Konditionsblock: {formatDuration(plan.items.filter((p) => p.measure === "cardio").reduce((s, p) => s + (p.seconds ?? 0), 0))}
            </p>
          )}
        </section>
      )}

      {picker && plan && (
        <ExercisePicker
          exercises={exercises}
          equipment={equipment}
          title={picker.mode === "swap" ? "Byt övning" : "Lägg till övning"}
          initialMuscle={picker.mode === "swap" ? plan.items[picker.index]?.primary_muscle : undefined}
          excludeIds={plan.items.map((p) => p.exercise_id)}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{label}</p>
      {children}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="h-8 w-8 rounded-lg bg-surface-2 text-sm hover:text-ink">
      {children}
    </button>
  );
}

function NumField({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number | null;
  step?: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        className="input py-2 tabular"
        value={value ?? ""}
        placeholder="–"
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value.replace(",", ".")))}
      />
    </label>
  );
}
