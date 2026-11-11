import { notFound, redirect } from "next/navigation";
import { getEquipment, getExercises, getRatings } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import WorkoutLogger, { type PreviousSets } from "./WorkoutLogger";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: workout } = await supabase.from("gym_workouts").select("*").eq("id", id).maybeSingle();
  if (!workout) notFound();
  if (workout.status === "done") redirect(`/historik/${id}`);

  const [{ data: wes }, equipment, exercises, ratings] = await Promise.all([
    supabase.from("gym_workout_exercises").select("*, gym_sets(*)").eq("workout_id", id).order("position"),
    getEquipment(supabase),
    getExercises(supabase),
    getRatings(supabase, user.id),
  ]);

  const rows = (wes ?? []) as (WorkoutExercise & { gym_sets: WorkoutSet[] })[];
  const items = rows.map(({ gym_sets, ...we }) => ({
    ...we,
    sets: [...(gym_sets ?? [])].sort((a, b) => a.set_number - b.set_number),
  }));

  // Förra gången per övning (för "förra:"-raden)
  const exerciseIds = [...new Set(items.map((i) => i.exercise_id))];
  const previous: PreviousSets = {};
  if (exerciseIds.length) {
    const { data: prev } = await supabase
      .from("gym_workout_exercises")
      .select("exercise_id, gym_workouts!inner(started_at, status, user_id), gym_sets(set_number, reps, weight_kg, duration_seconds, distance_m, completed)")
      .in("exercise_id", exerciseIds)
      .eq("gym_workouts.status", "done")
      .eq("gym_workouts.user_id", user.id)
      .neq("workout_id", id);
    type PrevRow = {
      exercise_id: string;
      gym_workouts: { started_at: string } | { started_at: string }[];
      gym_sets: { set_number: number; reps: number | null; weight_kg: number | null; duration_seconds: number | null; distance_m: number | null; completed: boolean }[];
    };
    for (const r of (prev ?? []) as unknown as PrevRow[]) {
      const w = Array.isArray(r.gym_workouts) ? r.gym_workouts[0] : r.gym_workouts;
      const cur = previous[r.exercise_id];
      if (!cur || cur.date < w.started_at) {
        previous[r.exercise_id] = {
          date: w.started_at,
          sets: r.gym_sets.filter((s) => s.completed).sort((a, b) => a.set_number - b.set_number),
        };
      }
    }
  }

  return (
    <WorkoutLogger
      workout={workout as Workout}
      initialItems={items}
      exercises={exercises}
      equipment={equipment}
      previous={previous}
      ratings={ratings}
    />
  );
}
