-- Meetings Table Migration

create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  meeting_date timestamptz not null,
  meeting_link text,
  retrospective text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.meetings enable row level security;

-- View: If you can see the project, you can see its meetings
create policy "View Meetings" on public.meetings for select using (
    exists (select 1 from public.projects where id = project_id)
);

-- Manage: If you can see the project, you can manage its meetings
create policy "Manage Meetings" on public.meetings for all using (
    exists (select 1 from public.projects where id = project_id)
);
