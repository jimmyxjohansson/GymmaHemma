"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";

export async function saveProfileAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const display_name = String(formData.get("display_name") ?? "").trim().slice(0, 40);
  const weekly_goal = Math.min(14, Math.max(1, Number(formData.get("weekly_goal") ?? 3) || 3));
  await supabase.from("gym_profiles").update({ display_name, weekly_goal }).eq("user_id", user.id);
  revalidatePath("/", "layout");
}

export async function toggleEquipmentAction(id: string, enabled: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("gym_equipment").update({ enabled }).eq("id", id);
  revalidatePath("/", "layout");
}
