"use client";

import { useState, useTransition } from "react";
import { planExerciseAction, replaceSuggestionAction } from "@/app/(app)/actions";
import { HowToToggle } from "@/components/ExerciseDemo";
import ExercisePicker from "@/components/ExercisePicker";
import { muscleLabel } from "@/lib/labels";
import type { Equipment, Exercise, Goal, PlannedExercise, RatingMap, SuggestOptions } from "@/lib/types";

type SetItems = (update: (items: PlannedExercise[]) => PlannedExercise[]) => void;

/**
 * Redigerbar lista med övningar i ett pass (används i passförslaget och när ett sparat pass redigeras):
 * ändra set/reps/kg/tid/vila, flytta, ta bort, välj själv, "Föreslå ny övning" och lägg till.
 */
export default function PlanItemsEditor({
  items,
  setItems,
  exercises,
  equipment,
  ratings,
  goal,
  options,
}: {
  items: PlannedExercise[];
  setItems: SetItems;
  exercises: Exercise[];
  equipment: Equipment[];
  ratings: RatingMap;
  goal: Goal;
  /** Kriterier för "Föreslå ny övning" (redskap, mål m.m.) */
  options: SuggestOptions;
}) {
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "swap"; index: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [rerolling, setRerolling] = useState<number | null>(null);
  const [rerollMsg, setRerollMsg] = useState<{ index: number; text: string } | null>(null);
  const eqById = new Map(equipment.map((e) => [e.id, e]));

  function setItem(index: number, patch: Partial<PlannedExercise>) {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function move(index: number, dir: -1 | 1) {
    setItems((list) => {
      const next = [...list];
      const j = index + dir;
      if (j < 0 || j >= next.length) return list;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  /** Byter övningen mot en ny med samma kriterier (muskelgrupp, redskap, mål). */
  async function reroll(index: number) {
    const current = items[index];
    setRerolling(index);
    setRerollMsg(null);
    try {
      const next = await replaceSuggestionAction(options, current, items.map((p) => p.exercise_id));
      if (!next) setRerollMsg({ index, text: "Inga fler alternativ med samma muskelgrupp och redskap." });
      else setItems((list) => list.map((it, i) => (i === index ? next : it)));
    } catch {
      setRerollMsg({ index, text: "Kunde inte hämta ett nytt förslag." });
    } finally {
      setRerolling(null);
    }
  }

  function pick(ex: Exercise) {
    if (!picker) return;
    const swapIndex = picker.mode === "swap" ? picker.index : -1;
    const current = swapIndex >= 0 ? items[swapIndex] : undefined;
    setPicker(null);
    startTransition(async () => {
      const planned = await planExerciseAction(
        ex.id,
        goal,
        current ? { sets: current.sets, reps: current.reps, rest_seconds: current.rest_seconds } : undefined,
      );
      setItems((list) =>
        swapIndex >= 0 ? list.map((it, i) => (i === swapIndex ? planned : it)) : [...list, planned],
      );
    });
  }

  return (
    <>
      {items.map((it, i) => (
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
              <IconBtn label="Välj övning själv" onClick={() => setPicker({ mode: "swap", index: i })}>⇄</IconBtn>
              <IconBtn label="Ta bort" onClick={() => setItems((list) => list.filter((_, j) => j !== i))}>✕</IconBtn>
            </div>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <HowToToggle name={it.name} />
            <button
              type="button"
              onClick={() => reroll(i)}
              disabled={rerolling !== null}
              className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm disabled:opacity-60"
            >
              <span className={rerolling === i ? "inline-block animate-spin" : ""}>🎲</span>
              {rerolling === i ? "Letar…" : "Föreslå ny övning"}
            </button>
          </div>
          {rerollMsg?.index === i && <p className="text-xs text-muted">{rerollMsg.text}</p>}
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
            {it.measure === "time" && <NumField label="Sekunder" value={it.seconds} onChange={(v) => setItem(i, { seconds: v })} />}
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
        {pending ? "Lägger till…" : "＋ Lägg till övning"}
      </button>

      {picker && (
        <ExercisePicker
          exercises={exercises}
          equipment={equipment}
          ratings={ratings}
          title={picker.mode === "swap" ? "Byt övning" : "Lägg till övning"}
          initialMuscle={picker.mode === "swap" ? items[picker.index]?.primary_muscle : undefined}
          excludeIds={items.map((p) => p.exercise_id)}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </>
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
