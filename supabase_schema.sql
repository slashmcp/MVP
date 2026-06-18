-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. Create Tables
-- ==========================================

-- Clients Table
create table public.clients (
  id text primary key default uuid_generate_v4()::text,
  company_name text not null,
  industry text,
  location text,
  contact_person text,
  email text,
  open_roles integer default 0,
  status text default 'Prospect',
  total_placements integer default 0,
  active_since text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jobs Table
create table public.jobs (
  id text primary key default uuid_generate_v4()::text,
  title text not null,
  client text not null,
  client_id text references public.clients(id) on delete set null,
  requirements jsonb,
  location text,
  type text,
  salary text,
  status text default 'Open',
  priority text default 'Medium',
  posted_date text,
  applicants integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Candidates Table
create table public.candidates (
  id text primary key default uuid_generate_v4()::text,
  name text not null,
  email text,
  phone text,
  location text,
  role text,
  company text,
  status text default 'New',
  source text,
  rating integer default 0,
  experience text,
  seniority text,
  last_contact text,
  skills jsonb default '[]'::jsonb,
  linkedin_url text,
  website_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Placements Table
create table public.placements (
  id text primary key default uuid_generate_v4()::text,
  candidate_id text references public.candidates(id) on delete cascade,
  job_id text references public.jobs(id) on delete cascade,
  client_id text references public.clients(id) on delete cascade,
  fee integer not null,
  date text not null,
  status text default 'Pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. Setup Security / RLS (Row Level Security)
-- ==========================================

-- For the MVP we will allow anonymous access since there is no authentication setup yet.
-- WARNING: In a real production app, you should secure these with authenticated policies.

alter table public.clients enable row level security;
create policy "Allow public access to clients" on public.clients for all using (true);

alter table public.jobs enable row level security;
create policy "Allow public access to jobs" on public.jobs for all using (true);

alter table public.candidates enable row level security;
create policy "Allow public access to candidates" on public.candidates for all using (true);

alter table public.placements enable row level security;
create policy "Allow public access to placements" on public.placements for all using (true);

-- Sequences Table
create table public.sequences (
  id text primary key default uuid_generate_v4()::text,
  name text not null,
  status text default 'Draft',
  enrolled integer default 0,
  replied integer default 0,
  bounced integer default 0,
  steps jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sequences enable row level security;
create policy "Allow public access to sequences" on public.sequences for all using (true);
