import type { WeekSummary } from "@/lib/stats";

/** Enkelt stapeldiagram: pass per vecka, med veckomålet som streckad linje. */
export default function WeekBars({ weeks, goal }: { weeks: WeekSummary[]; goal: number }) {
  const max = Math.max(goal, ...weeks.map((w) => w.count), 1);
  return (
    <div>
      <div className="relative flex h-28 items-end gap-1.5">
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/50"
          style={{ bottom: `${(goal / max) * 100}%` }}
        />
        {weeks.map((w) => (
          <div key={w.weekStart} className="flex h-full flex-1 flex-col justify-end" title={`v.${w.week}: ${w.count} pass`}>
            <div
              className={`rounded-t-md ${w.count >= goal ? "bg-accent" : "bg-surface-2 border border-line"}`}
              style={{ height: `${Math.max(w.count > 0 ? 6 : 2, (w.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 text-center text-[10px] text-muted">
        {weeks.map((w) => (
          <span key={w.weekStart} className="flex-1">
            {w.week}
          </span>
        ))}
      </div>
    </div>
  );
}
