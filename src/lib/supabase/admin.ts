import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Cliente Supabase com a chave service_role — ignora RLS. USO EXCLUSIVO no
// servidor (webhooks, tarefas administrativas). Nunca importar no cliente.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const isAdminEnabled = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

export function createAdminClient() {
  if (!isAdminEnabled) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
