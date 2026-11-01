"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MUSCLES } from "@/lib/labels";
import { requireUser } from "@/lib/supabase/server";

export type ExerciseFormState = { error?: string };
const MEASURES = ["weight_reps", "reps", "time", "cardio"];

export async function saveExerciseAction(_prev: ExerciseFormState, formData: FormData): Promise<ExerciseFormState> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const equipment_id = String(formData.get("equipment_id") ?? "");
  const primary_muscle = String(formData.get("primary_muscle") ?? "");
  const measure = String(formData.get("measure") ?? "weight_reps");
  const secondary_muscles = formData.getAll("secondary_muscles").map(String).filter((m) => MUSCLES.includes(m as never) && m !== primary_muscle);

  if (!name) return { error: "Ange ett namn." };
  if (!MUSCLES.includes(primary_muscle as never)) return { error: "Välj muskelgrupp." };
  if (!MEASURES.includes(measure)) return { error: "Välj hur övningen loggas." };

  const row = {
    name,
    equipment_id,
    primary_muscle,
    secondary_muscles,
    measure,
    description: String(formData.get("description") ?? "").trim(),
    is_compound: formData.get("is_compound") === "on",
    unilateral: formData.get("unilateral") === "on",
  };

  const { data, error } = id
    ? await supabase.from("gym_exercises").update(row).eq("id", id).select("id").single()
    : await supabase.from("gym_exercises").insert({ ...row, created_by: user.id }).select("id").single();

  if (error) {
    if (error.code === "23505") return { error: "Det finns redan en övning med det namnet för det redskapet." };
    return { error: error.message };
  }
  revalidatePath("/ovningar");
  redirect(`/ovningar/${data.id}`);
}

export async function archiveExerciseAction(id: string, archived: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("gym_exercises").update({ archived }).eq("id", id);
  revalidatePath("/ovningar");
  redirect(archived ? "/ovningar" : `/ovningar/${id}`);
}
