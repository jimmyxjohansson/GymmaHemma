import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import ExerciseDemo from "@/components/ExerciseDemo";
import ExerciseForm from "@/components/ExerciseForm";
import ProgressChart from "@/components/ProgressChart";
import RateExercise from "@/components/RateExercise";
import { getEquipment, getRatings } from "@/lib/data";
import { formatDate, formatDuration, MEASURE_LABELS, muscleLabel } from "@/lib/labels";
import { estimated1RM } from "@/lib/stats";
import { requireUser } from "@/lib/supabase/server";
import type { Exercise, WorkoutSet } from "@/lib/types";
import { archiveExerciseAction } from "../actions";

type Session = { workoutId: string; date: string; sets: WorkoutSet[] };

export default async function ExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ redigera?: string }>;
}) {
  const { id } = await params;
  const { redigera } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data } = await supabase.from("gym_exercises").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const ex = data as Exercise;
  const [equipment, ratings] = await Promise.all([getEquipment(supabase), getRatings(supabase, user.id)]);
  const eq = equipment.find((e) => e.id === ex.equipment_id);

  if (redigera) {
    return (
      <div className="space-y-4">
        <Link href={`/ovningar/${id}`} className="text-sm text-muted">← Tillbaka</Link>
        <h1 className="h-display text-3xl">Redigera övning</h1>
        <ExerciseForm equipment={equipment} exercise={ex} />
        <form action={archiveExerciseAction.bind(null, id, !ex.archived)}>
          <ConfirmSubmit
            className="w-full py-2 text-sm text-danger"
            message={ex.archived ? undefined : "Dölj övningen från banken och passförslagen? Historiken sparas."}
          >
            {ex.archived ? "Återställ övningen" : "Ta bort från övningsbanken"}
          </ConfirmSubmit>
        </form>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("gym_workout_exercises")
    .select("workout_id, gym_workouts!inner(started_at, user_id, status), gym_sets(*)")
    .eq("exercise_id", id)
    .eq("gym_workouts.user_id", user.id)
    .eq("gym_workouts.status", "done");

  const sessions: Session[] = ((rows ?? []) as unknown as {
    workout_id: string;
    gym_workouts: { started_at: string } | { started_at: string }[];
    gym_sets: WorkoutSet[];
  }[])
    .map((r) => ({
      workoutId: r.workout_id,
      date: (Array.isArray(r.gym_workouts) ? r.gym_workouts[0] : r.gym_workouts).started_at,
      sets: r.gym_sets.filter((s) => s.completed).sort((a, b) => a.set_number - b.set_number),
    }))
    .filter((s) => s.sets.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Mått för graf och rekord beroende på övningstyp
  const metric = (s: Session) => {
    switch (ex.measure) {
      case "weight_reps":
        return Math.max(...s.sets.map((x) => estimated1RM(Number(x.weight_kg ?? 0), x.reps ?? 0)));
      case "reps":
        return Math.max(...s.sets.map((x) => x.reps ?? 0));
      case "time":
        return Math.max(...s.sets.map((x) => x.duration_seconds ?? 0));
      case "cardio":
        return s.sets.reduce((n, x) => n + (x.distance_m ?? 0), 0) || s.sets.reduce((n, x) => n + (x.duration_seconds ?? 0) / 60, 0);
    }
  };
  const unit = { weight_reps: "kg (uppsk. 1RM)", reps: "reps", time: "sekunder", cardio: "meter" }[ex.measure];
  const points = sessions.slice(-30).map((s) => ({ date: s.date, value: metric(s) }));

  const allSets = sessions.flatMap((s) => s.sets);
  const records: { label: string; value: string }[] = [];
  if (allSets.length) {
    if (ex.measure === "weight_reps") {
      const maxW = Math.max(...allSets.map((s) => Number(s.weight_kg ?? 0)));
      const bestSet = allSets.reduce((b, s) => (estimated1RM(Number(s.weight_kg ?? 0), s.reps ?? 0) > estimated1RM(Number(b.weight_kg ?? 0), b.reps ?? 0) ? s : b));
      const bestVolume = Math.max(...sessions.map((s) => s.sets.reduce((n, x) => n + Number(x.weight_kg ?? 0) * (x.reps ?? 0), 0)));
      records.push(
        { label: "Maxvikt", value: `${maxW} kg` },
        { label: "Bästa set", value: `${Number(bestSet.weight_kg)} × ${bestSet.reps}` },
        { label: "Uppsk. 1RM", value: `${Math.round(estimated1RM(Number(bestSet.weight_kg ?? 0), bestSet.reps ?? 0))} kg` },
        { label: "Mest volym/pass", value: `${Math.round(bestVolume)} kg` },
      );
    } else if (ex.measure === "reps") {
      records.push({ label: "Flest reps", value: String(Math.max(...allSets.map((s) => s.reps ?? 0))) });
    } else if (ex.measure === "time") {
      records.push({ label: "Längsta tid", value: formatDuration(Math.max(...allSets.map((s) => s.duration_seconds ?? 0))) });
    } else {
      records.push(
        { label: "Längsta distans", value: `${Math.max(...allSets.map((s) => s.distance_m ?? 0))} m` },
        { label: "Längsta tid", value: formatDuration(Math.max(...allSets.map((s) => s.duration_seconds ?? 0))) },
      );
    }
    records.push({ label: "Antal pass", value: String(sessions.length) });
  }

  return (
    <div className="space-y-4">
      <Link href="/ovningar" className="text-sm text-muted">← Övningar</Link>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="h-display text-4xl">{ex.name}</h1>
          <p className="text-muted">
            {eq?.emoji} {eq?.name} · {muscleLabel(ex.primary_muscle)}
            {ex.secondary_muscles.length > 0 && ` (+ ${ex.secondary_muscles.map(muscleLabel).join(", ")})`}
          </p>
          <p className="text-sm text-muted">
            {MEASURE_LABELS[ex.measure]}
            {ex.is_compound && " · basövning"}
            {ex.unilateral && " · en sida i taget"}
            {ex.archived && " · borttagen från banken"}
          </p>
        </div>
        <Link href={`/ovningar/${id}?redigera=1`} className="btn-ghost shrink-0 px-3 py-2 text-sm">
          Redigera
        </Link>
      </header>

      <section className="card">
        <h2 className="mb-2 text-sm text-muted">Ditt betyg</h2>
        <RateExercise exerciseId={ex.id} userId={user.id} initial={ratings[ex.id]} />
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Utförande</h2>
        <ExerciseDemo name={ex.name} description={ex.description} />
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">Utveckling</h2>
        <ProgressChart points={points} unit={unit} />
      </section>

      {records.length > 0 && (
        <section className="grid grid-cols-2 gap-2">
          {records.map((r) => (
            <div key={r.label} className="card p-3">
              <p className="text-xs text-muted">{r.label}</p>
              <p className="h-display text-2xl tabular">{r.value}</p>
            </div>
          ))}
        </section>
      )}

      {sessions.length > 0 && (
        <section>
          <h2 className="h-display mb-2 text-xl">Senaste gångerna</h2>
          <ul className="space-y-2">
            {[...sessions].reverse().slice(0, 10).map((s) => (
              <li key={s.workoutId}>
                <Link href={`/historik/${s.workoutId}`} className="card block">
                  <p className="text-sm text-muted">{formatDate(s.date)}</p>
                  <p className="tabular">
                    {s.sets
                      .map((x) =>
                        ex.measure === "weight_reps"
                          ? `${Number(x.weight_kg ?? 0)}×${x.reps ?? 0}`
                          : ex.measure === "reps"
                            ? `${x.reps}`
                            : ex.measure === "time"
                              ? `${x.duration_seconds} s`
                              : `${formatDuration(x.duration_seconds ?? 0)}${x.distance_m ? ` / ${x.distance_m} m` : ""}`,
                      )
                      .join("  ·  ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
