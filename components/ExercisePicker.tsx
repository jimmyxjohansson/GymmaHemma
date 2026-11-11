"use client";

import { useMemo, useState } from "react";
import { ExerciseThumb } from "./ExerciseDemo";
import { PrefBadge } from "./RateExercise";
import { MUSCLES, muscleLabel } from "@/lib/labels";
import type { Equipment, Exercise, Muscle, RatingMap } from "@/lib/types";

export default function ExercisePicker({
  exercises,
  equipment,
  title = "Välj övning",
  initialMuscle,
  excludeIds = [],
  ratings = {},
  onPick,
  onClose,
}: {
  exercises: Exercise[];
  equipment: Equipment[];
  title?: string;
  initialMuscle?: Muscle;
  excludeIds?: string[];
  ratings?: RatingMap;
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [eq, setEq] = useState<string | null>(null);
  const [muscle, setMuscle] = useState<Muscle | null>(initialMuscle ?? null);
  const [favOnly, setFavOnly] = useState(false);
  const hasFavorites = Object.values(ratings).some((r) => r.favorite);
  const eqById = new Map(equipment.map((e) => [e.id, e]));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Favoriter först, sedan högst betyg, sedan namn
    const rank = (e: Exercise) => (ratings[e.id]?.favorite ? 10 : 0) + (ratings[e.id]?.rating ?? 0);
    return exercises
      .filter(
        (e) =>
          !excludeIds.includes(e.id) &&
          eqById.has(e.equipment_id) &&
          (!eq || e.equipment_id === eq) &&
          (!muscle || e.primary_muscle === muscle) &&
          (!favOnly || ratings[e.id]?.favorite) &&
          (!q || e.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name, "sv"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, query, eq, muscle, favOnly, ratings, excludeIds.join(",")]);

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
          <div className="flex items-center gap-2">
            <FilterSelect
              icon="🏋️"
              label="Redskap"
              value={eq ?? ""}
              onChange={(v) => setEq(v || null)}
              options={equipment.map((e) => ({ value: e.id, label: `${e.emoji} ${e.name}`, short: e.name }))}
            />
            <FilterSelect
              icon="💪"
              label="Muskel"
              value={muscle ?? ""}
              onChange={(v) => setMuscle((v || null) as Muscle | null)}
              options={MUSCLES.map((m) => ({ value: m, label: muscleLabel(m) }))}
            />
            {hasFavorites && (
              <button
                type="button"
                onClick={() => setFavOnly(!favOnly)}
                aria-pressed={favOnly}
                aria-label="Visa bara favoriter"
                title="Visa bara favoriter"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg transition ${
                  favOnly ? "border-danger bg-danger/15 text-danger" : "border-line bg-surface-2 text-muted"
                }`}
              >
                {favOnly ? "♥" : "♡"}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{list.length} övningar</span>
            {(eq || muscle || favOnly || query) && (
              <button
                type="button"
                className="text-accent"
                onClick={() => {
                  setEq(null);
                  setMuscle(null);
                  setFavOnly(false);
                  setQuery("");
                }}
              >
                Rensa filter
              </button>
            )}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {list.length === 0 && <li className="py-6 text-center text-muted">Inga övningar matchar.</li>}
          {list.map((e) => (
            <li key={e.id}>
              <button
                className="flex w-full items-center gap-3 border-b border-line py-3 text-left"
                onClick={() => onPick(e)}
              >
                <ExerciseThumb name={e.name} className="h-10 w-14 shrink-0" />
                <span className="flex-1">
                  <span className="block font-medium">{e.name}</span>
                  <span className="text-sm text-muted">
                    {eqById.get(e.equipment_id)?.emoji} {eqById.get(e.equipment_id)?.name} · {muscleLabel(e.primary_muscle)}
                  </span>
                </span>
                <PrefBadge pref={ratings[e.id]} />
                <span className="text-accent">＋</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Kompakt rullgardin som ser ut som en knapp. Native <select> ger bra väljare på mobilen. */
function FilterSelect({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: string;
  label: string;
  value: string;
  options: { value: string; label: string; short?: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  const active = Boolean(current);
  return (
    <label
      className={`relative flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-xl border px-3 text-sm transition ${
        active ? "border-accent bg-accent/10 text-ink" : "border-line bg-surface-2 text-muted"
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span className="truncate">
        {label}: <span className={active ? "font-semibold text-ink" : ""}>{current ? (current.short ?? current.label) : "Alla"}</span>
      </span>
      <span aria-hidden className="ml-auto pl-1 text-xs">▾</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Alla</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
