"use client";

import { createClient } from "./client";

const origin = () => (typeof window !== "undefined" ? window.location.origin : "");
function sb() {
  const c = createClient();
  if (!c) throw new Error("Supabase não configurado");
  return c;
}

export async function signUpEmail(p: { name: string; companyName: string; email: string; password: string }) {
  return sb().auth.signUp({
    email: p.email,
    password: p.password,
    options: { data: { name: p.name, company_name: p.companyName }, emailRedirectTo: `${origin()}/auth/callback` },
  });
}

export async function signInEmail(email: string, password: string) {
  return sb().auth.signInWithPassword({ email, password });
}

export async function signInGoogle() {
  return sb().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin()}/auth/callback` } });
}

export async function sendPhoneOtp(phone: string) {
  return sb().auth.signInWithOtp({ phone });
}

export async function verifyPhoneOtp(phone: string, token: string) {
  return sb().auth.verifyOtp({ phone, token, type: "sms" });
}

export async function resetPasswordEmail(email: string) {
  return sb().auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/auth/callback?next=/app/config` });
}

export async function signOutSupabase() {
  const c = createClient();
  if (c) await c.auth.signOut();
}
