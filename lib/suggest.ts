import type { Equipment, Exercise, Focus, Goal, Muscle, PlannedExercise, RatingMap, SuggestOptions } from "./types";

/** En tidigare utförd övning (från historiken), förenklad för förslagsmotorn. */
export interface HistoryEntry {
  exercise_id: string;
  primary_muscle: Muscle;
  started_at: string; // passets starttid
  sets: {
    reps: number | null;
    weight_kg: number | null;
    duration_seconds: number | null;
    target_reps: number | null;
    target_seconds: number | null;
  }[];
}

const GOAL_PARAMS: Record<Goal, { sets: number; reps: number; isoReps: number; rest: number; isoRest: number; seconds: number }> = {
  styrka: { sets: 4, reps: 6, isoReps: 10, rest: 150, isoRest: 90, seconds: 45 },
  muskler: { sets: 3, reps: 10, isoReps: 12, rest: 90, isoRest: 60, seconds: 40 },
  kondition: { sets: 3, reps: 15, isoReps: 15, rest: 45, isoRest: 30, seconds: 40 },
};

type Slot = Muscle | Muscle[];

const FOCUS_SLOTS: Record<Focus, Slot[]> = {
  helkropp: ["quads", "back", "chest", ["hamstrings", "glutes"], "shoulders", "core", "biceps", "triceps", "calves", "back"],
  overkropp: ["chest", "back", "shoulders", "back", "chest", "biceps", "triceps", "shoulders", "core"],
  ben: ["quads", ["hamstrings", "glutes"], "glutes", "quads", "hamstrings", "calves", "core"],
  core: ["core", "core", ["glutes", "hamstrings"], "core", "back", "core"],
  kondition: [["fullbody", "glutes"], "quads", ["chest", "back"], "core", ["fullbody", "shoulders"], "glutes", "back"],
};

const CARDIO_EQUIPMENT = ["roddmaskin", "cykel", "lopband"];
const DAY = 24 * 3600 * 1000;

function asArray(slot: Slot): Muscle[] {
  return Array.isArray(slot) ? slot : [slot];
}

function roundTo(value: number, step: number) {
  const s = step > 0 ? step / 2 : 1;
  return Math.max(s, Math.round(value / s) * s);
}

function epley(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

/** Beräknar föreslagen belastning för en övning utifrån senaste passet. */
export function progression(
  ex: Exercise,
  equipment: Equipment | undefined,
  history: HistoryEntry[],
  targetReps: number | null,
  targetSeconds: number | null,
): { weight_kg: number | null; seconds: number | null; hint: string } {
  const last = history
    .filter((h) => h.exercise_id === ex.id && h.sets.length > 0)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];

  if (ex.measure === "time") {
    if (!last) return { weight_kg: null, seconds: targetSeconds, hint: "Ny övning för dig" };
    const best = Math.max(...last.sets.map((s) => s.duration_seconds ?? 0));
    const allDone = last.sets.every((s) => (s.duration_seconds ?? 0) >= (s.target_seconds ?? best));
    const seconds = allDone ? best + 5 : best || targetSeconds;
    return { weight_kg: null, seconds, hint: allDone ? "+5 s sedan förra gången" : "Samma tid som förra gången" };
  }

  if (ex.measure !== "weight_reps" || targetReps == null) {
    return { weight_kg: null, seconds: null, hint: last ? "" : "Ny övning för dig" };
  }

  if (!last) {
    return { weight_kg: null, seconds: null, hint: "Ny övning – välj en vikt där sista repsen känns tung" };
  }

  const weighted = last.sets.filter((s) => s.weight_kg != null && s.reps != null);
  if (weighted.length === 0) return { weight_kg: null, seconds: null, hint: "" };

  const step = equipment?.weight_step && equipment.weight_step > 0 ? Number(equipment.weight_step) : 2.5;
  const topWeight = Math.max(...weighted.map((s) => Number(s.weight_kg)));
  const topSets = weighted.filter((s) => Number(s.weight_kg) === topWeight);
  const lastReps = Math.min(...topSets.map((s) => s.reps ?? 0));
  const lastTarget = topSets[0]?.target_reps ?? lastReps;

  // Annat repsintervall än förra gången? Räkna om via uppskattat 1RM.
  if (Math.abs(lastTarget - targetReps) > 2) {
    const e1rm = Math.max(...weighted.map((s) => epley(Number(s.weight_kg), s.reps ?? 0)));
    const w = roundTo(e1rm / (1 + targetReps / 30), step);
    return { weight_kg: w, seconds: null, hint: `Räknat från förra passet (${topWeight} kg × ${lastReps})` };
  }

  const hitAll = topSets.every((s) => (s.reps ?? 0) >= (s.target_reps ?? targetReps));
  if (hitAll) {
    return { weight_kg: topWeight + step, seconds: null, hint: `+${step} kg – du klarade alla reps förra gången` };
  }
  return { weight_kg: topWeight, seconds: null, hint: "Samma vikt – sikta på alla reps" };
}

