// ============================================================
//  REWIND LUXURY PLACE — Supabase Configuration
//  Replace the two values below with your own project credentials
//  Found in: Supabase Dashboard → Project Settings → API
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';   // ← replace
const SUPABASE_KEY  = 'YOUR_ANON_PUBLIC_KEY';                   // ← replace

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
