import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { ensureProfile } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  await ensureProfile(supabase, user);
  const { data: active } = await supabase
    .from("gym_workouts")
    .select("id, title")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto min-h-dvh max-w-xl pb-28">
      {active && <ActiveBanner id={active.id} title={active.title} />}
      <main className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">{children}</main>
      <BottomNav />
    </div>
  );
}

function ActiveBanner({ id, title }: { id: string; title: string }) {
  return (
    <Link
      href={`/pass/${id}`}
      className="sticky top-0 z-20 flex items-center justify-between bg-accent px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-sm font-semibold text-accent-ink"
    >
      <span>● Pågående pass: {title}</span>
      <span>Fortsätt →</span>
    </Link>
  );
}
