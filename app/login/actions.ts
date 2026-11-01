"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message === "Invalid login credentials" ? "Fel e-post eller lösenord." : error.message };
  }
  redirect("/");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  const required = process.env.SIGNUP_CODE?.trim();
  if (required && code !== required) return { error: "Fel hushållskod." };
  if (password.length < 8) return { error: "Lösenordet måste vara minst 8 tecken." };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) {
    // Kontot finns redan (t.ex. från en annan app i samma Supabase-projekt)
    if (/already registered/i.test(error.message)) {
      return { error: "Det finns redan ett konto med den e-posten. Logga in i stället." };
    }
    return { error: error.message };
  }
  if (!data.session) {
    return { message: "Konto skapat! Bekräfta via länken i mejlet och logga sedan in." };
  }
  redirect("/");
}
