-- ==========================================
-- Migration: Add onboarding_completed and fix handle generation
-- ==========================================

-- 1. Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 2. Update auth trigger to handle duplicate handles cleanly
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  derived_name text;
  base_handle text;
  final_handle text;
BEGIN
  derived_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1),
    'Creator'
  );

  base_handle := lower(regexp_replace(COALESCE(split_part(NEW.email, '@', 1), 'creator'), '[^a-zA-Z0-9_]', '_', 'g'));
  
  -- Append a random string to ensure handle uniqueness (since it's UNIQUE)
  final_handle := base_handle || '_' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.profiles (
    id,
    full_name,
    handle,
    role,
    theme,
    watermark_enabled,
    onboarding_completed,
    updated_at
  )
  VALUES (
    NEW.id,
    derived_name,
    final_handle,
    'owner',
    'light',
    true,
    false,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
