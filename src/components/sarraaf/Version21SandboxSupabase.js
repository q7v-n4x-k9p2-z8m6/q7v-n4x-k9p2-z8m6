// Dedicated Supabase client for the isolated sandbox login.
// It intentionally does not read or attach the production app's auth_token.
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/lib/supabaseConfig';

const config = getSupabaseConfig();

export const sandboxSupabase = createClient(config.url, config.key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
