-- Gymma Hemma: personliga betyg (1–5) och favoriter per övning.
-- Varje användare ser och ändrar bara sina egna rader.

create table if not exists public.gym_exercise_ratings (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.gym_exercises (id) on delete cascade,
  rating      smallint check (rating between 1 and 5),
  favorite    boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create index if not exists gym_exercise_ratings_exercise_idx on public.gym_exercise_ratings (exercise_id);

alter table public.gym_exercise_ratings enable row level security;

drop policy if exists gym_exercise_ratings_all on public.gym_exercise_ratings;
create policy gym_exercise_ratings_all on public.gym_exercise_ratings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
