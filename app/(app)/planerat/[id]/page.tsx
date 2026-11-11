import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { ExerciseThumb } from "@/components/ExerciseDemo";
import { getEquipment } from "@/lib/data";
import { FOCUS_LABELS, GOAL_LABELS, formatDuration, muscleLabel, plannedDayLabel } from "@/lib/labels";
import { localDay } from "@/lib/stats";
import { requireUser } from "@/lib/supabase/server";
import type { Exercise, WorkoutSet } from "@/lib/types";
import { deletePlannedWorkoutAction, reschedulePlannedWorkoutAction, startPlannedWorkoutAction } from "../../actions";

type Row = { id: string; position: number; rest_seconds: number; gym_exercises: Exercise; gym_sets: WorkoutSet[] };

export default async function PlannedWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: workout } = await supabase.from("gym_workouts").select("*").eq("id", id).maybeSingle();
  if (!workout) notFound();
  if (workout.status === "active") redirect(`/pass/${id}`);
  if (workout.status === "done") redirect(`/historik/${id}`);

  const [{ data }, equipment] = await Promise.all([
    supabase.from("gym_workout_exercises").select("id, position, rest_seconds, gym_exercises(*), gym_sets(*)").eq("workout_id", id).order("position"),
    getEquipment(supabase),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const eqById = new Map(equipment.map((e) => [e.id, e]));
  const today = localDay(new Date());
  const missed = workout.scheduled_for && workout.scheduled_for < today;

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-muted">
        ← Hem
      </Link>

      <header>
        <p className={`text-sm ${missed ? "text-danger" : "text-accent"}`}>
          {missed ? "Missat · " : "Sparat pass · "}
          {workout.scheduled_for ? plannedDayLabel(workout.scheduled_for, today) : ""}
        </p>
        <h1 className="h-display text-4xl">{workout.title}</h1>
        <p className="text-sm text-muted">
          {[
            workout.focus && FOCUS_LABELS[workout.focus as keyof typeof FOCUS_LABELS],
            workout.goal && GOAL_LABELS[workout.goal as keyof typeof GOAL_LABELS]?.label,
            workout.planned_minutes && `ca ${workout.planned_minutes} min`,
            `${rows.length} övningar`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <form action={startPlannedWorkoutAction.bind(null, id)}>
        <ConfirmSubmit className="btn-primary w-full py-4 text-lg" pendingText="Startar…">
          ▶ Starta passet nu
        </ConfirmSubmit>
      </form>

      <ul className="space-y-2">
        {rows.map((r) => {
          const ex = r.gym_exercises;
          const sets = [...r.gym_sets].sort((a, b) => a.set_number - b.set_number);
          const first = sets[0];
          let plan = `${sets.length} set`;
          if (ex.measure === "weight_reps" || ex.measure === "reps") {
            plan = `${sets.length} × ${first?.target_reps ?? first?.reps ?? "–"}`;
            if (first?.weight_kg != null) plan += ` · ${Number(first.weight_kg)} kg`;
          } else if (ex.measure === "time") {
            plan = `${sets.length} × ${first?.target_seconds ?? first?.duration_seconds ?? "–"} s`;
          } else if (ex.measure === "cardio") {
            plan = formatDuration(first?.target_seconds ?? first?.duration_seconds ?? 0);
          }
          return (
            <li key={r.id}>
              <Link href={`/ovningar/${ex.id}`} className="card flex items-center gap-3 p-3">
                <ExerciseThumb name={ex.name} className="h-12 w-16 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{ex.name}</span>
                  <span className="text-sm text-muted">
                    {eqById.get(ex.equipment_id)?.emoji} {muscleLabel(ex.primary_muscle)}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm tabular">{plan}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={reschedulePlannedWorkoutAction.bind(null, id)} className="card flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="label">Flytta till annan dag</span>
          <input type="date" name="date" className="input py-2" defaultValue={workout.scheduled_for ?? today} min={today} required />
        </label>
        <ConfirmSubmit className="btn-ghost py-2" pendingText="Sparar…">
          Flytta
        </ConfirmSubmit>
      </form>

      <form action={deletePlannedWorkoutAction.bind(null, id)}>
        <ConfirmSubmit className="w-full py-2 text-sm text-danger" message="Ta bort det sparade passet?">
          Ta bort passet
        </ConfirmSubmit>
      </form>
    </div>
  );
}
