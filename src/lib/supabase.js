import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials are not fully configured in environment variables.');
  }

  // Provide a dummy URL during build time to prevent crashes if env vars are missing
  return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
}