function estimateSeconds(p: PlannedExercise) {
  if (p.measure === "cardio") return (p.seconds ?? 0) + 60;
  const work = p.measure === "time" ? (p.seconds ?? 40) : 40;
  const perSide = p.unilateral ? 2 : 1;
  return p.sets * (work * perSide + p.rest_seconds) + 60;
}

/** Gemensam grund för förslagsmotorn: urval, poängsättning och planering av en övning. */
function makeContext(
  opts: SuggestOptions,
  exercises: Exercise[],
  equipment: Equipment[],
  history: HistoryEntry[],
  ratings: RatingMap,
  now: number,
  random: () => number,
) {
  const eqById = new Map(equipment.map((e) => [e.id, e]));
  const allowed = new Set(opts.equipment.filter((id) => eqById.get(id)?.enabled !== false));
  const pool = exercises.filter((e) => !e.archived && allowed.has(e.equipment_id));
  const params = GOAL_PARAMS[opts.goal];

  // När tränades varje muskel/övning senast?
  const muscleLast = new Map<string, number>();
  const exerciseLast = new Map<string, number>();
  const lastWorkoutTime = Math.max(0, ...history.map((h) => Date.parse(h.started_at)));
  for (const h of history) {
    const t = Date.parse(h.started_at);
    muscleLast.set(h.primary_muscle, Math.max(muscleLast.get(h.primary_muscle) ?? 0, t));
    exerciseLast.set(h.exercise_id, Math.max(exerciseLast.get(h.exercise_id) ?? 0, t));
  }
  const recentlyTrained = (m: Muscle) => now - (muscleLast.get(m) ?? 0) < 2 * DAY;

  const plan = (ex: Exercise, compoundSlot: boolean, overrides?: Partial<PlannedExercise>): PlannedExercise => {
    const isCompound = ex.is_compound && compoundSlot;
    let reps: number | null = isCompound ? params.reps : params.isoReps;
    let seconds: number | null = null;
    const baseSets = opts.minutes < 40 ? Math.min(params.sets, 3) : params.sets; // korta pass: max 3 set
    const sets = isCompound ? baseSets : Math.min(baseSets, 3);
    const rest = isCompound ? params.rest : params.isoRest;
    // Enarmsövningar: reps per sida, så håll nere antalet
    if (ex.unilateral && reps != null) reps = Math.min(reps, 10);
    if (ex.measure === "time") {
      reps = null;
      seconds = params.seconds;
    }
    if (ex.measure === "cardio") {
      reps = null;
      seconds = 300;
    }
    const prog = progression(ex, eqById.get(ex.equipment_id), history, reps, seconds);
    return {
      exercise_id: ex.id,
      name: ex.name,
      equipment_id: ex.equipment_id,
      primary_muscle: ex.primary_muscle,
      measure: ex.measure,
      unilateral: ex.unilateral,
      sets: ex.measure === "cardio" ? 1 : sets,
      reps,
      seconds: prog.seconds ?? seconds,
      weight_kg: prog.weight_kg,
      rest_seconds: ex.measure === "cardio" ? 60 : rest,
      hint: prog.hint,
      ...overrides,
    };
  };

  /** slotIndex null = konditionsval, där bas-/isoleringsbonusarna inte ska gälla. */
  const score = (ex: Exercise, slotIndex: number | null) => {
    let s = random();
    if (slotIndex !== null && ex.is_compound && slotIndex < 3) s += 1.5;
    // Egna favoriter och betyg ger en knuff, men slumpen ger fortfarande variation:
    // favorit +0,25, betyg 5 → +0,3 … betyg 1 → −0,3
    const pref = ratings[ex.id];
    if (pref?.favorite) s += 0.25;
    if (pref?.rating) s += (pref.rating - 3) * 0.15;
    if (slotIndex !== null && !ex.is_compound && slotIndex >= 3) s += 0.3;
    const last = exerciseLast.get(ex.id);
    if (last) {
      const daysAgo = (now - last) / DAY;
      if (last === lastWorkoutTime) s -= 1;
      if (daysAgo < 3) s -= 1.5;
      else if (daysAgo < 60) s += 0.5; // bekant övning med vikthistorik
    }
    return s;
  };

  /** Väljer den med högst poäng (slump + betyg + historik). */
  const best = (list: Exercise[], slotIndex: number | null) =>
    list.map((e) => ({ e, s: score(e, slotIndex) })).sort((a, b) => b.s - a.s)[0]?.e;

  const cardioPool = pool.filter((e) => e.measure === "cardio" && CARDIO_EQUIPMENT.includes(e.equipment_id));
  return { pool, params, plan, score, best, recentlyTrained, cardioPool };
}

