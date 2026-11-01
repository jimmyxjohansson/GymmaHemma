import Link from "next/link";
import WeekBars from "@/components/WeekBars";
import { ensureProfile } from "@/lib/data";
import { formatDate, formatDuration } from "@/lib/labels";
import { weeklyStats } from "@/lib/stats";
import { requireUser } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const { supabase, user } = await requireUser();
  const profile = await ensureProfile(supabase, user);
  const { data } = await supabase
    .from("gym_workouts")
    .select("id, title, started_at, finished_at, gym_workout_exercises(id, gym_sets(id))")
    .eq("user_id", user.id)
    .eq("status", "done")
    .order("started_at", { ascending: false })
    .limit(300);

  const workouts = data ?? [];
  const stats = weeklyStats(workouts.map((w) => w.started_at), profile.weekly_goal);

  const byMonth = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const key = new Date(w.started_at).toLocaleDateString("sv-SE", { month: "long", year: "numeric", timeZone: "Europe/Stockholm" });
    byMonth.set(key, [...(byMonth.get(key) ?? []), w]);
  }

  return (
    <div className="space-y-5">
      <h1 className="h-display text-4xl">Historik</h1>

      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Pass per vecka</h2>
          <span className="text-sm text-muted">Mål: {profile.weekly_goal}/vecka</span>
        </div>
        <WeekBars weeks={stats.weeks} goal={profile.weekly_goal} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Totalt" value={workouts.length} />
          <Stat label="Denna vecka" value={stats.thisWeekCount} />
          <Stat label="Veckostreak" value={stats.streak} />
        </div>
      </section>

      {workouts.length === 0 && <p className="card text-muted">Inga avslutade pass ännu.</p>}

      {[...byMonth.entries()].map(([month, list]) => (
        <section key={month}>
          <h2 className="h-display mb-2 text-lg text-muted">{month}</h2>
          <ul className="space-y-2">
            {list.map((w) => {
              const sets = (w.gym_workout_exercises ?? []).reduce((n, we) => n + (we.gym_sets ?? []).length, 0);
              return (
                <li key={w.id}>
                  <Link href={`/historik/${w.id}`} className="card flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{w.title}</p>
                      <p className="text-sm text-muted">
                        {formatDate(w.started_at)} · {(w.gym_workout_exercises ?? []).length} övningar · {sets} set
                      </p>
                    </div>
                    {w.finished_at && (
                      <span className="text-sm text-muted tabular">
                        {formatDuration((Date.parse(w.finished_at) - Date.parse(w.started_at)) / 1000)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-2 p-2">
      <p className="h-display text-2xl tabular">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
