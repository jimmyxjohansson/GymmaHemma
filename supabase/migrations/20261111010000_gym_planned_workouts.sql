-- Gymma Hemma: sparade (planerade) pass med valt datum.
-- status: planned (sparat till en dag) → active (pågår) → done (klart)

alter table public.gym_workouts drop constraint if exists gym_workouts_status_check;
alter table public.gym_workouts
  add constraint gym_workouts_status_check check (status in ('planned', 'active', 'done'));

alter table public.gym_workouts add column if not exists scheduled_for date;

create index if not exists gym_workouts_user_planned_idx
  on public.gym_workouts (user_id, scheduled_for)
  where status = 'planned';
