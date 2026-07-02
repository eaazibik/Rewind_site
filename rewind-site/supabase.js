// ============================================================
//  REWIND LUXURY PLACE — Supabase Configuration
//  Replace the two values below with your own project credentials
//  Found in: Supabase Dashboard → Project Settings → API
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Reads config from window.__ENV (generated during build) or falls back to placeholders.
const env = (typeof window !== 'undefined' && window.__ENV) ? window.__ENV : {
  SUPABASE_URL: 'https://tfturoppawtgkjxpjzan.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdHVyb3BwYXd0Z2tqeHBqemFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMDc3MjAsImV4cCI6MjA5ODU4MzcyMH0.27A4LfO_DRLE_u-Sh0TqfAlXGJj_i_8lGNurc13GYOA'
};

const SUPABASE_URL  = env.SUPABASE_URL;
const SUPABASE_KEY  = env.SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

