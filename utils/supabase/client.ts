import { createBrowserClient } from '@supabase/ssr'

// Public keys safe to hardcode (NEXT_PUBLIC_ = client-side, sb_publishable_ = public anon key)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nnbtjobtewlubohtwilf.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OfYRH-g3ntbk8YloP5MTdg_pNXWzReCQ'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
