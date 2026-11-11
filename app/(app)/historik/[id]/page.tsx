import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import RateExercise from "@/components/RateExercise";
import { getEquipment, getRatings } from "@/lib/data";
import { formatDate, formatDuration, muscleLabel } from "@/lib/labels";
import { estimated1RM } from "@/lib/stats";
import { requireUser } from "@/lib/supabase/server";
import type { Exercise, PlannedExercise, WorkoutSet } from "@/lib/types";
import { deleteWorkoutAction, startWorkoutAction } from "../../actions";

type Row = {
  id: string;
  exercise_id: string;
  position: number;
  rest_seconds: number;
  notes: string;
  gym_exercises: Exercise;
  gym_sets: WorkoutSet[];
};

export default async function WorkoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ klart?: string }>;
}) {
  const { id } = await params;
  const { klart } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: workout } = await supabase.from("gym_workouts").select("*").eq("id", id).maybeSingle();
  if (!workout) notFound();

  const [{ data }, equipment] = await Promise.all([
    supabase.from("gym_workout_exercises").select("*, gym_exercises(*), gym_sets(*)").eq("workout_id", id).order("position"),
    getEquipment(supabase),
  ]);
  const ratings = await getRatings(supabase, user.id);
  const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    gym_sets: r.gym_sets.filter((s) => s.completed).sort((a, b) => a.set_number - b.set_number),
  }));
  const eqById = new Map(equipment.map((e) => [e.id, e]));

  // Tidigare bästa per övning → personbästa i detta pass?
  const exerciseIds = rows.map((r) => r.exercise_id);
  const prevBest = new Map<string, { weight: number; e1rm: number; seconds: number; distance: number }>();
  if (exerciseIds.length) {
    const { data: prev } = await supabase
      .from("gym_workout_exercises")
      .select("exercise_id, gym_workouts!inner(started_at, user_id, status), gym_sets(weight_kg, reps, duration_seconds, distance_m, completed)")
      .in("exercise_id", exerciseIds)
      .eq("gym_workouts.user_id", user.id)
      .eq("gym_workouts.status", "done")
      .lt("gym_workouts.started_at", workout.started_at);
    for (const r of (prev ?? []) as unknown as { exercise_id: string; gym_sets: WorkoutSet[] }[]) {
      const cur = prevBest.get(r.exercise_id) ?? { weight: 0, e1rm: 0, seconds: 0, distance: 0 };
      for (const s of r.gym_sets.filter((x) => x.completed)) {
        cur.weight = Math.max(cur.weight, Number(s.weight_kg ?? 0));
        cur.e1rm = Math.max(cur.e1rm, estimated1RM(Number(s.weight_kg ?? 0), s.reps ?? 0));
        cur.seconds = Math.max(cur.seconds, s.duration_seconds ?? 0);
        cur.distance = Math.max(cur.distance, s.distance_m ?? 0);
      }
      prevBest.set(r.exercise_id, cur);
    }
  }

  const volume = rows.reduce(
    (sum, r) => sum + r.gym_sets.reduce((s, x) => s + Number(x.weight_kg ?? 0) * (x.reps ?? 0) * (r.gym_exercises.unilateral ? 2 : 1), 0),
    0,
  );
  const totalSets = rows.reduce((n, r) => n + r.gym_sets.length, 0);
  const duration = workout.finished_at ? (Date.parse(workout.finished_at) - Date.parse(workout.started_at)) / 1000 : null;

  let prCount = 0;
  const prFor = (r: Row) => {
    const best = prevBest.get(r.exercise_id);
    if (!best) return null; // första gången räknas inte som rekord
    const ex = r.gym_exercises;
    if (ex.measure === "weight_reps") {
      const w = Math.max(...r.gym_sets.map((s) => Number(s.weight_kg ?? 0)), 0);
      const e = Math.max(...r.gym_sets.map((s) => estimated1RM(Number(s.weight_kg ?? 0), s.reps ?? 0)), 0);
      if (w > best.weight) return `Ny maxvikt: ${w} kg`;
      if (e > best.e1rm + 0.01) return `Nytt rekord (uppsk. 1RM ${Math.round(e)} kg)`;
    }
    if (ex.measure === "time") {
      const t = Math.max(...r.gym_sets.map((s) => s.duration_seconds ?? 0), 0);
      if (t > best.seconds) return `Längsta tiden: ${t} s`;
    }
    if (ex.measure === "cardio") {
      const d = Math.max(...r.gym_sets.map((s) => s.distance_m ?? 0), 0);
      if (d > best.distance) return `Längsta distansen: ${d} m`;
    }
    return null;
  };
  const prs = new Map(rows.map((r) => [r.id, prFor(r)]));
  prs.forEach((v) => v && prCount++);

  // "Kör samma pass igen" – senaste värdena som utgångspunkt
  const repeatItems: PlannedExercise[] = rows
    .filter((r) => r.gym_sets.length > 0)
    .map((r) => {
      const last = r.gym_sets[r.gym_sets.length - 1];
      return {
        exercise_id: r.exercise_id,
        name: r.gym_exercises.name,
        equipment_id: r.gym_exercises.equipment_id,
        primary_muscle: r.gym_exercises.primary_muscle,
        measure: r.gym_exercises.measure,
        unilateral: r.gym_exercises.unilateral,
        sets: r.gym_sets.length,
        reps: last.target_reps ?? last.reps,
        seconds: last.duration_seconds,
        weight_kg: last.weight_kg == null ? null : Number(last.weight_kg),
        rest_seconds: r.rest_seconds,
        hint: "",
      };
    });

  return (
    <div className="space-y-4">
      <Link href="/historik" className="text-sm text-muted">
        ← Historik
      </Link>

      {klart && (
        <div className="card border-accent bg-accent/10 text-center">
          <p className="h-display text-3xl">Bra jobbat! 🎉</p>
          <p className="text-muted">
            Passet är sparat{prCount > 0 ? ` – och du satte ${prCount} ${prCount === 1 ? "rekord" : "rekord"}!` : "."}
          </p>
        </div>
      )}

      <header>
        <p className="text-muted">{formatDate(workout.started_at, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm" })}</p>
        <h1 className="h-display text-4xl">{workout.title}</h1>
      </header>

      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Tid" value={duration ? formatDuration(duration) : "–"} />
        <Stat label="Set" value={String(totalSets)} />
        <Stat label="Volym" value={volume > 0 ? `${Math.round(volume).toLocaleString("sv-SE")} kg` : "–"} />
      </section>

      {workout.notes && <p className="card whitespace-pre-wrap text-sm">{workout.notes}</p>}

      <ul className="space-y-2">
        {rows.map((r) => {
          const ex = r.gym_exercises;
          const pr = prs.get(r.id);
          return (
            <li key={r.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/ovningar/${ex.id}`} className="font-semibold">
                  {ex.name}
                </Link>
                <span className="text-sm text-muted">
                  {eqById.get(ex.equipment_id)?.emoji} {muscleLabel(ex.primary_muscle)}
                </span>
              </div>
              {pr && <p className="mt-1 text-sm font-semibold text-accent">🏆 {pr}</p>}
              <ol className="mt-2 flex flex-wrap gap-2 text-sm tabular">
                {r.gym_sets.map((s) => (
                  <li key={s.id} className="rounded-lg bg-surface-2 px-2 py-1">
                    {describe(ex, s)}
                  </li>
                ))}
              </ol>
              {r.notes && <p className="mt-2 text-sm text-muted">{r.notes}</p>}
              <div className="mt-3 border-t border-line pt-2">
                <RateExercise exerciseId={ex.id} userId={user.id} initial={ratings[ex.id]} compact />
              </div>
            </li>
          );
        })}
      </ul>

      {repeatItems.length > 0 && (
        <form
          action={startWorkoutAction.bind(null, {
            title: workout.title,
            focus: workout.focus,
            goal: workout.goal,
            minutes: workout.planned_minutes,
            items: repeatItems,
          })}
        >
          <ConfirmSubmit className="btn-primary w-full" pendingText="Startar…">
            Kör samma pass igen
          </ConfirmSubmit>
        </form>
      )}
      <form action={deleteWorkoutAction.bind(null, id)}>
        <ConfirmSubmit className="w-full py-2 text-sm text-danger" message="Radera passet permanent?">
          Radera passet
        </ConfirmSubmit>
      </form>
    </div>
  );
}

function describe(ex: Exercise, s: WorkoutSet) {
  switch (ex.measure) {
    case "weight_reps":
      return `${s.weight_kg != null ? Number(s.weight_kg) : "–"} kg × ${s.reps ?? "–"}`;
    case "reps":
      return `${s.reps ?? "–"} reps${s.weight_kg ? ` +${Number(s.weight_kg)} kg` : ""}`;
    case "time":
      return formatDuration(s.duration_seconds ?? 0);
    case "cardio":
      return `${formatDuration(s.duration_seconds ?? 0)}${s.distance_m ? ` · ${s.distance_m} m` : ""}`;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="h-display text-xl tabular">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
