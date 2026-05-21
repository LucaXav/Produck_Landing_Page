/**
 * Supabase client + signup helper.
 *
 * The browser uses the publishable (anon) key. Row Level Security on the
 * `signups` table allows INSERT only — visitors can submit their email but
 * can't read, edit, or delete anything. The list is only visible from the
 * Supabase dashboard (logged in as the project owner).
 */

import { createClient } from '@supabase/supabase-js';

const url     = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — signups will not be saved.');
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Insert a signup. Treats duplicate-email errors as success (a returning
 * visitor who tries to sign up again still sees the friendly "you're on
 * the list" UI rather than a scary error).
 *
 * Returns: { ok: true, duplicate: boolean }
 * Throws:  on network failure or any non-duplicate Postgres error.
 */
export async function saveSignup(email) {
  const payload = {
    email,
    source:     'landing',
    referrer:   document.referrer || null,
    user_agent: navigator.userAgent,
  };
  const { error } = await supabase.from('signups').insert(payload);
  if (error) {
    // 23505 = Postgres unique_violation
    if (error.code === '23505' || /duplicate key/i.test(error.message)) {
      return { ok: true, duplicate: true };
    }
    throw error;
  }
  return { ok: true, duplicate: false };
}
