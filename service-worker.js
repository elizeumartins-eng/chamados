const CACHE_VERSION = "eng-elizeu-v15";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// =========================
// INSTALL (sem cache pesado)
// =========================
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// =========================
// ACTIVATE (limpa tudo antigo)
// =========================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// =========================
// FETCH (sem cache para sistema)
// =========================
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ❌ nunca cacheia APIs / serviços
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("firestore") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("onesignal") ||
    url.hostname.includes("supabase")
  ) {
    event.respondWith(fetch(req));
    return;
  }

  // 🔥 HTML / JS / CSS → sempre da rede
  if (
    req.destination === "document" ||
    req.destination === "script" ||
    req.destination === "style"
  ) {
    event.respondWith(fetch(req));
    return;
  }

  // 🔥 imagens (opcional cache leve)
  if (req.destination === "image") {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
            return res;
          })
        );
      })
    );
    return;
  }

  // fallback
  event.respondWith(fetch(req));
});