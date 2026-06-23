// Auth middleware disabled — running in local-first mode without Supabase
// To enable Supabase auth, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
export function middleware() {}
export const config = { matcher: [] }
