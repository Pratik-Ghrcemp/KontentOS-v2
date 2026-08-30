-- ==========================================
-- KontentOS Auth Bootstrap + Lightweight RBAC
-- ==========================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'editor', 'viewer'));

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  derived_name text;
  derived_handle text;
BEGIN
  derived_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1),
    'Creator'
  );

  derived_handle := lower(regexp_replace(COALESCE(split_part(NEW.email, '@', 1), 'creator'), '[^a-zA-Z0-9_]', '_', 'g'));

  INSERT INTO public.profiles (
    id,
    full_name,
    handle,
    role,
    theme,
    watermark_enabled,
    updated_at
  )
  VALUES (
    NEW.id,
    derived_name,
    derived_handle,
    'owner',
    'light',
    true,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their media assets" ON public.media_assets;
DROP POLICY IF EXISTS "Users can view their audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can manage their brand deals" ON public.brand_deals;
DROP POLICY IF EXISTS "Users can manage their AI ideas" ON public.ai_ideas;

CREATE POLICY "Users can select own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can manage own social connections" ON public.social_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own media assets" ON public.media_assets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own audit reports" ON public.audit_reports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own brand deals" ON public.brand_deals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own AI ideas" ON public.ai_ideas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
