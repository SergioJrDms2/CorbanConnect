import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

/**
 * Allow mock data fallback. Only true when explicitly enabled via env flag.
 * Never true by default — production must fail loudly if Supabase is missing.
 */
export const allowMock: boolean =
  import.meta.env.DEV && import.meta.env.VITE_ALLOW_MOCK === '1';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    this.name = 'SupabaseNotConfiguredError';
  }
}
