import { createClient } from "./client";

/**
 * Use this in Server Components / Route Handlers for Supabase queries.
 * For client-side (e.g. search from browser), use createClient from ./client.
 */
export async function getSupabaseClient() {
  return createClient();
}
