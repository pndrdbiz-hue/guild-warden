# Guild Warden Admin Dashboard - Setup Guide

This is the admin dashboard for managing your Discord verification bot. It provides a clean web interface to configure bot settings and manage student verifications.

## Prerequisites

- Node.js 18+ installed
- Your Discord bot already running (Python discord.py)
- Supabase project with the following tables created

## Database Schema

### 1. Create `students` table in Supabase:

```sql
create table public.students (
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

-- For testing, allow public access (update this for production)
create policy "Allow public read access" on public.students
  for select using (true);

create policy "Allow public insert access" on public.students
  for insert with check (true);

create policy "Allow public update access" on public.students
  for update using (true);
```

### 2. Create `bot_config` table in Supabase:

```sql
create table public.bot_config (
  guild_id text primary key,
  verify_channel_id text,
  verifier_role_id text,
  student_role_id text,
  updated_at timestamptz default now()
);

alter table public.bot_config enable row level security;

-- For testing, allow public access (update this for production)
create policy "Allow public read access" on public.bot_config
  for select using (true);

create policy "Allow public upsert access" on public.bot_config
  for all using (true);
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase connection:**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Or update `src/lib/supabase.ts` directly with your credentials.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the dashboard:**
   Open http://localhost:5173 in your browser.

## Features

### Students Page (/)
- View all student verification requests
- See verification status (Pending/Verified)
- Approve or reject students
- Updates are reflected in real-time in Supabase

### Config Page (/config)
- Select verification channel
- Choose verifier role
- Choose student role
- Save configuration to Supabase

## Connecting to Your Python Bot

Your Python bot should:

1. **Read configuration from Supabase:**
   ```python
   config = supabase.table('bot_config').select('*').eq('guild_id', 'default').single().execute()
   verify_channel_id = config.data['verify_channel_id']
   ```

2. **Listen for verification updates:**
   ```python
   # When a student is approved in the dashboard
   student = supabase.table('students').select('*').eq('discord_id', discord_id).single().execute()
   if student.data['verified']:
       # Assign student role in Discord
       await member.add_roles(student_role)
   ```

## Production Deployment

1. Update RLS policies for proper security
2. Add authentication (Discord OAuth2 recommended)
3. Deploy using `npm run build`
4. Host on Vercel, Netlify, or your preferred platform

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **State Management:** TanStack Query
- **UI Components:** shadcn/ui

## Notes

- Currently configured for open access (proof of concept)
- Channel and role dropdowns use mock data - integrate with Discord API
- Add Discord OAuth2 for production admin access
- Consider rate limiting for production use
