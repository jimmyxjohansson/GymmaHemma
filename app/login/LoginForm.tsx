"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginForm({ needsCode }: { needsCode: boolean }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  return (
    <div className="card">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? "bg-accent text-accent-ink" : "text-muted"}`}
          >
            {m === "in" ? "Logga in" : "Skapa konto"}
          </button>
        ))}
      </div>

      <form action={mode === "in" ? inAction : upAction} className="space-y-3">
        {mode === "up" && (
          <div>
            <label className="label" htmlFor="name">Namn</label>
            <input id="name" name="name" className="input" autoComplete="given-name" required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">E-post</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Lösenord</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            minLength={mode === "up" ? 8 : undefined}
            required
          />
        </div>
        {mode === "up" && needsCode && (
          <div>
            <label className="label" htmlFor="code">Hushållskod</label>
            <input id="code" name="code" className="input" required />
          </div>
        )}

        {state.error && <p className="rounded-lg bg-danger/15 p-3 text-sm text-danger">{state.error}</p>}
        {state.message && <p className="rounded-lg bg-ok/15 p-3 text-sm text-ok">{state.message}</p>}

        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Vänta…" : mode === "in" ? "Logga in" : "Skapa konto"}
        </button>
      </form>
      {mode === "in" && (
        <p className="mt-4 text-center text-xs text-muted">
          Har du redan ett konto i en annan av era appar med samma Supabase? Då kan du logga in direkt.
        </p>
      )}
    </div>
  );
}
