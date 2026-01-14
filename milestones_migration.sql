-- MILESTONES FEATURE MIGRATION
-- Run this in Supabase SQL Editor

-- 1. Create Milestones Table
create table public.milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamptz,
  status text default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add milestone_id to Tasks
alter table public.tasks 
add column milestone_id uuid references public.milestones(id) on delete set null;

-- 3. Enable RLS on Milestones
alter table public.milestones enable row level security;

-- 4. RLS Policies for Milestones
-- View: If you can view the project, you can view its milestones
create policy "View Milestones" 
on public.milestones for select 
using (
  exists (
    select 1 from public.projects 
    where id = public.milestones.project_id
    and (
      public.is_admin_or_owner()
      OR owner_id = auth.uid()
      OR public.is_project_member(id)
    )
  )
); 

-- Manage: Only Project Owners (or Admins) can manage milestones
create policy "Manage Milestones"
on public.milestones for all
using (
  exists (
    select 1 from public.projects 
    where id = public.milestones.project_id
    and (
      public.is_admin_or_owner() 
      OR owner_id = auth.uid()
    )
  )
);
