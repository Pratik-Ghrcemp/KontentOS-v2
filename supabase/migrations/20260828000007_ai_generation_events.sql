-- Migration: Create ai_generation_events table

create table public.ai_generation_events (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    task_type text not null, -- e.g., 'caption_rewrite', 'hook_suggestion'
    provider text not null, -- e.g., 'openai', 'mock'
    request_json jsonb not null,
    response_json jsonb,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ai_generation_events enable row level security;

-- Policies for ai_generation_events
create policy "Users can view own ai events"
    on public.ai_generation_events for select
    using (auth.uid() = user_id);

create policy "Users can insert own ai events"
    on public.ai_generation_events for insert
    with check (auth.uid() = user_id);
