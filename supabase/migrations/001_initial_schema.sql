-- CraftLog schema. Every table is owned through craft_projects.user_id, and
-- RLS checks that ownership on every read and write.

create extension if not exists "uuid-ossp";

-- One row per user, only used for the plan. Created on sign up by the trigger
-- at the bottom of this file.
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  currency text not null default 'USD' check (char_length(currency) = 3)
);

create table craft_projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 2000),
  craft_type text not null default 'other' check (craft_type in ('woodworking', 'knitting_crochet', '3d_printing', 'model_building', 'sewing', 'pottery', 'electronics', 'other')),
  status text not null default 'in_progress' check (status in ('planning', 'in_progress', 'completed', 'abandoned')),
  -- Storage path inside the private project-photos bucket, not a public URL.
  -- Pages sign it on the way out.
  cover_photo_url text,
  -- Kept in sync by refresh_project_totals(), never written by the app.
  total_time_hours numeric not null default 0,
  total_material_cost numeric not null default 0,
  started_at date,
  completed_at date
);

create table project_log_entries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references craft_projects(id) on delete cascade,
  logged_at timestamptz not null default now(),
  entry_text text check (char_length(entry_text) <= 4000),
  photo_url text,
  time_spent_hours numeric check (time_spent_hours is null or (time_spent_hours >= 0 and time_spent_hours <= 24)),
  -- Sum of the materials bought in this session. Maintained by trigger.
  material_cost numeric not null default 0,
  is_milestone boolean not null default false
);

-- Line items for what a project cost. A material can belong to a log entry
-- (bought during that session) or stand alone (bought up front).
create table project_materials (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references craft_projects(id) on delete cascade,
  log_entry_id uuid references project_log_entries(id) on delete set null,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  quantity text check (char_length(quantity) <= 40),
  cost numeric not null default 0 check (cost >= 0 and cost <= 1000000)
);

create table troubleshoot_sessions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references craft_projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  photo_url text,
  problem_description text not null check (char_length(problem_description) between 1 and 2000),
  ai_diagnosis text,
  likely_causes text[] not null default '{}',
  suggested_fixes text[] not null default '{}',
  confidence text check (confidence in ('low', 'medium', 'high')),
  -- Closing the loop: did the fix work, and what actually solved it.
  resolved boolean not null default false,
  resolution_note text check (char_length(resolution_note) <= 1000),
  resolved_at timestamptz
);

create index idx_projects_user on craft_projects(user_id, status);
create index idx_entries_project on project_log_entries(project_id, logged_at desc);
create index idx_materials_project on project_materials(project_id);
create index idx_materials_entry on project_materials(log_entry_id);
create index idx_troubleshoot_project on troubleshoot_sessions(project_id, created_at desc);

-- Totals --------------------------------------------------------------------

create or replace function refresh_project_totals(pid uuid) returns void
language sql security definer set search_path = public as $$
  update craft_projects p set
    total_time_hours = coalesce((select sum(time_spent_hours) from project_log_entries e where e.project_id = pid), 0),
    total_material_cost = coalesce((select sum(cost) from project_materials m where m.project_id = pid), 0),
    updated_at = now()
  where p.id = pid;
$$;

create or replace function refresh_entry_cost(eid uuid) returns void
language sql security definer set search_path = public as $$
  update project_log_entries e set
    material_cost = coalesce((select sum(cost) from project_materials m where m.log_entry_id = eid), 0)
  where e.id = eid;
$$;

create or replace function on_entry_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform refresh_project_totals(coalesce(new.project_id, old.project_id));
  return null;
end $$;

create or replace function on_material_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'INSERT' and old.log_entry_id is not null then
    perform refresh_entry_cost(old.log_entry_id);
  end if;
  if tg_op <> 'DELETE' and new.log_entry_id is not null then
    perform refresh_entry_cost(new.log_entry_id);
  end if;
  perform refresh_project_totals(coalesce(new.project_id, old.project_id));
  return null;
end $$;

create trigger entries_totals after insert or update of time_spent_hours or delete on project_log_entries
  for each row execute function on_entry_change();

create trigger materials_totals after insert or update or delete on project_materials
  for each row execute function on_material_change();

-- Profiles --------------------------------------------------------------------

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- RLS -------------------------------------------------------------------------

alter table profiles enable row level security;
alter table craft_projects enable row level security;
alter table project_log_entries enable row level security;
alter table project_materials enable row level security;
alter table troubleshoot_sessions enable row level security;

-- Users can read their profile and change the currency, never the plan.
create policy "own_profile_read" on profiles for select using (auth.uid() = user_id);
create policy "own_profile_update" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke update on profiles from authenticated;
grant update (currency) on profiles to authenticated;

create policy "own_projects" on craft_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_entries" on project_log_entries for all using (
  exists (select 1 from craft_projects p where p.id = project_log_entries.project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from craft_projects p where p.id = project_log_entries.project_id and p.user_id = auth.uid())
);

create policy "own_materials" on project_materials for all using (
  exists (select 1 from craft_projects p where p.id = project_materials.project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from craft_projects p where p.id = project_materials.project_id and p.user_id = auth.uid())
);

create policy "own_troubleshoot" on troubleshoot_sessions for all using (
  exists (select 1 from craft_projects p where p.id = troubleshoot_sessions.project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from craft_projects p where p.id = troubleshoot_sessions.project_id and p.user_id = auth.uid())
);

-- Storage ---------------------------------------------------------------------

-- Private bucket. Files live under {user_id}/{project_id}/..., so the first
-- folder in the path decides who can touch it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-photos', 'project-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "own_photos_read" on storage.objects for select
  using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_photos_insert" on storage.objects for insert
  with check (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_photos_delete" on storage.objects for delete
  using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);
