import { getEquipment, getExercises } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import SuggestClient from "./SuggestClient";

export default async function SuggestPage({ searchParams }: { searchParams: Promise<{ tomt?: string }> }) {
  const { supabase } = await requireUser();
  const [equipment, exercises, sp] = await Promise.all([getEquipment(supabase), getExercises(supabase), searchParams]);
  return <SuggestClient equipment={equipment.filter((e) => e.enabled)} exercises={exercises} empty={sp.tomt === "1"} />;
}
