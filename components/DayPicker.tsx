"use client";

import { localYmd, nextDays } from "@/lib/dates";

/** Snabbval för kommande 8 dagar + valfritt datum. */
export default function DayPicker({ value, onChange }: { value: string; onChange: (ymd: string) => void }) {
  const days = nextDays(8);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {days.map((d) => (
          <button
            key={d.ymd}
            type="button"
            onClick={() => onChange(d.ymd)}
            className={`rounded-xl border px-1 py-2 text-center transition ${
              value === d.ymd ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface-2"
            }`}
          >
            <span className="block text-xs">{d.top}</span>
            <span className="block font-semibold">{d.bottom}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        Annat datum:
        <input
          type="date"
          className="input w-auto flex-1 py-2"
          min={localYmd(new Date())}
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
