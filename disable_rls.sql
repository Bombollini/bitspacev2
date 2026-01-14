-- ==========================================
-- DISABLE RLS CAUTION: PUBLIC ACCESS
-- ==========================================
-- This script disables Row Level Security on all tables.
-- This means ALL data will be accessible to ANY logged-in user (and potentially public if policies were allowing anon).

-- 1. Disable RLS on core tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones DISABLE ROW LEVEL SECURITY;

-- 2. Drop the problematic recursive policies and functions just to clean up (Optional but good practice)
DROP POLICY IF EXISTS "View Projects" ON public.projects;
DROP POLICY IF EXISTS "View Members" ON public.project_members;
DROP FUNCTION IF EXISTS public.is_project_member(uuid) CASCADE;

-- 3. Ensure public/authenticated roles have grants (usually they do, but good to ensure accessibility)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Done. No more RLS checks will occur.
