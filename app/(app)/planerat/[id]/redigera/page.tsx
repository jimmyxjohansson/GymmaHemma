import { notFound, redirect } from "next/navigation";
import { getEquipment, getExercises, getRatings } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import type { Exercise, Focus, Goal, PlannedExercise, WorkoutSet } from "@/lib/types";
import EditPlannedClient from "./EditPlannedClient";

type Row = { position: number; rest_seconds: number; gym_exercises: Exercise; gym_sets: WorkoutSet[] };

export default async function EditPlannedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: workout } = await supabase.from("gym_workouts").select("*").eq("id", id).maybeSingle();
  if (!workout) notFound();
  if (workout.status !== "planned") redirect(workout.status === "active" ? `/pass/${id}` : `/historik/${id}`);

  const [{ data }, equipment, exercises, ratings] = await Promise.all([
    supabase.from("gym_workout_exercises").select("position, rest_seconds, gym_exercises(*), gym_sets(*)").eq("workout_id", id).order("position"),
    getEquipment(supabase),
    getExercises(supabase),
    getRatings(supabase, user.id),
  ]);

  // Gör om sparade rader till samma format som passförslaget använder
  const items: PlannedExercise[] = ((data ?? []) as unknown as Row[]).map((r) => {
    const ex = r.gym_exercises;
    const sets = [...r.gym_sets].sort((a, b) => a.set_number - b.set_number);
    const first = sets[0];
    return {
      exercise_id: ex.id,
      name: ex.name,
      equipment_id: ex.equipment_id,
      primary_muscle: ex.primary_muscle,
      measure: ex.measure,
      unilateral: ex.unilateral,
      sets: Math.max(1, sets.length),
      reps: first?.target_reps ?? first?.reps ?? null,
      seconds: first?.target_seconds ?? first?.duration_seconds ?? null,
      weight_kg: first?.weight_kg != null ? Number(first.weight_kg) : null,
      rest_seconds: r.rest_seconds,
      hint: "",
    };
  });

  const enabled = equipment.filter((e) => e.enabled);
  return (
    <EditPlannedClient
      workoutId={id}
      initialTitle={workout.title}
      initialDate={workout.scheduled_for}
      initialItems={items}
      exercises={exercises}
      equipment={enabled}
      ratings={ratings}
      options={{
        minutes: workout.planned_minutes ?? 45,
        focus: (workout.focus as Focus) ?? "helkropp",
        goal: (workout.goal as Goal) ?? "muskler",
        equipment: enabled.map((e) => e.id),
      }}
    />
  );
}
