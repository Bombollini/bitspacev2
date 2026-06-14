-- Migration: Add parent_task_id to tasks table for Phase 2 AI Subtasks

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.tasks.parent_task_id IS 'ID of the parent task if this is a subtask';
