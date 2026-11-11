"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import DayPicker from "@/components/DayPicker";
import PlanItemsEditor from "@/components/PlanItemsEditor";
import { dayLabel, localYmd } from "@/lib/dates";
import type { Equipment, Exercise, PlannedExercise, RatingMap, SuggestOptions } from "@/lib/types";
import { updatePlannedWorkoutAction } from "../../../actions";

export default function EditPlannedClient({
  workoutId,
  initialTitle,
  initialDate,
  initialItems,
  exercises,
  equipment,
  ratings,
  options,
}: {
  workoutId: string;
  initialTitle: string;
  initialDate: string | null;
  initialItems: PlannedExercise[];
  exercises: Exercise[];
  equipment: Equipment[];
  ratings: RatingMap;
  options: SuggestOptions;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [day, setDay] = useState(() => {
    const today = localYmd(new Date());
    return initialDate && initialDate >= today ? initialDate : today;
  });
  const [items, setItemsState] = useState(initialItems);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const setItems = (fn: (list: PlannedExercise[]) => PlannedExercise[]) => setItemsState((list) => fn(list));

  function save() {
    setError(null);
    startSaving(async () => {
      // Vid lyckad sparning skickar servern vidare till passets sida
      const res = await updatePlannedWorkoutAction(workoutId, { title, scheduleFor: day, items });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <Link href={`/planerat/${workoutId}`} className="text-sm text-muted">
        ← Avbryt
      </Link>
      <header>
        <p className="text-sm text-accent">Redigera sparat pass</p>
        <input
          className="h-display w-full bg-transparent text-3xl outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Passets namn"
        />
      </header>

      <section className="card space-y-2">
        <h2 className="font-semibold">Dag</h2>
        <DayPicker value={day} onChange={setDay} />
      </section>

      <section className="space-y-3">
        <h2 className="h-display text-xl">Övningar ({items.length})</h2>
        <PlanItemsEditor
          items={items}
          setItems={setItems}
          exercises={exercises}
          equipment={equipment}
          ratings={ratings}
          goal={options.goal}
          options={options}
        />
      </section>

      {error && <p className="rounded-lg bg-danger/15 p-3 text-sm text-danger">{error}</p>}

      <div className="sticky bottom-20 grid grid-cols-[auto_1fr] gap-2 pt-2">
        <Link href={`/planerat/${workoutId}`} className="btn-ghost py-4 shadow-lg shadow-black/40">
          Avbryt
        </Link>
        <button
          className="btn-primary py-4 text-lg shadow-lg shadow-black/40"
          onClick={save}
          disabled={saving || items.length === 0}
        >
          {saving ? "Sparar…" : `Spara ändringar · ${dayLabel(day)}`}
        </button>
      </div>
    </div>
  );
}
