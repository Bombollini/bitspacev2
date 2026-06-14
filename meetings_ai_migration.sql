-- Migration: Add AI Meeting Summarizer fields to meetings table

ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS meeting_notes TEXT,
ADD COLUMN IF NOT EXISTS meeting_summary JSONB;