/** Lugna konditionsövningar som passar som uppvärmning. */
const WARMUP_RE = /uppvärmning|jämn|gång/i;
const INTERVAL_RE = /intervall/i;

export function suggestWorkout(
  opts: SuggestOptions,
  exercises: Exercise[],
  equipment: Equipment[],
  history: HistoryEntry[],
  ratings: RatingMap = {},
  now = Date.now(),
  random: () => number = Math.random,
): { title: string; items: PlannedExercise[]; estimatedMinutes: number } {
  const { pool, plan, score, best, recentlyTrained, cardioPool } = makeContext(
    opts, exercises, equipment, history, ratings, now, random,
  );

  let budget = opts.minutes * 60;
  const items: PlannedExercise[] = [];
  const used = new Set<string>();

  // 1) Uppvärmning / konditionsblock
  if (opts.focus === "kondition") {
    const intervals = cardioPool.filter((e) => INTERVAL_RE.test(e.name));
    const pick = best(intervals.length ? intervals : cardioPool, null);
    if (pick) {
      const blockSec = Math.round((opts.minutes * 60 * 0.4) / 60) * 60;
      const p = plan(pick, false, { seconds: blockSec, hint: "Huvudblock – variera tempot" });
      items.push(p);
      used.add(pick.id);
      budget -= estimateSeconds(p);
    }
  } else if (opts.minutes >= 25) {
    // Slumpa bland lugna konditionsövningar (rodd, cykel, löpband, gång) i stället för att alltid ta samma
    const warmups = cardioPool.filter((e) => WARMUP_RE.test(e.name));
    const warm = best(warmups.length ? warmups : cardioPool, null);
    if (warm) {
      const p = plan(warm, false, { seconds: 300, hint: "Uppvärmning, lugnt tempo" });
      items.push(p);
      used.add(warm.id);
      budget -= estimateSeconds(p);
    }
  }

  // 2) Styrkeövningar enligt fokus. Muskler som tränats senaste 48 h flyttas bak.
  const slots = [...FOCUS_SLOTS[opts.focus]];
  if (opts.focus === "helkropp" || opts.focus === "overkropp") {
    slots.sort((a, b) => Number(asArray(a).some(recentlyTrained)) - Number(asArray(b).some(recentlyTrained)));
  }
  const strengthPool = pool.filter((e) => e.measure !== "cardio");
  const minExercises = 3;

  for (let i = 0; i < slots.length && items.length < 10; i++) {
    const muscles = asArray(slots[i]);
    const candidates = strengthPool.filter((e) => !used.has(e.id) && muscles.includes(e.primary_muscle));
    if (candidates.length === 0) continue;
    const chosen = best(candidates, i)!;
    const p = plan(chosen, i < 4);
    // Får övningen inte plats? Prova färre set (minst 2) innan vi ger upp.
    while (estimateSeconds(p) > budget && p.sets > 2) p.sets--;
    const cost = estimateSeconds(p);
    const strengthCount = items.filter((x) => x.measure !== "cardio").length;
    if (cost > budget && (strengthCount >= minExercises || budget < 120)) break;
    items.push(p);
    used.add(chosen.id);
    budget -= cost;
  }

  // 3) Avsluta konditionspass med ett kort block om tid finns kvar
  if (opts.focus === "kondition" && budget > 300) {
    const finisher = best(cardioPool.filter((e) => !used.has(e.id)), null);
    if (finisher) {
      const sec = Math.min(600, Math.floor(budget / 60) * 60 - 60);
      if (sec >= 180) items.push(plan(finisher, false, { seconds: sec, hint: "Avslutning" }));
    }
  }

  const total = items.reduce((sum, p) => sum + estimateSeconds(p), 0);
  return {
    title: titleFor(opts.focus, opts.goal),
    items,
    estimatedMinutes: Math.round(total / 60),
  };
}

