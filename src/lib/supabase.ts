import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Single Supabase client helper for use in the app (client components, API routes, server actions).
 * For server-side with cookies (auth), use the server client from lib/supabase/server.ts instead.
 */
export function getSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}
