import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Student = {
  discord_id: string;
  email: string;
  h_number: string;
  verified: boolean;
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
};

export type BotConfig = {
  guild_id: string;
  verify_channel_id?: string;
  verifier_role_id?: string;
  student_role_id?: string;
  updated_at?: string;
};
