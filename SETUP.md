# Guild Warden Admin Dashboard - Complete Setup Guide

This is a production-ready admin dashboard for managing your Discord verification bot. It provides a clean Discord-inspired web interface to configure bot settings, manage student verifications, view analytics, and audit all actions.

## Features

✅ **Dashboard** - Real-time stats and verification charts  
✅ **Student Management** - View, filter (Pending/Verified/Rejected), approve/reject students  
✅ **Bot Configuration** - Set Discord channel and role IDs  
✅ **Audit Logs** - Track all verification actions  
✅ **Discord-Inspired Dark UI** - Modern blurple theme with smooth animations  
✅ **Mobile Responsive** - Works on all devices  

## Prerequisites

- Node.js 18+ installed
- Your Discord bot already running (Python discord.py)
- Supabase project (free tier works fine)

## Database Schema

Run these SQL queries in your Supabase SQL Editor to create all required tables:

### 1. Create `students` table:

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

### 2. Create `bot_config` table:

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

### 3. Create `audit_logs` table:

```sql
create table public.audit_logs (
  id bigserial primary key,
  action text not null,
  student_id text not null,
  h_number text,
  performed_by text not null,
  performed_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

-- For testing, allow public access (update this for production)
create policy "Allow public read access" on public.audit_logs
  for select using (true);

create policy "Allow public insert access" on public.audit_logs
  for insert with check (true);

-- Create an index for faster queries
create index idx_audit_logs_performed_at on public.audit_logs(performed_at desc);
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

## Pages Overview

### Dashboard (/)
- **Total Students** - Count of all verification requests
- **Verified Students** - Successfully approved students
- **Pending Students** - Awaiting review
- **Rejected Students** - Denied requests
- **Chart** - Verifications over the last 7 days

### Students (/students)
- View all students with full details
- **Filters:** All, Pending, Verified, Rejected
- Approve/Reject buttons with instant Supabase updates
- Shows: Discord ID, Email, H-Number, Status, Timestamps, Notes
- All actions are logged to audit_logs table

### Config (/config)
- Select verification channel from dropdown
- Choose verifier role (who can approve)
- Choose student role (assigned on approval)
- Shows "Last Updated" timestamp
- Save configuration to Supabase

### Audit Logs (/logs)
- Complete history of all approve/reject actions
- Shows: Action, Student ID, H-Number, Performed By, Timestamp
- Sortable and searchable
- Color-coded badges (green for approved, red for rejected)

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

### Security Enhancements (Recommended)

1. **Update RLS Policies** - Restrict table access to authenticated admins only
2. **Add Authentication** - Implement Discord OAuth2 for admin-only access
3. **Environment Variables** - Use proper secrets management in production
4. **Rate Limiting** - Add API rate limits to prevent abuse

### Deployment Steps

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to hosting platform:**
   - **Vercel** (Recommended): Connect your GitHub repo, auto-deploys
   - **Netlify**: Drag & drop `dist` folder or connect repo
   - **Railway/Render**: Follow platform-specific React deployment guides

3. **Set environment variables** on your hosting platform:
   ```
   VITE_SUPABASE_URL=your-actual-url
   VITE_SUPABASE_ANON_KEY=your-actual-key
   ```

### Production Checklist

- [ ] All Supabase tables created with correct schema
- [ ] RLS policies updated for security
- [ ] Environment variables configured
- [ ] Admin authentication implemented
- [ ] Bot successfully reading/writing to Supabase
- [ ] Test approve/reject workflow end-to-end
- [ ] Verify audit logs are being created

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS with Discord-inspired dark theme
- **Database:** Supabase (PostgreSQL)
- **State Management:** TanStack React Query
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Charts:** Recharts
- **Routing:** React Router v6

## File Structure

```
src/
├── components/
│   ├── Layout.tsx              # Main layout with sidebar
│   └── ui/                     # shadcn/ui components
├── pages/
│   ├── Dashboard.tsx           # Stats and charts
│   ├── Students.tsx            # Student management with filters
│   ├── Config.tsx              # Bot configuration
│   └── Logs.tsx                # Audit log viewer
├── lib/
│   └── supabase.ts             # Supabase client & types
├── App.tsx                     # Routes
└── main.tsx                    # Entry point
```

## Integration with Python Bot

Your Discord bot should:

### Read Config on Startup
```python
config = supabase.table('bot_config').select('*').eq('guild_id', 'default').single().execute()
VERIFY_CHANNEL_ID = config.data['verify_channel_id']
VERIFIER_ROLE_ID = config.data['verifier_role_id']
STUDENT_ROLE_ID = config.data['student_role_id']
```

### Insert Student Verification Requests
```python
supabase.table('students').insert({
    'discord_id': str(user.id),
    'email': email,
    'h_number': h_number,
    'verified': False,
    'submitted_at': datetime.now().isoformat()
}).execute()
```

### Poll for Approved Students
```python
# Check for newly approved students
approved = supabase.table('students').select('*').eq('verified', True).is_('verified_at', 'not.null').execute()

for student in approved.data:
    member = guild.get_member(int(student['discord_id']))
    if member:
        await member.add_roles(student_role)
```

## Notes

- Currently configured for **testing** (open access)
- Channel/role dropdowns use **mock data** - integrate Discord API for real data
- Replace `"admin"` placeholders with actual admin IDs from authentication
- Add Discord OAuth2 for production admin-only access
- Consider implementing rate limiting
- For production, restrict RLS policies to authenticated admins
