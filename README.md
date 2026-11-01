# Gymma Hemma 🏋️

En mobilapp (PWA) för att planera och logga träningspass i hemmagymmet. Den är byggd med Next.js (App Router), Supabase och Vercel.

## Funktioner

- **Passförslag.** Du väljer tid, fokus (helkropp, överkropp, ben, core, kondition), mål (styrka, muskler, kondition) och dagens redskap. Appen sätter ihop ett pass utifrån dina val och tar hänsyn till din historik:
  - Muskler du tränat de senaste 48 timmarna läggs sist i passet.
  - Övningar du gjorde nyligen nedprioriteras, så att det blir variation.
  - **Progression:** om du klarade alla reps förra gången föreslås lite tyngre vikt (+2 kg för hantlar, +4 kg för kettlebell, +5 kg för multigym). Om du byter repsintervall räknas vikten om via uppskattat 1RM.
  - I förslaget kan du byta, flytta och ta bort övningar, lägga till nya och ändra set, reps och vikt innan du startar passet.
- **Loggning.** Du loggar set × reps × vikt, tid (t.ex. planka) eller tid och distans (kondition). Du ser vad du gjorde förra gången. Varje övning har en vilotimer som vibrerar och piper när vilan är slut, och du kan skriva anteckningar per övning och per pass. Skärmen hålls tänd under passet. Allt sparas löpande.
- **Övningsbank.** Ett 60-tal övningar för hantlar, kettlebells, multigym (latsdrag, kabelrodd, bröstpress/butterfly, benspark/lårcurl), roddmaskin, cykel, löpband och kroppsvikt. Banken är gemensam för hushållet och alla kan lägga till och redigera övningar.
- **Statistik.** Passhistorik per månad, pass per vecka jämfört med veckomålet, veckostreak, graf per övning (uppskattat 1RM, reps, tid eller distans), personbästa och 🏆 när du slår ett rekord.
- **Flera användare.** Var och en har ett eget konto och en egen historik. Redskapen (vilka som är påslagna) delas av alla.

## Kom igång

### 1. Supabase-tabeller

Alla tabeller har prefixet `gym_`, så de krockar inte med andra appar i samma Supabase-projekt.

1. Öppna **SQL Editor** i Supabase.
2. Kör `supabase/migrations/20261101000000_gymma_hemma.sql`.
3. Kör `supabase/seed.sql` för redskap och övningar. Filen går att köra flera gånger utan dubbletter.

Om du använder Supabase CLI kan du i stället köra `supabase db push` och sedan köra seed-filen.

**Auth-inställningar** (Authentication → URL Configuration): lägg till din Vercel-URL, t.ex. `https://gymma-hemma.vercel.app/**`, under *Redirect URLs*. Då fungerar länken i bekräftelsemejlet. Mallen för bekräftelsemejlet behöver inte ändras.

### 2. Miljövariabler

Kopiera `.env.example` till `.env.local` och fyll i:

| Variabel | Var |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Samma ställe (anon/public key) |
| `SIGNUP_CODE` | *Valfri.* En hushållskod som krävs för att skapa konto, så att främlingar inte kan registrera sig. |

Om ni redan har konton i Supabase-projektet (från en annan app) kan ni logga in direkt med dem.

### 3. Vercel

1. Importera repot i Vercel. Next.js identifieras automatiskt.
2. Lägg in miljövariablerna ovan.
3. Driftsätt.

### Lokalt

```bash
npm install
npm run dev
```

## Installera på mobilen

- **iPhone:** Safari → Dela → *Lägg till på hemskärmen*
- **Android:** Chrome → ⋮ → *Installera app*

## Datamodell

```
gym_profiles          user_id, display_name, weekly_goal
gym_equipment         id ('hantlar'…), name, emoji, weight_step, enabled
gym_exercises         name, equipment_id, primary_muscle, secondary_muscles[], measure, is_compound, unilateral
gym_workouts          user_id, title, status (active/done), focus, goal, started_at, finished_at, notes
gym_workout_exercises workout_id, exercise_id, position, rest_seconds, notes
gym_sets              workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_m, target_*, completed
```

`measure` styr hur en övning loggas: `weight_reps`, `reps`, `time` eller `cardio`. Radnivåsäkerhet (RLS) gör att pass och set bara syns för sin ägare. Övningar och redskap är gemensamma.

## Struktur

```
app/(app)/            inloggade sidor: hem, forslag, pass/[id], historik, ovningar, profil
app/login, app/auth   inloggning, registrering, e-postbekräftelse, utloggning
lib/suggest.ts        förslagsmotorn (ren funktion, lätt att justera)
lib/stats.ts          veckostatistik, streak, 1RM
supabase/             migration + seed
```
