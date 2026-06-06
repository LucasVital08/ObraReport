"use client";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { uid } from "@/lib/utils";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Sobe um arquivo para o Supabase Storage e retorna a URL pública.
// Em modo local/demo (sem Supabase ou sem empresa), retorna um data URL base64
// — mantendo o comportamento atual e o app funcionando offline.
export async function uploadFile(
  bucket: "rdo-media" | "documents",
  file: File,
  companyId: string,
): Promise<string> {
  const sb = isSupabaseEnabled ? createClient() : null;
  if (!sb || !companyId) return fileToDataUrl(file);

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId}/${uid()}-${safe}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) {
    console.error("[storage upload]", bucket, error.message);
    return fileToDataUrl(file); // fallback: não perde o arquivo
  }
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
