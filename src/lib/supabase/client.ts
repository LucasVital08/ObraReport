"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseEnabled } from "./config";

// Cliente Supabase do navegador. Retorna null quando não configurado, para o
// app manter o modo local/demo sem quebrar.
export function createClient() {
  if (!isSupabaseEnabled) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
