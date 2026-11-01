import Link from "next/link";
import { getEquipment, getExercises } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import ExerciseBrowser from "./ExerciseBrowser";

export default async function ExercisesPage() {
  const { supabase } = await requireUser();
  const [exercises, equipment] = await Promise.all([getExercises(supabase), getEquipment(supabase)]);
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <h1 className="h-display text-4xl">Övningar</h1>
        <Link href="/ovningar/ny" className="btn-primary px-3 py-2 text-sm">
          ＋ Ny övning
        </Link>
      </header>
      <ExerciseBrowser exercises={exercises} equipment={equipment} />
    </div>
  );
}
