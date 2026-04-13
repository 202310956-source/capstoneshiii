import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

if (!supabaseEnabled) {
  console.warn(
    "Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
  );
}

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
