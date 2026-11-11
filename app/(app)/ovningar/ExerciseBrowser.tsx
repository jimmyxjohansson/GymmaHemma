"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExerciseThumb } from "@/components/ExerciseDemo";
import { PrefBadge } from "@/components/RateExercise";
import { MUSCLES, muscleLabel } from "@/lib/labels";
import type { Equipment, Exercise, Muscle, RatingMap } from "@/lib/types";

export default function ExerciseBrowser({
  exercises,
  equipment,
  ratings,
}: {
  exercises: Exercise[];
  equipment: Equipment[];
  ratings: RatingMap;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [show, setShow] = useState<"alla" | "favoriter" | "betygsatta">("alla");
  const [sortByRating, setSortByRating] = useState(false);
  const favCount = Object.values(ratings).filter((r) => r.favorite).length;
  const ratedCount = Object.values(ratings).filter((r) => r.rating).length;
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
              (show !== "favoriter" || ratings[e.id]?.favorite) &&
              (show !== "betygsatta" || ratings[e.id]?.rating) &&
              (!q || e.name.toLowerCase().includes(q)),
          ).sort((a, b) =>
            sortByRating
              ? (ratings[b.id]?.rating ?? 0) - (ratings[a.id]?.rating ?? 0) || a.name.localeCompare(b.name, "sv")
              : 0,
          ),
        }))
        .filter((g) => g.list.length > 0),
    [equipment, exercises, muscle, q, show, sortByRating, ratings],
  );

  return (
    <div className="space-y-4">
      <input className="input" placeholder="Sök…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <button className={`chip ${show === "alla" ? "chip-on" : ""}`} onClick={() => setShow("alla")}>
          Alla
        </button>
        <button className={`chip ${show === "favoriter" ? "chip-on" : ""}`} onClick={() => setShow("favoriter")}>
          ♥ Mina favoriter ({favCount})
        </button>
        <button className={`chip ${show === "betygsatta" ? "chip-on" : ""}`} onClick={() => setShow("betygsatta")}>
          ★ Betygsatta ({ratedCount})
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={sortByRating} onChange={(e) => setSortByRating(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
          Sortera efter betyg
        </label>
      </div>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={`chip shrink-0 ${muscle === null ? "chip-on" : ""}`} onClick={() => setMuscle(null)}>
          Alla muskler
        </button>
        {MUSCLES.map((m) => (
          <button key={m} className={`chip shrink-0 ${muscle === m ? "chip-on" : ""}`} onClick={() => setMuscle(muscle === m ? null : m)}>
            {muscleLabel(m)}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="card text-muted">
          {show === "favoriter"
            ? "Inga favoriter ännu. Öppna en övning och tryck på ♡ för att spara den som favorit."
            : show === "betygsatta"
              ? "Du har inte betygsatt några övningar ännu. Öppna en övning och ge den stjärnor."
              : "Inga övningar matchar."}
        </p>
      )}

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
                <Link href={`/ovningar/${e.id}`} className="flex items-center gap-3 px-4 py-3">
                  <ExerciseThumb name={e.name} className="h-12 w-16 shrink-0" />
                  <span className="flex-1">
                    <span className="block">{e.name}</span>
                    <span className="text-sm text-muted">
                      {muscleLabel(e.primary_muscle)}
                      {e.secondary_muscles.length > 0 && ` · ${e.secondary_muscles.map(muscleLabel).join(", ")}`}
                    </span>
                  </span>
                  <PrefBadge pref={ratings[e.id]} />
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
