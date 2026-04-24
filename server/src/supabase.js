import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

/**
 * Cliente Supabase do backend — usa service role, portanto bypassa RLS.
 * É utilizado para gravar em `notification_log`, ler `contracts` internamente
 * e consultar `client_opt_outs` / `corbans`.
 */
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
