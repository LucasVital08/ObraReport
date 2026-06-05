// Configuração central do Supabase. Se as variáveis não estiverem definidas,
// o app continua funcionando em modo local/demo (isSupabaseEnabled = false).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
