"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MUSCLES, muscleLabel } from "@/lib/labels";
import type { Equipment, Exercise, Muscle } from "@/lib/types";

export default function ExerciseBrowser({ exercises, equipment }: { exercises: Exercise[]; equipment: Equipment[] }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      equipment
        .map((eq) => ({
          eq,
          list: exercises.filter(
            (e) =>
              e.equipment_id === eq.id &&
              (!muscle || e.primary_muscle === muscle) &&
              (!q || e.name.toLowerCase().includes(q)),
          ),
        }))
        .filter((g) => g.list.length > 0),
    [equipment, exercises, muscle, q],
  );

  return (
    <div className="space-y-4">
      <input className="input" placeholder="Sök…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={`chip shrink-0 ${muscle === null ? "chip-on" : ""}`} onClick={() => setMuscle(null)}>
          Alla
        </button>
        {MUSCLES.map((m) => (
          <button key={m} className={`chip shrink-0 ${muscle === m ? "chip-on" : ""}`} onClick={() => setMuscle(muscle === m ? null : m)}>
            {muscleLabel(m)}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="card text-muted">Inga övningar matchar.</p>}

      {groups.map(({ eq, list }) => (
        <section key={eq.id}>
          <h2 className="h-display mb-2 flex items-center gap-2 text-xl">
            <span>{eq.emoji}</span> {eq.name}
            <span className="text-sm font-normal normal-case text-muted">({list.length})</span>
            {!eq.enabled && <span className="text-xs font-normal normal-case text-danger">avstängt</span>}
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {list.map((e) => (
              <li key={e.id}>
                <Link href={`/ovningar/${e.id}`} className="flex items-center justify-between px-4 py-3">
                  <span>
                    <span className="block">{e.name}</span>
                    <span className="text-sm text-muted">
                      {muscleLabel(e.primary_muscle)}
                      {e.secondary_muscles.length > 0 && ` · ${e.secondary_muscles.map(muscleLabel).join(", ")}`}
                    </span>
                  </span>
                  <span className="text-muted">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
