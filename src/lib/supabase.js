import { createClient } from '@supabase/supabase-js';

let supabaseAdminInstance = null;
let supabaseAnonInstance = null;

/**
 * Returns a Supabase client with Service Role privileges.
 * STRICTLY for server-side administrative operations (e.g., admin storage uploads).
 * NEVER expose this to client components or public endpoints.
 */
export function getSupabaseAdmin() {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Supabase Admin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.');
    }
    // Prevent crashes during static analysis/build time
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceKey || 'placeholder-service-key',
      { auth: { persistSession: false } }
    );
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return supabaseAdminInstance;
}

/**
 * Returns a Supabase client with Anonymous / Public privileges.
 * Strictly respects all Supabase Row-Level Security (RLS) policies.
 */
export function getSupabase() {
  if (supabaseAnonInstance) return supabaseAnonInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Supabase Public] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    // Prevent crashes during static analysis/build time
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key',
      { auth: { persistSession: false } }
    );
  }

  supabaseAnonInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  return supabaseAnonInstance;
}

