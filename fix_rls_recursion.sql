-- ==========================================
-- FINAL FIX FOR RLS RECURSION
-- ==========================================

-- 1. Drop the function with CASCADE. 
-- This will automatically drop the policies that depend on it ("View Projects", "View Members").
-- This ensures we are starting fresh and no old policies are lingering.
DROP FUNCTION IF EXISTS public.is_project_member(uuid) CASCADE;

-- 2. Re-create the function as SECURITY DEFINER
-- CRITICAL: 'SECURITY DEFINER' allows this function to bypass RLS on the 'project_members' table
-- when checking membership. This breaks the infinite loop.
CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = target_project_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create "View Projects" Policy
CREATE POLICY "View Projects" 
ON public.projects FOR SELECT 
USING ( 
  -- 1. Global Owner/Admin
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'OWNER')
  OR 
  -- 2. Project Creator
  owner_id = auth.uid()
  OR 
  -- 3. Assigned Member (uses the safe SECURITY DEFINER function)
  public.is_project_member(id)
);

-- 4. Re-create "View Members" Policy
-- Only enable RLS on the table if it's not already enabled (idempotent check not easy in pure SQL script without plpgsql block, but assumes enabled)
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Members"
ON public.project_members FOR SELECT
USING (
  -- 1. Global Owner/Admin
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'OWNER')
  OR
  -- 2. The user themselves
  user_id = auth.uid()
  OR
  -- 3. Members of the same project (uses the safe SECURITY DEFINER function)
  public.is_project_member(project_id)
);

-- 5. Verification (Optional, check output in dashboard)
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'is_project_member';
-- prosecdef should be 't' (true)
