import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials are not fully configured in environment variables.');
  }

  // Provide a dummy URL during build time to prevent crashes if env vars are missing
  const client = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
    { auth: { persistSession: false } }
  );

  // Only cache singleton when real credentials are present to avoid
  // permanently storing a non-functional placeholder client
  if (supabaseUrl && supabaseKey) {
    supabaseInstance = client;
  }

  return client;
}
