import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Supabase environment variables are missing in server context. Using mock client.");
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
          };
        }
        return () => Promise.resolve({ data: null, error: null });
      }
    });
  }

  const cookieStore = await cookies()

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore for Server Components
          }
        },
      },
    }
  )
}
