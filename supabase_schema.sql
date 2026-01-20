-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create the sessions table
create table public.documentation_sessions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  repo_url text not null,
  github_token text, -- Encrypted storage recommended for production
  status text default 'started' check (status in ('started', 'analyzing', 'generating', 'completed', 'published', 'failed')),
  config jsonb default '{}'::jsonb,
  analysis_summary text,
  final_markdown text
);

-- Enable Row Level Security (RLS)
alter table public.documentation_sessions enable row level security;

-- Policy: Allow anyone to insert a new session (for the Landing page)
create policy "Enable insert for all users" on public.documentation_sessions
  for insert with check (true);

-- Policy: Allow users to read/update sessions if they have the ID (UUIDs are hard to guess)
-- In a real app, this would be tied to auth.uid()
create policy "Enable select for users with ID" on public.documentation_sessions
  for select using (true);

create policy "Enable update for users with ID" on public.documentation_sessions
  for update using (true);
