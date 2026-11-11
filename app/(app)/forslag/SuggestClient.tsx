"use client";

import { useEffect, useState, useTransition } from "react";
import DayPicker from "@/components/DayPicker";
import PlanItemsEditor from "@/components/PlanItemsEditor";
import { addDays, dayLabel, localYmd } from "@/lib/dates";
import { FOCUS_LABELS, GOAL_LABELS, formatDuration } from "@/lib/labels";
import type { Equipment, Exercise, Focus, Goal, PlannedExercise, RatingMap } from "@/lib/types";
import { startWorkoutAction, suggestAction } from "../actions";

const MINUTES = [20, 30, 45, 60, 75];
const STORAGE_KEY = "gymma-forslag";

type Prefs = { minutes: number; focus: Focus; goal: Goal; equipment: string[] };
type Plan = { title: string; items: PlannedExercise[]; estimatedMinutes: number };

export default function SuggestClient({
  equipment,
  exercises,
  ratings,
  empty,
}: {
  equipment: Equipment[];
  exercises: Exercise[];
  ratings: RatingMap;
  empty: boolean;
}) {
  const [prefs, setPrefs] = useState<Prefs>({
    minutes: 45,
    focus: "helkropp",
    goal: "muskler",
    equipment: equipment.map((e) => e.id),
  });
  const [plan, setPlan] = useState<Plan | null>(empty ? { title: "Eget pass", items: [], estimatedMinutes: 0 } : null);
  const [pending, startTransition] = useTransition();
  const [starting, startStarting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [day, setDay] = useState<string>(() => localYmd(addDays(new Date(), 1)));

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

  const setItems = (fn: (items: PlannedExercise[]) => PlannedExercise[]) =>
    setPlan((p) => (p ? { ...p, items: fn(p.items) } : p));

  /** Startar passet nu, eller sparar det till vald dag om `scheduleFor` anges. */
  function start(scheduleFor?: string) {
    if (!plan) return;
    startStarting(async () => {
      await startWorkoutAction({
        title: plan.title,
        focus: empty ? null : prefs.focus,
        goal: empty ? null : prefs.goal,
        minutes: empty ? null : prefs.minutes,
        items: plan.items,
        scheduleFor: scheduleFor ?? null,
      });
    });
  }

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

          <PlanItemsEditor
            items={plan.items}
            setItems={setItems}
            exercises={exercises}
            equipment={equipment}
            ratings={ratings}
            goal={prefs.goal}
            options={prefs}
          />

          {scheduling ? (
            <div className="card space-y-3 border-accent">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Spara till vilken dag?</h3>
                <button className="text-sm text-muted" onClick={() => setScheduling(false)}>
                  Avbryt
                </button>
              </div>
              <DayPicker value={day} onChange={setDay} />
              <button className="btn-primary w-full" onClick={() => start(day)} disabled={starting || !plan.items.length}>
                {starting ? "Sparar…" : `Spara passet till ${dayLabel(day)}`}
              </button>
            </div>
          ) : (
            <div className="sticky bottom-20 grid grid-cols-[1fr_auto] gap-2 pt-2">
              <button className="btn-primary py-4 text-lg shadow-lg shadow-black/40" onClick={() => start()} disabled={starting}>
                {starting ? "Startar…" : `▶ Starta nu${plan.items.length ? ` (${plan.items.length})` : ""}`}
              </button>
              <button
                className="btn-ghost py-4 shadow-lg shadow-black/40"
                onClick={() => setScheduling(true)}
                disabled={starting || plan.items.length === 0}
              >
                📅 Spara
              </button>
            </div>
          )}
          {plan.items.some((p) => p.measure === "cardio") && (
            <p className="text-center text-xs text-muted">
              Konditionsblock:{" "}
              {formatDuration(plan.items.filter((p) => p.measure === "cardio").reduce((s, p) => s + (p.seconds ?? 0), 0))}
            </p>
          )}
        </section>
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
