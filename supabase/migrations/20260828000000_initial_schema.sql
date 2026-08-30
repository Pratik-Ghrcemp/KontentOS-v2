-- ==========================================
-- KontentOS V3: Initial PostgreSQL Schema
-- ==========================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CREATOR PROFILES (Extends Supabase auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamp with time zone,
  handle text UNIQUE,
  full_name text,
  niche text,
  is_pro boolean DEFAULT false,
  theme text DEFAULT 'light',
  watermark_enabled boolean DEFAULT true,
  bio text
);
-- RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. SOCIAL CONNECTIONS (For Omni-Channel Sync)
CREATE TABLE public.social_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL, -- e.g., 'instagram', 'youtube', 'linkedin'
  platform_account_id text,
  username text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their social connections" ON public.social_connections FOR ALL USING (auth.uid() = user_id);

-- 3. PROJECTS / POSTS (Content Calendar & Studio Hub)
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  status text DEFAULT 'draft', -- 'draft', 'queued', 'published'
  scheduled_for timestamp with time zone,
  platforms_targeted text[], -- Array of platforms
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- 4. MEDIA ASSETS (Raw Studio Videos, Exports, Audio)
CREATE TABLE public.media_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL, -- 'raw_video', 'exported_video', 'thumbnail', 'audio'
  storage_path text NOT NULL, -- Links to Supabase Storage Bucket
  duration_seconds numeric,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their media assets" ON public.media_assets FOR ALL USING (auth.uid() = user_id);

-- 5. AUDIT REPORTS & ANALYTICS (Growth Hub)
CREATE TABLE public.audit_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  diagnostic_score integer,
  retention_3s numeric,
  total_views integer DEFAULT 0,
  issues jsonb DEFAULT '[]'::jsonb,
  ai_coach_tip text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their audit reports" ON public.audit_reports FOR ALL USING (auth.uid() = user_id);

-- 6. BRAND DEALS (Monetization Hub)
CREATE TABLE public.brand_deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand_name text NOT NULL,
  deal_amount numeric NOT NULL,
  status text DEFAULT 'negotiating', -- 'negotiating', 'production', 'invoiced', 'paid'
  deliverables text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their brand deals" ON public.brand_deals FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- Triggers for auto-updating timestamps
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_brand_deals_modtime BEFORE UPDATE ON public.brand_deals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
