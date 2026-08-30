-- Migration: Create text_overlays and enhance projects

-- Enhance projects table to store editor settings JSON
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS platform_preset text DEFAULT 'instagram-reels';

-- Create text_overlays table
CREATE TABLE IF NOT EXISTS public.text_overlays (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    text text NOT NULL,
    type text NOT NULL,
    start_time numeric NOT NULL,
    end_time numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.text_overlays ENABLE ROW LEVEL SECURITY;

-- Policies for text_overlays
CREATE POLICY "Users can view own text overlays"
    ON public.text_overlays FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text overlays"
    ON public.text_overlays FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text overlays"
    ON public.text_overlays FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own text overlays"
    ON public.text_overlays FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_text_overlays_updated_at BEFORE UPDATE ON public.text_overlays
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
