-- Migration: Add metadata columns to media_assets

ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS height integer;
