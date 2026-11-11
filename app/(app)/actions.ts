"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEquipment, getExercises, getHistory, getRatings } from "@/lib/data";
import { progression, suggestWorkout } from "@/lib/suggest";
import { requireUser } from "@/lib/supabase/server";
import type { Exercise, Focus, Goal, PlannedExercise, SuggestOptions, WorkoutExercise, WorkoutSet } from "@/lib/types";

const FOCUSES: Focus[] = ["helkropp", "overkropp", "ben", "core", "kondition"];
const GOALS: Goal[] = ["styrka", "muskler", "kondition"];

export async function suggestAction(opts: SuggestOptions) {
  const { supabase, user } = await requireUser();
  const clean: SuggestOptions = {
    minutes: Math.min(120, Math.max(10, Math.round(opts.minutes))),
    focus: FOCUSES.includes(opts.focus) ? opts.focus : "helkropp",
    goal: GOALS.includes(opts.goal) ? opts.goal : "muskler",
    equipment: opts.equipment.filter((e) => typeof e === "string"),
  };
  const [exercises, equipment, history, ratings] = await Promise.all([
    getExercises(supabase),
    getEquipment(supabase),
    getHistory(supabase, user.id, 90),
    getRatings(supabase, user.id),
  ]);
  return suggestWorkout(clean, exercises, equipment, history, ratings);
}

/** Planerar en enskild övning (används när man byter eller lägger till en övning). */
export async function planExerciseAction(exerciseId: string, goal: Goal, template?: Pick<PlannedExercise, "sets" | "reps" | "rest_seconds">) {
  const { supabase, user } = await requireUser();
  const { data: ex } = await supabase.from("gym_exercises").select("*").eq("id", exerciseId).single();
  if (!ex) throw new Error("Övningen finns inte");
  const exercise = ex as Exercise;
  const [equipment, history] = await Promise.all([getEquipment(supabase), getHistory(supabase, user.id, 180)]);
  const eq = equipment.find((e) => e.id === exercise.equipment_id);

  const defaults = { styrka: { sets: 4, reps: 6, rest: 150 }, muskler: { sets: 3, reps: 10, rest: 90 }, kondition: { sets: 3, reps: 15, rest: 45 } }[goal];
  const reps = exercise.measure === "weight_reps" || exercise.measure === "reps" ? (template?.reps ?? defaults.reps) : null;
  const seconds = exercise.measure === "time" ? 40 : exercise.measure === "cardio" ? 600 : null;
  const prog = progression(exercise, eq, history, reps, seconds);

  const planned: PlannedExercise = {
    exercise_id: exercise.id,
    name: exercise.name,
    equipment_id: exercise.equipment_id,
    primary_muscle: exercise.primary_muscle,
    measure: exercise.measure,
    unilateral: exercise.unilateral,
    sets: exercise.measure === "cardio" ? 1 : (template?.sets ?? defaults.sets),
    reps,
    seconds: prog.seconds ?? seconds,
    weight_kg: prog.weight_kg,
    rest_seconds: template?.rest_seconds ?? defaults.rest,
    hint: prog.hint,
  };
  return planned;
}

/** Startar ett pass från en plan (eller tomt) och skickar användaren till loggningen. */
export async function startWorkoutAction(input: {
  title: string;
  focus?: Focus | null;
  goal?: Goal | null;
  minutes?: number | null;
  items: PlannedExercise[];
}) {
  const { supabase, user } = await requireUser();

  // Bara ett pågående pass åt gången – avsluta gamla tomma pass.
  const { data: existing } = await supabase
    .from("gym_workouts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (existing && existing.length > 0) {
    await supabase.from("gym_workouts").update({ status: "done", finished_at: new Date().toISOString() }).in("id", existing.map((w) => w.id));
  }

  const { data: workout, error } = await supabase
    .from("gym_workouts")
    .insert({
      user_id: user.id,
      title: input.title.slice(0, 80) || "Pass",
      focus: input.focus ?? null,
      goal: input.goal ?? null,
      planned_minutes: input.minutes ?? null,
    })
    .select("id")
    .single();
  if (error || !workout) throw new Error(error?.message ?? "Kunde inte skapa passet");

  await addExercisesToWorkout(supabase, workout.id, input.items, 0);
  revalidatePath("/", "layout");
  redirect(`/pass/${workout.id}`);
}

