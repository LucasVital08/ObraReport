import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseEnabled } from "./config";

// Cliente Supabase no servidor (Server Components / Route Handlers), com sessão
// via cookies. Retorna null quando não configurado.
export async function createServerSupabase() {
  if (!isSupabaseEnabled) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // chamado de um Server Component — ignora (o middleware renova a sessão).
        }
      },
    },
  });
}
