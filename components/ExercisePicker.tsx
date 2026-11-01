"use client";

import { useMemo, useState } from "react";
import { MUSCLES, muscleLabel } from "@/lib/labels";
import type { Equipment, Exercise, Muscle } from "@/lib/types";

export default function ExercisePicker({
  exercises,
  equipment,
  title = "Välj övning",
  initialMuscle,
  excludeIds = [],
  onPick,
  onClose,
}: {
  exercises: Exercise[];
  equipment: Equipment[];
  title?: string;
  initialMuscle?: Muscle;
  excludeIds?: string[];
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [eq, setEq] = useState<string | null>(null);
  const [muscle, setMuscle] = useState<Muscle | null>(initialMuscle ?? null);
  const eqById = new Map(equipment.map((e) => [e.id, e]));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        !excludeIds.includes(e.id) &&
        eqById.has(e.equipment_id) &&
        (!eq || e.equipment_id === eq) &&
        (!muscle || e.primary_muscle === muscle) &&
        (!q || e.name.toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, query, eq, muscle, excludeIds.join(",")]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-auto flex max-h-[88dvh] w-full max-w-xl flex-col rounded-t-3xl border border-line bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="h-display text-2xl">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-muted" aria-label="Stäng">
            ✕
          </button>
        </div>
        <div className="space-y-2 px-4 pb-2">
          <input
            className="input"
            placeholder="Sök övning…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button className={`chip shrink-0 ${eq === null ? "chip-on" : ""}`} onClick={() => setEq(null)}>
              Alla redskap
            </button>
            {equipment.map((e) => (
              <button
                key={e.id}
                className={`chip shrink-0 ${eq === e.id ? "chip-on" : ""}`}
                onClick={() => setEq(eq === e.id ? null : e.id)}
              >
                {e.emoji} {e.name}
              </button>
            ))}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button className={`chip shrink-0 ${muscle === null ? "chip-on" : ""}`} onClick={() => setMuscle(null)}>
              Alla muskler
            </button>
            {MUSCLES.map((m) => (
              <button
                key={m}
                className={`chip shrink-0 ${muscle === m ? "chip-on" : ""}`}
                onClick={() => setMuscle(muscle === m ? null : m)}
              >
                {muscleLabel(m)}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {list.length === 0 && <li className="py-6 text-center text-muted">Inga övningar matchar.</li>}
          {list.map((e) => (
            <li key={e.id}>
              <button
                className="flex w-full items-center justify-between border-b border-line py-3 text-left"
                onClick={() => onPick(e)}
              >
                <span>
                  <span className="block font-medium">{e.name}</span>
                  <span className="text-sm text-muted">
                    {eqById.get(e.equipment_id)?.emoji} {eqById.get(e.equipment_id)?.name} · {muscleLabel(e.primary_muscle)}
                  </span>
                </span>
                <span className="text-accent">＋</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