function titleFor(focus: Focus, goal: Goal) {
  const f: Record<Focus, string> = {
    helkropp: "Helkropp",
    overkropp: "Överkropp",
    ben: "Ben & säte",
    core: "Core",
    kondition: "Kondition",
  };
  const g: Record<Goal, string> = { styrka: "styrka", muskler: "muskler", kondition: "kondition" };
  return focus === "kondition" ? "Konditionspass" : `${f[focus]} – ${g[goal]}`;
}

/**
 * "Föreslå ny övning": byter ut en övning i ett förslag mot en annan med samma kriterier –
 * samma huvudmuskel (eller samma typ av konditionsblock), bland passets redskap och utan
 * övningar som redan finns i passet. Set, reps och vila behålls; vikten räknas fram från historiken.
 * Returnerar null om det inte finns något alternativ.
 */
export function suggestReplacement(
  opts: SuggestOptions,
  current: PlannedExercise,
  excludeIds: string[],
  exercises: Exercise[],
  equipment: Equipment[],
  history: HistoryEntry[],
  ratings: RatingMap = {},
  now = Date.now(),
  random: () => number = Math.random,
): PlannedExercise | null {
  const { pool, plan, best, cardioPool } = makeContext(opts, exercises, equipment, history, ratings, now, random);
  const exclude = new Set([...excludeIds, current.exercise_id]);

  if (current.measure === "cardio") {
    // Samma roll: uppvärmning ↔ uppvärmning, intervaller ↔ intervaller
    const role = (name: string) => (INTERVAL_RE.test(name) ? "intervall" : WARMUP_RE.test(name) ? "lugn" : "annat");
    const free = cardioPool.filter((e) => !exclude.has(e.id));
    const sameRole = free.filter((e) => role(e.name) === role(current.name));
    const pick = best(sameRole.length ? sameRole : free, null);
    return pick ? plan(pick, false, { seconds: current.seconds, hint: current.hint }) : null;
  }

  const candidates = pool.filter(
    (e) => e.measure !== "cardio" && !exclude.has(e.id) && e.primary_muscle === current.primary_muscle,
  );
  const pick = best(candidates, current.sets >= 4 ? 0 : 3);
  if (!pick) return null;

  const p = plan(pick, true);
  // Behåll upplägget från övningen som byts ut när mätsättet är jämförbart
  const repsLike = (m: string) => m === "weight_reps" || m === "reps";
  return {
    ...p,
    sets: current.sets,
    rest_seconds: current.rest_seconds,
    reps: repsLike(p.measure) && repsLike(current.measure) && current.reps != null
      ? (pick.unilateral ? Math.min(current.reps, 10) : current.reps)
      : p.reps,
  };
}
