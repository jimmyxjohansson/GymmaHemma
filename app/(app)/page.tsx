import Link from "next/link";
import { ensureProfile } from "@/lib/data";
import { formatDate, formatDuration } from "@/lib/labels";
import { weeklyStats } from "@/lib/stats";
import { requireUser } from "@/lib/supabase/server";

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];

export default async function HomePage() {
  const { supabase, user } = await requireUser();
  const profile = await ensureProfile(supabase, user);

  const since = new Date(Date.now() - 120 * 86400000).toISOString();
  const { data: workouts } = await supabase
    .from("gym_workouts")
    .select("id, title, started_at, finished_at, gym_workout_exercises(id)")
    .eq("user_id", user.id)
    .eq("status", "done")
    .gte("started_at", since)
    .order("started_at", { ascending: false });

  const list = workouts ?? [];
  const stats = weeklyStats(list.map((w) => w.started_at), profile.weekly_goal);
  const goalPct = Math.min(100, Math.round((stats.thisWeekCount / profile.weekly_goal) * 100));
  const firstName = profile.display_name?.split(" ")[0] || "du";

  return (
    <div className="space-y-5">
      <header>
        <p className="text-muted">{greeting()}, {firstName}</p>
        <h1 className="h-display text-4xl">Dags att gymma?</h1>
      </header>

      <section className="card">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Den här veckan</p>
            <p className="h-display text-5xl tabular">
              {stats.thisWeekCount}
              <span className="text-2xl text-muted">/{profile.weekly_goal} pass</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Streak</p>
            <p className="h-display text-3xl tabular">
              {stats.streak} <span className="text-base text-muted">{stats.streak === 1 ? "vecka" : "veckor"}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${goalPct}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
          {stats.daysThisWeek.map((d, i) => (
            <div key={d.day} className="flex flex-col items-center gap-1">
              <span className={d.isToday ? "font-bold text-ink" : "text-muted"}>{WEEKDAYS[i]}</span>
              <span
                className={`h-7 w-7 rounded-full border ${
                  d.trained ? "border-accent bg-accent" : d.isToday ? "border-ink" : "border-line"
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/forslag" className="btn-primary col-span-2 py-5 text-lg">
          Föreslå ett pass
        </Link>
        <Link href="/forslag?tomt=1" className="btn-ghost">
          Tomt pass
        </Link>
        <Link href="/ovningar" className="btn-ghost">
          Övningsbank
        </Link>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="h-display text-xl">Senaste passen</h2>
          <Link href="/historik" className="text-sm text-accent">Visa alla</Link>
        </div>
        {list.length === 0 ? (
          <p className="card text-muted">Inga pass ännu. Låt appen föreslå ditt första!</p>
        ) : (
          <ul className="space-y-2">
            {list.slice(0, 4).map((w) => (
              <li key={w.id}>
                <Link href={`/historik/${w.id}`} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{w.title}</p>
                    <p className="text-sm text-muted">
                      {formatDate(w.started_at)} · {(w.gym_workout_exercises ?? []).length} övningar
                    </p>
                  </div>
                  {w.finished_at && (
                    <span className="text-sm text-muted tabular">
                      {formatDuration((Date.parse(w.finished_at) - Date.parse(w.started_at)) / 1000)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("sv-SE", { hour: "numeric", timeZone: "Europe/Stockholm" }).format(new Date()));
  if (h < 10) return "God morgon";
  if (h < 18) return "Hej";
  return "God kväll";
}
