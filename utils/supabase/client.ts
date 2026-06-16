import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.warn("Supabase environment variables are missing. Using mock client.");
    }
    return new Proxy({} as any, {
      get(target, prop) {
        if (prop === 'from') {
          return () => ({
            select: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null })
              }),
            }),
          });
        }
        if (prop === 'auth') {
          return {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: null } }),
          };
        }
        return () => Promise.resolve({ data: null, error: null });
      }
    });
  }

  return createBrowserClient(url, key);
}
