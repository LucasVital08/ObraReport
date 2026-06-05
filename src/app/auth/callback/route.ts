import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Callback de login (OAuth Google e confirmação de e-mail): troca o código
// pela sessão e redireciona para o app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app";

  if (code) {
    const supabase = await createServerSupabase();
    if (supabase) await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
