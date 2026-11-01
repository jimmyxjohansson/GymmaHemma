import type { Focus, Goal, Measure, Muscle } from "./types";

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: "Bröst",
  back: "Rygg",
  shoulders: "Axlar",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Framsida lår",
  hamstrings: "Baksida lår",
  glutes: "Säte",
  calves: "Vader",
  core: "Core/mage",
  fullbody: "Helkropp",
  cardio: "Kondition",
};

export const MUSCLES = Object.keys(MUSCLE_LABELS) as Muscle[];

export const FOCUS_LABELS: Record<Focus, string> = {
  helkropp: "Helkropp",
  overkropp: "Överkropp",
  ben: "Ben & säte",
  core: "Core",
  kondition: "Kondition",
};

export const GOAL_LABELS: Record<Goal, { label: string; desc: string }> = {
  styrka: { label: "Styrka", desc: "Tyngre, färre reps, längre vila" },
  muskler: { label: "Muskler", desc: "Medeltungt, 8–12 reps" },
  kondition: { label: "Kondition", desc: "Lättare, fler reps, kort vila" },
};

export const MEASURE_LABELS: Record<Measure, string> = {
  weight_reps: "Vikt × reps",
  reps: "Reps",
  time: "Tid",
  cardio: "Tid + distans",
};

export function muscleLabel(m: string) {
  return MUSCLE_LABELS[m as Muscle] ?? m;
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m >= 10 || (m > 0 && sec === 0)) return `${m} min`;
  if (m > 0) return `${m}:${String(sec).padStart(2, "0")}`;
  return `${sec} s`;
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatKg(kg: number | null | undefined) {
  if (kg == null) return "–";
  return `${Number(kg).toLocaleString("sv-SE", { maximumFractionDigits: 2 })} kg`;
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString(
    "sv-SE",
    opts ?? { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Stockholm" },
  );
}
