import ConfirmSubmit from "@/components/ConfirmSubmit";
import { ensureProfile, getEquipment } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { saveProfileAction, toggleEquipmentAction } from "./actions";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const [profile, equipment] = await Promise.all([ensureProfile(supabase, user), getEquipment(supabase)]);

  return (
    <div className="space-y-5">
      <h1 className="h-display text-4xl">Profil</h1>

      <form action={saveProfileAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="display_name">Namn</label>
          <input id="display_name" name="display_name" className="input" defaultValue={profile.display_name} />
        </div>
        <div>
          <label className="label" htmlFor="weekly_goal">Veckomål (antal pass)</label>
          <select id="weekly_goal" name="weekly_goal" className="input" defaultValue={profile.weekly_goal}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} pass per vecka
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted">Inloggad som {user.email}</p>
        <ConfirmSubmit className="btn-primary w-full" pendingText="Sparar…">
          Spara
        </ConfirmSubmit>
      </form>

      <section className="card space-y-3">
        <div>
          <h2 className="font-semibold">Redskap i hemmagymmet</h2>
          <p className="text-sm text-muted">Gäller hela hushållet. Avstängda redskap används inte i passförslag.</p>
        </div>
        <ul className="divide-y divide-line">
          {equipment.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <span>
                {e.emoji} {e.name}
              </span>
              <form action={toggleEquipmentAction.bind(null, e.id, !e.enabled)}>
                <button
                  className={`relative h-7 w-12 rounded-full transition ${e.enabled ? "bg-accent" : "bg-surface-2 border border-line"}`}
                  aria-label={`${e.enabled ? "Stäng av" : "Slå på"} ${e.name}`}
                  aria-pressed={e.enabled}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full transition-all ${e.enabled ? "left-6 bg-accent-ink" : "left-1 bg-muted"}`}
                  />
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-2 text-sm text-muted">
        <h2 className="font-semibold text-ink">Installera som app</h2>
        <p>
          <b className="text-ink">iPhone:</b> öppna i Safari → Dela → ”Lägg till på hemskärmen”.
        </p>
        <p>
          <b className="text-ink">Android:</b> öppna i Chrome → menyn ⋮ → ”Installera app”.
        </p>
      </section>

      <form action="/auth/signout" method="post">
        <button className="btn-ghost w-full">Logga ut</button>
      </form>
    </div>
  );
}
