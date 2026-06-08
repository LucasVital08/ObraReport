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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

const renameJpg = (name: string) => name.replace(/\.[^.]+$/, "") + ".jpg";

// Reduz e recodifica a foto (canvas → JPEG). Uma foto de celular de vários MB
// vira ~200KB: evita estourar o localStorage e acelera o upload. Também converte
// o HEIC do iPhone para JPEG (compatível em todo lugar). Em falha, mantém o original.
async function compressImage(file: File, maxDim = 1600, quality = 0.72): Promise<File> {
  if (typeof document === "undefined" || !file.type.startsWith("image/")) return file;
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], renameJpg(file.name), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Sobe um arquivo para o Supabase Storage e retorna a URL pública.
// Imagens são comprimidas antes (Storage ou base64). Em modo local/demo (sem
// Supabase ou sem empresa), retorna um data URL base64 — app funciona offline.
export async function uploadFile(
  bucket: "rdo-media" | "documents",
  file: File,
  companyId: string,
): Promise<string> {
  const prepared = file.type.startsWith("image/") ? await compressImage(file) : file;

  const sb = isSupabaseEnabled ? createClient() : null;
  if (!sb || !companyId) return fileToDataUrl(prepared);

  const safe = prepared.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId}/${uid()}-${safe}`;
  const { error } = await sb.storage.from(bucket).upload(path, prepared, {
    upsert: true,
    contentType: prepared.type || undefined,
  });
  if (error) {
    console.error("[storage upload]", bucket, error.message);
    return fileToDataUrl(prepared); // fallback: não perde o arquivo
  }
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
