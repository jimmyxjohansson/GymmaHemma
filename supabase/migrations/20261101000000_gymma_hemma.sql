-- Gymma Hemma: tabeller, säkerhet (RLS) och index.
-- Alla tabeller har prefixet gym_ eftersom Supabase-projektet delas med andra appar.
-- Kör den här filen först och sedan seed.sql (SQL Editor i Supabase eller `supabase db push`).

-- ---------------------------------------------------------------------------
-- Profiler (en rad per användare som använder Gymma Hemma)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  weekly_goal  smallint not null default 3 check (weekly_goal between 1 and 14),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Redskap (kategorier i övningsbanken)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_equipment (
  id         text primary key,                 -- t.ex. 'hantlar'
  name       text not null,
  emoji      text not null default '🏋️',
  weight_step numeric(5,2) not null default 0, -- förslag på viktökning i kg
  sort       smallint not null default 0,
  enabled    boolean not null default true     -- slå av redskap ni inte har
);

-- ---------------------------------------------------------------------------
-- Övningsbank (gemensam för alla användare av appen)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_exercises (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text not null default '',
  equipment_id   text not null references public.gym_equipment (id),
  primary_muscle text not null check (primary_muscle in (
    'chest','back','shoulders','biceps','triceps','quads','hamstrings',
    'glutes','calves','core','fullbody','cardio')),
  secondary_muscles text[] not null default '{}',
  -- Hur övningen loggas
  measure        text not null default 'weight_reps' check (measure in (
    'weight_reps',   -- set × reps × vikt
    'reps',          -- set × reps (kroppsvikt)
    'time',          -- set × sekunder (t.ex. planka)
    'cardio')),      -- tid + distans
  is_compound    boolean not null default false,
  unilateral     boolean not null default false,  -- per sida/arm
  created_by     uuid references auth.users (id) on delete set null,
  archived       boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (name, equipment_id)
);
create index if not exists gym_exercises_equipment_idx on public.gym_exercises (equipment_id);
create index if not exists gym_exercises_muscle_idx on public.gym_exercises (primary_muscle);

-- ---------------------------------------------------------------------------
-- Pass
-- ---------------------------------------------------------------------------
create table if not exists public.gym_workouts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title           text not null default 'Pass',
  status          text not null default 'active' check (status in ('active','done')),
  focus           text,          -- helkropp, overkropp, ben, core, kondition
  goal            text,          -- styrka, muskler, kondition
  planned_minutes smallint,
  notes           text not null default '',
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists gym_workouts_user_started_idx on public.gym_workouts (user_id, started_at desc);

create table if not exists public.gym_workout_exercises (
  id             uuid primary key default gen_random_uuid(),
  workout_id     uuid not null references public.gym_workouts (id) on delete cascade,
  exercise_id    uuid not null references public.gym_exercises (id),
  position       smallint not null default 0,
  rest_seconds   smallint not null default 90,
  notes          text not null default ''
);
create index if not exists gym_workout_exercises_workout_idx on public.gym_workout_exercises (workout_id, position);
create index if not exists gym_workout_exercises_exercise_idx on public.gym_workout_exercises (exercise_id);

create table if not exists public.gym_sets (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.gym_workout_exercises (id) on delete cascade,
  set_number          smallint not null,
  reps                smallint,
  weight_kg           numeric(6,2),
  duration_seconds    integer,
  distance_m          integer,
  target_reps         smallint,
  target_seconds      integer,
  completed           boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists gym_sets_we_idx on public.gym_sets (workout_exercise_id, set_number);

-- ---------------------------------------------------------------------------
-- Hjälpfunktion: äger inloggad användare passet?
-- ---------------------------------------------------------------------------
create or replace function public.gym_owns_workout(w_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.gym_workouts w where w.id = w_id and w.user_id = auth.uid());
$$;

create or replace function public.gym_owns_workout_exercise(we_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.gym_workout_exercises we
    join public.gym_workouts w on w.id = we.workout_id
    where we.id = we_id and w.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.gym_profiles          enable row level security;
alter table public.gym_equipment         enable row level security;
alter table public.gym_exercises         enable row level security;
alter table public.gym_workouts          enable row level security;
alter table public.gym_workout_exercises enable row level security;
alter table public.gym_sets              enable row level security;

-- Profiler: alla inloggade kan se namn (för hushållet), bara ändra sin egen
drop policy if exists gym_profiles_select on public.gym_profiles;
create policy gym_profiles_select on public.gym_profiles for select to authenticated using (true);
drop policy if exists gym_profiles_insert on public.gym_profiles;
create policy gym_profiles_insert on public.gym_profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists gym_profiles_update on public.gym_profiles;
create policy gym_profiles_update on public.gym_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Redskap: alla appens användare kan läsa och slå av/på (delat hemmagym)
drop policy if exists gym_equipment_select on public.gym_equipment;
create policy gym_equipment_select on public.gym_equipment for select to authenticated using (true);
drop policy if exists gym_equipment_update on public.gym_equipment;
create policy gym_equipment_update on public.gym_equipment for update to authenticated
  using (exists (select 1 from public.gym_profiles p where p.user_id = auth.uid()))
  with check (true);

-- Övningar: gemensam bank. Alla läser, alla lägger till, standardövningar
-- (created_by is null) och egna övningar kan ändras av appens användare.
drop policy if exists gym_exercises_select on public.gym_exercises;
create policy gym_exercises_select on public.gym_exercises for select to authenticated using (true);
drop policy if exists gym_exercises_insert on public.gym_exercises;
create policy gym_exercises_insert on public.gym_exercises for insert to authenticated with check (created_by = auth.uid());
drop policy if exists gym_exercises_update on public.gym_exercises;
create policy gym_exercises_update on public.gym_exercises for update to authenticated
  using (exists (select 1 from public.gym_profiles p where p.user_id = auth.uid()))
  with check (true);

-- Pass: helt personliga
drop policy if exists gym_workouts_all on public.gym_workouts;
create policy gym_workouts_all on public.gym_workouts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists gym_workout_exercises_all on public.gym_workout_exercises;
create policy gym_workout_exercises_all on public.gym_workout_exercises for all to authenticated
  using (public.gym_owns_workout(workout_id)) with check (public.gym_owns_workout(workout_id));

drop policy if exists gym_sets_all on public.gym_sets;
create policy gym_sets_all on public.gym_sets for all to authenticated
  using (public.gym_owns_workout_exercise(workout_exercise_id))
  with check (public.gym_owns_workout_exercise(workout_exercise_id));
