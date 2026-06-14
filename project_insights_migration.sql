-- Migration: Add ai_project_insights table for Phase 3 Smart Project Monitoring

CREATE TABLE IF NOT EXISTS public.ai_project_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  health_score INT NOT NULL,
  risk_level TEXT NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  delay_prediction TEXT,
  bottlenecks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for ai_project_insights
ALTER TABLE public.ai_project_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View AI Insights" 
ON public.ai_project_insights FOR SELECT 
USING ( 
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id)
);

CREATE POLICY "Manage AI Insights" 
ON public.ai_project_insights FOR ALL 
USING ( 
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id)
);
