-- Migration: Create render_jobs table

create type render_job_status as enum ('queued', 'processing', 'completed', 'failed', 'cancelled');

create table public.render_jobs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    media_asset_id uuid references public.media_assets(id) on delete cascade not null,
    status render_job_status default 'queued'::render_job_status not null,
    progress integer default 0 check (progress >= 0 and progress <= 100),
    request_json jsonb not null,
    result_json jsonb,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

create table public.render_job_events (
    id uuid default gen_random_uuid() primary key,
    job_id uuid references public.render_jobs(id) on delete cascade not null,
    event_type text not null,
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.render_jobs enable row level security;
alter table public.render_job_events enable row level security;

-- Policies for render_jobs
create policy "Users can view own render jobs"
    on public.render_jobs for select
    using (auth.uid() = user_id);

create policy "Users can create own render jobs"
    on public.render_jobs for insert
    with check (auth.uid() = user_id);

create policy "Users can update own render jobs"
    on public.render_jobs for update
    using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger handle_updated_at before update on public.render_jobs
    for each row execute procedure update_modified_column();
