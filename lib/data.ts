import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Equipment, Exercise, Muscle, RatingMap } from "./types";
import type { HistoryEntry } from "./suggest";

export async function getEquipment(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("gym_equipment").select("*").order("sort");
  if (error) throw error;
  return (data ?? []) as Equipment[];
}

export async function getExercises(supabase: SupabaseClient, includeArchived = false) {
  let q = supabase.from("gym_exercises").select("*").order("name");
  if (!includeArchived) q = q.eq("archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Exercise[];
}

/** Skapar profil första gången en användare öppnar appen. */
export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { data } = await supabase.from("gym_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (data) return data as { user_id: string; display_name: string; weekly_goal: number };
  const fallbackName = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "";
  const { data: created } = await supabase
    .from("gym_profiles")
    .insert({ user_id: user.id, display_name: fallbackName })
    .select("*")
    .single();
  return (created ?? { user_id: user.id, display_name: fallbackName, weekly_goal: 3 }) as {
    user_id: string;
    display_name: string;
    weekly_goal: number;
  };
}

type HistoryRow = {
  started_at: string;
  gym_workout_exercises: {
    exercise_id: string;
    gym_exercises: { primary_muscle: Muscle } | null;
    gym_sets: {
      reps: number | null;
      weight_kg: number | null;
      duration_seconds: number | null;
      target_reps: number | null;
      target_seconds: number | null;
      completed: boolean;
    }[];
  }[];
};

/** Avslutade pass senaste `days` dagarna, platt per övning. Endast genomförda set. */
export async function getHistory(supabase: SupabaseClient, userId: string, days = 90): Promise<HistoryEntry[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from("gym_workouts")
    .select(
      "started_at, gym_workout_exercises(exercise_id, gym_exercises(primary_muscle), gym_sets(reps, weight_kg, duration_seconds, target_reps, target_seconds, completed))",
    )
    .eq("user_id", userId)
    .eq("status", "done")
    .gte("started_at", since)
    .order("started_at", { ascending: false });
  if (error) throw error;

  const out: HistoryEntry[] = [];
  for (const w of (data ?? []) as unknown as HistoryRow[]) {
    for (const we of w.gym_workout_exercises ?? []) {
      const sets = (we.gym_sets ?? []).filter((s) => s.completed);
      if (sets.length === 0) continue;
      out.push({
        exercise_id: we.exercise_id,
        primary_muscle: (we.gym_exercises?.primary_muscle ?? "fullbody") as Muscle,
        started_at: w.started_at,
        sets: sets.map((s) => ({ ...s, weight_kg: s.weight_kg == null ? null : Number(s.weight_kg) })),
      });
    }
  }
  return out;
}

/** Inloggad användares betyg och favoriter. Tom om tabellen saknas (migrationen inte körd). */
export async function getRatings(supabase: SupabaseClient, userId: string): Promise<RatingMap> {
  const { data, error } = await supabase
    .from("gym_exercise_ratings")
    .select("exercise_id, rating, favorite")
    .eq("user_id", userId);
  if (error || !data) return {};
  const out: RatingMap = {};
  for (const r of data as { exercise_id: string; rating: number | null; favorite: boolean }[]) {
    out[r.exercise_id] = { rating: r.rating, favorite: r.favorite };
  }
  return out;
}
