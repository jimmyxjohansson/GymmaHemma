import Link from "next/link";
import ExerciseForm from "@/components/ExerciseForm";
import { getEquipment } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";

export default async function NewExercisePage() {
  const { supabase } = await requireUser();
  const equipment = await getEquipment(supabase);
  return (
    <div className="space-y-4">
      <Link href="/ovningar" className="text-sm text-muted">← Övningar</Link>
      <h1 className="h-display text-4xl">Ny övning</h1>
      <ExerciseForm equipment={equipment} />
    </div>
  );
}
