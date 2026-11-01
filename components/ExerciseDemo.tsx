"use client";

import { useEffect, useState } from "react";
import { guideFor } from "@/lib/exerciseGuides";

/**
 * Visar hur en övning utförs: start- och slutfoto som växlar i en loop,
 * numrerade steg och vanliga misstag. Tryck på bilden för att pausa.
 */
export default function ExerciseDemo({ name, description }: { name: string; description?: string }) {
  const guide = guideFor(name);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    try {
      setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      /* ignorera */
    }
  }, []);

  useEffect(() => {
    if (!guide?.img || !playing || reduced) return;
    const t = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1300);
    return () => clearInterval(t);
  }, [guide?.img, playing, reduced]);

  if (!guide) {
    return description ? <p className="text-sm text-muted">{description}</p> : null;
  }

  const src = (n: number) => `/ovningar/${guide.img}/${n}.webp`;

  return (
    <div className="space-y-3">
      {guide.img &&
        (reduced ? (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((n) => (
              <figure key={n} className="overflow-hidden rounded-xl bg-white">
                <img src={src(n)} alt={`${name} – ${n === 0 ? "start" : "slut"}`} className="aspect-[4/3] w-full object-contain" />
                <figcaption className="bg-surface-2 py-1 text-center text-xs text-muted">{n === 0 ? "Start" : "Slut"}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-white"
            aria-label={playing ? "Pausa animeringen" : "Spela animeringen"}
          >
            {[0, 1].map((n) => (
              <img
                key={n}
                src={src(n)}
                alt={n === 0 ? `${name} – startläge` : ""}
                aria-hidden={n === 1}
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${frame === n ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {frame === 0 ? "Start" : "Slut"}
            </span>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {playing ? "❚❚" : "▶"}
            </span>
          </button>
        ))}

      <ol className="space-y-2">
        {guide.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink">
              {i + 1}
            </span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>

      {guide.mistakes.length > 0 && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-danger">Vanliga misstag</p>
          <ul className="space-y-1 text-sm">
            {guide.mistakes.map((m, i) => (
              <li key={i}>✕ {m}</li>
            ))}
          </ul>
        </div>
      )}

      {guide.img && <p className="text-[10px] text-muted">Foton: Free Exercise DB (public domain)</p>}
    </div>
  );
}

/** Hopfällbar variant för passet och passförslaget – bilderna laddas först när den öppnas. */
export function HowToToggle({ name, description }: { name: string; description?: string }) {
  const [open, setOpen] = useState(false);
  const guide = guideFor(name);
  if (!guide && !description) return null;
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm text-accent">
        {guide?.img && !open && (
          <img src={`/ovningar/${guide.img}/0.webp`} alt="" className="h-8 w-10 rounded bg-white object-contain" />
        )}
        {open ? "Dölj utförande ▲" : "Visa utförande ▼"}
      </button>
      {open && (
        <div className="mt-3">
          <ExerciseDemo name={name} description={description} />
        </div>
      )}
    </div>
  );
}

/** Liten miniatyr (startfotot) för listor. */
export function ExerciseThumb({ name, className = "" }: { name: string; className?: string }) {
  const img = guideFor(name)?.img;
  if (!img) return <span className={`flex items-center justify-center rounded-lg bg-surface-2 text-muted ${className}`}>·</span>;
  return <img src={`/ovningar/${img}/0.webp`} alt="" loading="lazy" className={`rounded-lg bg-white object-contain ${className}`} />;
}
