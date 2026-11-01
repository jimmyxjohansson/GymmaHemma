"use client";

import { useActionState } from "react";
import { saveExerciseAction, type ExerciseFormState } from "@/app/(app)/ovningar/actions";
import { MEASURE_LABELS, MUSCLES, muscleLabel } from "@/lib/labels";
import type { Equipment, Exercise, Measure } from "@/lib/types";

export default function ExerciseForm({ equipment, exercise }: { equipment: Equipment[]; exercise?: Exercise }) {
  const [state, action, pending] = useActionState<ExerciseFormState, FormData>(saveExerciseAction, {});
  return (
    <form action={action} className="space-y-4">
      {exercise && <input type="hidden" name="id" value={exercise.id} />}
      <div>
        <label className="label" htmlFor="name">Namn</label>
        <input id="name" name="name" className="input" defaultValue={exercise?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="equipment_id">Redskap</label>
          <select id="equipment_id" name="equipment_id" className="input" defaultValue={exercise?.equipment_id ?? equipment[0]?.id}>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>
                {e.emoji} {e.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="primary_muscle">Huvudmuskel</label>
          <select id="primary_muscle" name="primary_muscle" className="input" defaultValue={exercise?.primary_muscle ?? "chest"}>
            {MUSCLES.map((m) => (
              <option key={m} value={m}>
                {muscleLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="measure">Loggas som</label>
        <select id="measure" name="measure" className="input" defaultValue={exercise?.measure ?? "weight_reps"}>
          {(Object.keys(MEASURE_LABELS) as Measure[]).map((m) => (
            <option key={m} value={m}>
              {MEASURE_LABELS[m]}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="label">Andra muskler som jobbar</legend>
        <div className="flex flex-wrap gap-2">
          {MUSCLES.map((m) => (
            <label key={m} className="chip has-[:checked]:chip-on cursor-pointer">
              <input
                type="checkbox"
                name="secondary_muscles"
                value={m}
                defaultChecked={exercise?.secondary_muscles.includes(m)}
                className="sr-only"
              />
              {muscleLabel(m)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input type="checkbox" name="is_compound" defaultChecked={exercise?.is_compound} className="h-5 w-5 accent-[var(--color-accent)]" />
          <span>Basövning (flerledsövning, prioriteras först i passen)</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="unilateral" defaultChecked={exercise?.unilateral} className="h-5 w-5 accent-[var(--color-accent)]" />
          <span>En sida i taget (reps per arm/ben)</span>
        </label>
      </div>
      <div>
        <label className="label" htmlFor="description">Utförande / tips</label>
        <textarea id="description" name="description" rows={3} className="input" defaultValue={exercise?.description} />
      </div>
      {state.error && <p className="rounded-lg bg-danger/15 p-3 text-sm text-danger">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Sparar…" : exercise ? "Spara ändringar" : "Lägg till övning"}
      </button>
    </form>
  );
}
