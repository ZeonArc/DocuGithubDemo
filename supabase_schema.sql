-- DocuGithub Supabase Schema (Complete)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE: documentation_sessions
-- Main table tracking each documentation generation session
-- ============================================
create table if not exists public.documentation_sessions (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Repository info
    repo_url text not null,
    owner text,
    repo text,
    
    -- Auth info (optional, for Auth0 users)
    user_id text,
    user_email text,
    
    -- Session status
    status text default 'started' check (status in (
        'started',
        'analyzing',
        'analyzed',
        'configuring',
        'generating',
        'generated',
        'publishing',
        'published',
        'error'
    )),
    
    -- Generated content
    analysis_summary text,
    final_markdown text,
    
    -- Error tracking
    error_message text
);

-- ============================================
-- TABLE: user_configs
-- Stores user preferences for each session
-- ============================================
create table if not exists public.user_configs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Link to session
    session_id uuid references public.documentation_sessions(id) on delete cascade,
    
    -- Style preference
    style text default 'detailed' check (style in ('simple', 'detailed', 'vibrant')),
    
    -- Topics to include (JSON array)
    topics jsonb default '["Getting Started", "Installation", "Usage", "API Reference", "Contributing"]'::jsonb,
    
    -- Reference images (JSON array of URLs)
    images jsonb default '[]'::jsonb,
    
    -- GitHub token (encrypted in production!)
    github_token text
);

-- ============================================
-- TABLE: n8n_logs
-- Debug logs from n8n workflow executions
-- ============================================
create table if not exists public.n8n_logs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Link to session
    session_id uuid references public.documentation_sessions(id) on delete cascade,
    
    -- Log details
    step text,
    message text,
    status text check (status in ('info', 'success', 'warning', 'error')),
    
    -- Optional metadata
    metadata jsonb
);

-- ============================================
-- STORAGE: assets bucket
-- For storing reference images and generated files
-- ============================================
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

-- Enable RLS
alter table public.documentation_sessions enable row level security;
alter table public.user_configs enable row level security;
alter table public.n8n_logs enable row level security;

-- Policy: Allow public insert (for demo, tighten in production)
create policy "Allow public insert on sessions"
on public.documentation_sessions for insert
to public
with check (true);

-- Policy: Allow public select
create policy "Allow public select on sessions"
on public.documentation_sessions for select
to public
using (true);

-- Policy: Allow public update
create policy "Allow public update on sessions"
on public.documentation_sessions for update
to public
using (true);

-- Policy: Allow public insert on configs
create policy "Allow public insert on configs"
on public.user_configs for insert
to public
with check (true);

-- Policy: Allow public select on configs
create policy "Allow public select on configs"
on public.user_configs for select
to public
using (true);

-- Policy: Allow public update on configs
create policy "Allow public update on configs"
on public.user_configs for update
to public
using (true);

-- Policy: Allow public insert on logs
create policy "Allow public insert on logs"
on public.n8n_logs for insert
to public
with check (true);

-- Policy: Allow public select on logs
create policy "Allow public select on logs"
on public.n8n_logs for select
to public
using (true);

-- Storage policies
create policy "Public Access to Assets"
on storage.objects for select
to public
using (bucket_id = 'assets');

create policy "Allow Uploads to Assets"
on storage.objects for insert
to public
with check (bucket_id = 'assets');

-- ============================================
-- FUNCTIONS: Auto-update updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger for documentation_sessions
create trigger on_session_update
    before update on public.documentation_sessions
    for each row
    execute function public.handle_updated_at();

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_sessions_status on public.documentation_sessions(status);
create index if not exists idx_sessions_user on public.documentation_sessions(user_id);
create index if not exists idx_configs_session on public.user_configs(session_id);
create index if not exists idx_logs_session on public.n8n_logs(session_id);
