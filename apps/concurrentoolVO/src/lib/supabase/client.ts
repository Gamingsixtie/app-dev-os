import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isTest = import.meta.env.MODE === 'test' || typeof process !== 'undefined' && process.env?.['VITEST'];

if (!supabaseUrl || !supabaseAnonKey) {
  if (!isTest) {
    throw new Error('VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY zijn vereist in .env.local');
  }
}

export const supabase = createClient<Database>(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'test-anon-key',
  {
    auth: {
      storageKey: 'sb-toolvo-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
