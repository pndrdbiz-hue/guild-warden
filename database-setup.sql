-- Guild Warden Admin Dashboard - Database Setup
-- Run this entire file in your Supabase SQL Editor

-- ============================================
-- 1. STUDENTS TABLE
-- ============================================
create table if not exists public.students (
  discord_id text primary key,
  email text not null,
  h_number text not null,
  verified boolean default false,
  submitted_at timestamptz default now(),
  verified_at timestamptz,
  verified_by text,
  notes text
);

alter table public.students enable row level security;

-- RLS Policies for students (open access for testing)
create policy "Allow public read access" on public.students
  for select using (true);

create policy "Allow public insert access" on public.students
  for insert with check (true);

create policy "Allow public update access" on public.students
  for update using (true);

-- Indexes for performance
create index if not exists idx_students_verified on public.students(verified);
create index if not exists idx_students_submitted_at on public.students(submitted_at desc);

-- ============================================
-- 2. BOT CONFIG TABLE
-- ============================================
create table if not exists public.bot_config (
  guild_id text primary key,
  verify_channel_id text,
  verifier_role_id text,
  student_role_id text,
  updated_at timestamptz default now()
);

alter table public.bot_config enable row level security;

-- RLS Policies for bot_config (open access for testing)
create policy "Allow public read access" on public.bot_config
  for select using (true);

create policy "Allow public upsert access" on public.bot_config
  for all using (true);

-- ============================================
-- 3. AUDIT LOGS TABLE
-- ============================================
create table if not exists public.audit_logs (
  id bigserial primary key,
  action text not null,
  student_id text not null,
  h_number text,
  performed_by text not null,
  performed_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

-- RLS Policies for audit_logs (open access for testing)
create policy "Allow public read access" on public.audit_logs
  for select using (true);

create policy "Allow public insert access" on public.audit_logs
  for insert with check (true);

-- Index for faster queries
create index if not exists idx_audit_logs_performed_at on public.audit_logs(performed_at desc);
create index if not exists idx_audit_logs_student_id on public.audit_logs(student_id);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is now ready for Guild Warden Admin Dashboard
-- 
-- IMPORTANT: For production, update RLS policies to restrict access
-- to authenticated admins only.
