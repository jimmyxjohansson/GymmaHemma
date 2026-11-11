import Link from "next/link";
import { getEquipment, getExercises, getRatings } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import ExerciseBrowser from "./ExerciseBrowser";

export default async function ExercisesPage() {
  const { supabase, user } = await requireUser();
  const [exercises, equipment, ratings] = await Promise.all([
    getExercises(supabase),
    getEquipment(supabase),
    getRatings(supabase, user.id),
  ]);
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <h1 className="h-display text-4xl">Övningar</h1>
        <Link href="/ovningar/ny" className="btn-primary px-3 py-2 text-sm">
          ＋ Ny övning
        </Link>
      </header>
      <ExerciseBrowser exercises={exercises} equipment={equipment} ratings={ratings} />
    </div>
  );
}
