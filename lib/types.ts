export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "fullbody"
  | "cardio";

export type Measure = "weight_reps" | "reps" | "time" | "cardio";

export type Focus = "helkropp" | "overkropp" | "ben" | "core" | "kondition";
export type Goal = "styrka" | "muskler" | "kondition";

export interface Equipment {
  id: string;
  name: string;
  emoji: string;
  weight_step: number;
  sort: number;
  enabled: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  equipment_id: string;
  primary_muscle: Muscle;
  secondary_muscles: string[];
  measure: Measure;
  is_compound: boolean;
  unilateral: boolean;
  created_by: string | null;
  archived: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "done";
  focus: Focus | null;
  goal: Goal | null;
  planned_minutes: number | null;
  notes: string;
  started_at: string;
  finished_at: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  rest_seconds: number;
  notes: string;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_m: number | null;
  target_reps: number | null;
  target_seconds: number | null;
  completed: boolean;
}

/** Ett förslag på en övning i ett pass innan det har startats. */
export interface PlannedExercise {
  exercise_id: string;
  name: string;
  equipment_id: string;
  primary_muscle: Muscle;
  measure: Measure;
  unilateral: boolean;
  sets: number;
  reps: number | null;
  seconds: number | null;
  weight_kg: number | null;
  rest_seconds: number;
  /** Kort förklaring, t.ex. "+2 kg sedan förra gången" */
  hint: string;
}

export interface SuggestOptions {
  minutes: number;
  focus: Focus;
  goal: Goal;
  equipment: string[];
}

/** Användarens eget betyg och favoritmarkering för en övning. */
export interface ExercisePref {
  rating: number | null; // 1–5
  favorite: boolean;
}
/** exercise_id → betyg/favorit för inloggad användare */
export type RatingMap = Record<string, ExercisePref>;
