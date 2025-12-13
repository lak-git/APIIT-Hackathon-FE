import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let workerClient: SupabaseClient | null = null;

export const getWorkerSupabaseClient = () => {
  if (workerClient) {
    return workerClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  workerClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return workerClient;
};
