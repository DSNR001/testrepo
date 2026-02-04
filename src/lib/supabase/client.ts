import { getSupabase } from "@/lib/supabase";

/** @deprecated Use getSupabase() from '@/lib/supabase' instead. */
export function createClient() {
  return getSupabase();
}
