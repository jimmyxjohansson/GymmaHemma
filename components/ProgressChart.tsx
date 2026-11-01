/** Linjediagram i SVG för utveckling över tid. Renderas på servern. */
export default function ProgressChart({
  points,
  unit,
}: {
  points: { date: string; value: number }[];
  unit: string;
}) {
  if (points.length < 2) {
    return <p className="py-6 text-center text-sm text-muted">Grafen visas efter minst två pass med övningen.</p>;
  }
  const W = 320;
  const H = 140;
  const P = { l: 34, r: 8, t: 10, b: 20 };
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.1;
  min = Math.max(0, min - pad);
  max += pad;
  const x = (i: number) => P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  const ticks = [min, (min + max) / 2, max];
  const bestIdx = vals.indexOf(Math.max(...vals));
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short", timeZone: "Europe/Stockholm" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Utveckling i ${unit}`}>
      <defs>
        <linearGradient id="pc-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
          <text x={P.l - 4} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--color-muted)">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#pc-fill)" />
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === bestIdx ? 4 : 2.5} fill={i === bestIdx ? "var(--color-accent)" : "var(--color-bg)"} stroke="var(--color-accent)" strokeWidth="1.5">
          <title>
            {fmt(p.date)}: {Math.round(p.value * 10) / 10} {unit}
          </title>
        </circle>
      ))}
      <text x={P.l} y={H - 4} fontSize="9" fill="var(--color-muted)">{fmt(points[0].date)}</text>
      <text x={W - P.r} y={H - 4} fontSize="9" fill="var(--color-muted)" textAnchor="end">{fmt(points[points.length - 1].date)}</text>
    </svg>
  );
}
