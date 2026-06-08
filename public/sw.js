// Service worker do ObraReport IA (PWA instalável + offline).
// Estratégia conservadora:
//  - Estáticos do Next (/_next/static, ícones): cache-first (imutáveis).
//  - Navegação (HTML): network-first com fallback ao cache (app abre offline).
//  - API, auth e Supabase: sempre rede (nunca cacheia dados/sessão).
// Os dados do usuário ficam no localStorage (Zustand) e sincronizam pela outbox.

const CACHE = "obrareport-v1";
const APP_SHELL = ["/app", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {}).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return url.pathname.startsWith("/_next/static") || url.pathname === "/icon.svg" || url.pathname.endsWith(".svg");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Nunca interceptar API, auth ou outras origens (ex.: Supabase).
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;

  // Estáticos imutáveis: cache-first.
  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        }),
      ),
    );
    return;
  }

  // Navegação (HTML): network-first, cai no cache quando offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/app"))),
    );
  }
});
