-- ==========================================
-- BITSPACE V2 - FULL CLEAN SCHEMA
-- ==========================================
-- This script sets up the entire database from scratch.
-- It includes all tables, security policies, and permission logic.
-- Run this in the Supabase SQL Editor.

-- WARNING: This will DROP ALL EXISTING DATA.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin_or_owner();
drop function if exists public.is_project_member(uuid);

drop table if exists public.comments cascade;
drop table if exists public.activities cascade;
drop table if exists public.tasks cascade;
drop table if exists public.project_members cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;

drop type if exists user_role cascade;
drop type if exists project_status cascade;
drop type if exists task_status cascade;
drop type if exists task_priority cascade;
drop type if exists member_role cascade;

-- 1. ENUMS
create type user_role as enum ('OWNER', 'MEMBER');
create type project_status as enum ('ACTIVE', 'ARCHIVED');
create type task_status as enum ('BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
create type task_priority as enum ('LOW', 'MEDIUM', 'HIGH');
create type member_role as enum ('OWNER', 'EDITOR', 'VIEWER'); -- Kept for future flexibility

-- 2. TABLES

-- Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role user_role default 'MEMBER'::user_role,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  status project_status default 'ACTIVE'::project_status,
  stats jsonb default '{"totalTasks": 0, "completedTasks": 0, "overdueTasks": 0}'::jsonb, -- Cache stats for performance? Optional.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project Members
create table public.project_members (
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role member_role default 'VIEWER'::member_role,
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- Tasks
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status task_status default 'BACKLOG'::task_status,
  priority task_priority default 'MEDIUM'::task_priority,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activities (Rich Logging)
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Comments
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- 3. HELPER FUNCTIONS (SECURITY DEFINERS)
-- These allow us to break infinite recursion loops in RLS policies by bypassing RLS for specific lookups.

-- Check if current user is an OWNER
create or replace function public.is_admin_or_owner()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'OWNER'
  );
end;
$$ language plpgsql security definer;

-- Check if current user is a MEMBER of a specific project
create or replace function public.is_project_member(target_project_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.project_members 
    where project_id = target_project_id 
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 4. ROW LEVEL SECURITY (RLS) & POLICIES

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.comments enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone" 
on public.profiles for select using ( true );

create policy "Users can update own profile" 
on public.profiles for update using ( auth.uid() = id );

-- PROJECTS
-- Select: Owners see all. Members see active projects they belong to.
create policy "View Projects" 
on public.projects for select 
using ( 
  public.is_admin_or_owner() -- Global Owner
  OR 
  owner_id = auth.uid() -- Creator
  OR 
  public.is_project_member(id) -- Assigned Member (Safe Lookup)
);

-- Insert: Only Owners can create projects
create policy "Create Projects"
on public.projects for insert
to authenticated
with check ( public.is_admin_or_owner() );

-- Update: Only Owner of the project
create policy "Update Projects"
on public.projects for update
using ( auth.uid() = owner_id );

-- PROJECT MEMBERS
-- View: Owners see all. Users see themselves. Users see members of shared projects.
create policy "View Members"
on public.project_members for select
using (
    public.is_admin_or_owner()
    OR
    user_id = auth.uid()
    OR
    public.is_project_member(project_id)
);

-- Manage: Only Owners works
create policy "Manage Members"
on public.project_members for all
using ( public.is_admin_or_owner() );

-- TASKS
-- View/Edit: If you can see the project, you can see/edit the tasks.
create policy "View Tasks" on public.tasks for select using (
    exists (select 1 from public.projects where id = project_id)
);

create policy "Manage Tasks" on public.tasks for all using (
    exists (select 1 from public.projects where id = project_id)
);

-- ACTIVITIES
create policy "View Activities" on public.activities for select using ( true );
create policy "Insert Activities" on public.activities for insert with check ( auth.uid() = user_id );

-- COMMENTS
create policy "View Comments" on public.comments for select using ( true );
create policy "Manage Comments" on public.comments for insert with check ( auth.uid() = user_id );


-- 5. TRIGGERS (User Creation)
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  input_role text;
  assigned_role public.user_role;
begin
  input_role := upper(trim(new.raw_user_meta_data->>'role'));
  
  if input_role = 'OWNER' then
    assigned_role := 'OWNER'::public.user_role;
  else
    assigned_role := 'MEMBER'::public.user_role;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
      new.id, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      assigned_role
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. STORAGE (Avatars)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
