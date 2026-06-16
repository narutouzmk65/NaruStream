import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Public keys safe to hardcode (NEXT_PUBLIC_ = client-side, sb_publishable_ = public anon key)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nnbtjobtewlubohtwilf.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OfYRH-g3ntbk8YloP5MTdg_pNXWzReCQ'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
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
