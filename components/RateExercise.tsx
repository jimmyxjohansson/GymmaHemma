"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ExercisePref } from "@/lib/types";

/**
 * Personligt betyg (1–5 stjärnor) och favorit-hjärta för en övning.
 * Sparas direkt; tryck på samma stjärna igen för att ta bort betyget.
 */
export default function RateExercise({
  exerciseId,
  userId,
  initial,
}: {
  exerciseId: string;
  userId: string;
  initial?: ExercisePref;
}) {
  const [pref, setPref] = useState<ExercisePref>(initial ?? { rating: null, favorite: false });
  const [error, setError] = useState(false);

  async function save(next: ExercisePref) {
    const prev = pref;
    setPref(next);
    setError(false);
    const { error } = await createClient()
      .from("gym_exercise_ratings")
      .upsert(
        { user_id: userId, exercise_id: exerciseId, rating: next.rating, favorite: next.favorite, updated_at: new Date().toISOString() },
        { onConflict: "user_id,exercise_id" },
      );
    if (error) {
      setPref(prev);
      setError(true);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Ditt betyg">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = (pref.rating ?? 0) >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={pref.rating === n}
                aria-label={`${n} av 5`}
                onClick={() => save({ ...pref, rating: pref.rating === n ? null : n })}
                className={`text-3xl leading-none transition active:scale-90 ${on ? "text-accent" : "text-line"}`}
              >
                ★
              </button>
            );
          })}
          <span className="ml-2 text-sm text-muted">{pref.rating ? RATING_TEXT[pref.rating] : "Inget betyg"}</span>
        </div>
        <button
          type="button"
          onClick={() => save({ ...pref, favorite: !pref.favorite })}
          aria-pressed={pref.favorite}
          aria-label={pref.favorite ? "Ta bort från favoriter" : "Lägg till som favorit"}
          className={`flex items-center gap-1 rounded-full border px-3 py-2 text-sm transition active:scale-95 ${
            pref.favorite ? "border-danger bg-danger/15 text-danger" : "border-line bg-surface-2 text-muted"
          }`}
        >
          <span className="text-lg leading-none">{pref.favorite ? "♥" : "♡"}</span>
          {pref.favorite ? "Favorit" : "Favorit?"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">Kunde inte spara. Försök igen.</p>}
    </div>
  );
}

const RATING_TEXT: Record<number, string> = {
  1: "Gillar inte",
  2: "Sådär",
  3: "Okej",
  4: "Bra",
  5: "Älskar den",
};

/** Liten visning av favorit och betyg i listor. */
export function PrefBadge({ pref }: { pref?: ExercisePref }) {
  if (!pref || (!pref.favorite && !pref.rating)) return null;
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-sm">
      {pref.favorite && <span className="text-danger" aria-label="Favorit">♥</span>}
      {pref.rating && (
        <span className="text-accent tabular" aria-label={`Betyg ${pref.rating} av 5`}>
          ★{pref.rating}
        </span>
      )}
    </span>
  );
}
