-- 7. AI IDEAS (Idea Studio)
CREATE TABLE public.ai_ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category text,
  badge text,
  badge_color text,
  title text NOT NULL,
  hook_tip text,
  format text,
  velocity text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.ai_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their AI ideas" ON public.ai_ideas FOR ALL USING (auth.uid() = user_id);
