import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/env';

export function createClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';

  return createBrowserClient(url, anonKey);
}