async function addExercisesToWorkout(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  workoutId: string,
  items: PlannedExercise[],
  startPosition: number,
) {
  if (items.length === 0) return [];
  const { data: wes, error } = await supabase
    .from("gym_workout_exercises")
    .insert(
      items.map((p, i) => ({
        workout_id: workoutId,
        exercise_id: p.exercise_id,
        position: startPosition + i,
        rest_seconds: p.rest_seconds,
      })),
    )
    .select("id, position");
  if (error) throw new Error(error.message);

  const byPos = new Map((wes ?? []).map((w) => [w.position as number, w.id as string]));
  const sets = items.flatMap((p, i) => {
    const weId = byPos.get(startPosition + i)!;
    return Array.from({ length: Math.max(1, p.sets) }, (_, n) => ({
      workout_exercise_id: weId,
      set_number: n + 1,
      reps: p.reps,
      target_reps: p.reps,
      weight_kg: p.weight_kg,
      duration_seconds: p.seconds,
      target_seconds: p.seconds,
      distance_m: null,
      completed: false,
    }));
  });
  const { error: setErr } = await supabase.from("gym_sets").insert(sets);
  if (setErr) throw new Error(setErr.message);
  return wes;
}

/** Lägger till en övning i ett pågående pass och returnerar de nya raderna. */
export async function addExerciseToWorkoutAction(workoutId: string, exerciseId: string) {
  const { supabase } = await requireUser();
  const { data: w } = await supabase.from("gym_workouts").select("goal").eq("id", workoutId).single();
  if (!w) throw new Error("Passet finns inte");
  const { data: maxRow } = await supabase
    .from("gym_workout_exercises")
    .select("position")
    .eq("workout_id", workoutId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const planned = await planExerciseAction(exerciseId, (w.goal as Goal) ?? "muskler");
  const wes = await addExercisesToWorkout(supabase, workoutId, [planned], (maxRow?.position ?? -1) + 1);
  const weId = wes?.[0]?.id as string;
  const { data: we } = await supabase.from("gym_workout_exercises").select("*").eq("id", weId).single();
  const { data: sets } = await supabase.from("gym_sets").select("*").eq("workout_exercise_id", weId).order("set_number");
  return { workoutExercise: we as WorkoutExercise, sets: (sets ?? []) as WorkoutSet[], hint: planned.hint };
}

export async function finishWorkoutAction(workoutId: string, notes: string) {
  const { supabase } = await requireUser();
  // Ta bort set som aldrig gjordes så att statistiken blir rätt
  const { data: wes } = await supabase.from("gym_workout_exercises").select("id").eq("workout_id", workoutId);
  const ids = (wes ?? []).map((w) => w.id);
  if (ids.length) {
    await supabase.from("gym_sets").delete().in("workout_exercise_id", ids).eq("completed", false);
    // Övningar utan några set tas bort
    const { data: left } = await supabase.from("gym_sets").select("workout_exercise_id").in("workout_exercise_id", ids);
    const withSets = new Set((left ?? []).map((s) => s.workout_exercise_id));
    const empty = ids.filter((id) => !withSets.has(id));
    if (empty.length) await supabase.from("gym_workout_exercises").delete().in("id", empty);
  }
  await supabase
    .from("gym_workouts")
    .update({ status: "done", finished_at: new Date().toISOString(), notes })
    .eq("id", workoutId);
  revalidatePath("/", "layout");
  redirect(`/historik/${workoutId}?klart=1`);
}

export async function deleteWorkoutAction(workoutId: string) {
  const { supabase } = await requireUser();
  await supabase.from("gym_workouts").delete().eq("id", workoutId);
  revalidatePath("/", "layout");
  redirect("/historik");
}
