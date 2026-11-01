const TZ = "Europe/Stockholm";

/** YYYY-MM-DD i svensk tid. */
export function localDay(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Måndagen i veckan för ett YYYY-MM-DD-datum, som YYYY-MM-DD. */
export function weekStart(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = (date.getUTCDay() + 6) % 7; // måndag = 0
  date.setUTCDate(date.getUTCDate() - dow);
  return date.toISOString().slice(0, 10);
}

function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

export function isoWeekNumber(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

export interface WeekSummary {
  weekStart: string;
  week: number;
  count: number;
}

/**
 * Räknar pass per vecka och veckostreak (antal veckor i rad där veckomålet nåtts).
 * Innevarande vecka räknas med om målet redan är nått, annars bryter den inte streaken.
 */
export function weeklyStats(workoutDates: string[], weeklyGoal: number, now = new Date()) {
  const counts = new Map<string, number>();
  for (const iso of workoutDates) {
    const ws = weekStart(localDay(iso));
    counts.set(ws, (counts.get(ws) ?? 0) + 1);
  }
  const thisWeek = weekStart(localDay(now));
  const thisWeekCount = counts.get(thisWeek) ?? 0;

  let streak = thisWeekCount >= weeklyGoal ? 1 : 0;
  let cursor = addDays(thisWeek, -7);
  while ((counts.get(cursor) ?? 0) >= weeklyGoal) {
    streak++;
    cursor = addDays(cursor, -7);
  }

  const weeks: WeekSummary[] = [];
  for (let i = 11; i >= 0; i--) {
    const ws = addDays(thisWeek, -7 * i);
    weeks.push({ weekStart: ws, week: isoWeekNumber(ws), count: counts.get(ws) ?? 0 });
  }

  // Vilka dagar i innevarande vecka har pass?
  const daysThisWeek = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(thisWeek, i);
    return { day, trained: workoutDates.some((iso) => localDay(iso) === day), isToday: day === localDay(now) };
  });

  return { thisWeekCount, streak, weeks, daysThisWeek };
}

/** Uppskattat 1RM (Epley). */
export function estimated1RM(weight: number, reps: number) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}
