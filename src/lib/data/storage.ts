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

// Recomprime uma imagem que JÁ está em base64 (data URL), encolhendo no lugar.
// Usado para liberar espaço de fotos antigas grandes guardadas no aparelho.
export async function recompressDataUrl(dataUrl: string, maxDim = 1600, quality = 0.72): Promise<string> {
  if (typeof document === "undefined" || !dataUrl.startsWith("data:image")) return dataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = dataUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", quality);
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

// Sobe um arquivo para o Supabase Storage e retorna a URL pública.
// Fotos do RDO: SEMPRE retornam base64 comprimido — assim carregam no app e
// embutem no PDF de forma 100% confiável, sem depender de bucket público/CORS.
// O base64 é leve (≤ ~1600px) e viaja junto do RDO (sincroniza pelo banco).
// Documentos (PDF, etc.) continuam indo para o Storage quando disponível.
export async function uploadFile(
  bucket: "rdo-media" | "documents",
  file: File,
  companyId: string,
): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const prepared = isImage ? await compressImage(file) : file;

  // Fotos -> base64 garantido (carrega no app e no PDF sempre).
  if (isImage) return fileToDataUrl(prepared);

  // Documentos -> Storage quando configurado; senão, base64.
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
