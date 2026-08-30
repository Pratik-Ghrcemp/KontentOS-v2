-- ==========================================
-- Migration: Caption Segments
-- ==========================================

CREATE TABLE IF NOT EXISTS public.caption_segments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  start_time numeric NOT NULL,
  end_time numeric NOT NULL,
  style text DEFAULT 'kinetic',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.caption_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their caption segments" ON public.caption_segments;

CREATE POLICY "Users can manage their caption segments" 
ON public.caption_segments 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional: Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_caption_segments_modtime ON public.caption_segments;

CREATE TRIGGER update_caption_segments_modtime
BEFORE UPDATE ON public.caption_segments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
