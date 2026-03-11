/* ═══════════════════════════════════════════════════════════════
   UNWINE-D — SERVICE WORKER (PWA)
   Gestion du cache pour le mode Offline (Caves sans réseau)
═══════════════════════════════════════════════════════════════ */

const CACHE = "unwined-v2";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/icons/icon-512x512-maskable.png",
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap",
];

// ── INSTALLATION ──
// Mise en cache des assets critiques (fonts, icônes, app shell)
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      // Promise.allSettled évite qu'une seule erreur 404 sur une icône ne bloque tout le SW
      return Promise.allSettled(
        ASSETS.map((url) => cache.add(url).catch(() => console.log(`Failed to cache: ${url}`)))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATION ──
// Nettoyage des anciennes versions du cache
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH (STRATÉGIE MIXTE) ──
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Sécurité : Ne jamais mettre en cache les appels API (Supabase / Claude / Vivino)
  if (url.hostname.includes("supabase.co") || url.pathname.startsWith("/api/")) {
    return; 
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // 1. Retourne l'asset si présent dans le cache (Cache-First)
      if (cached) return cached;

      // 2. Sinon, tente le réseau
      return fetch(e.request).then((res) => {
        // Cache les fichiers statiques récupérés au vol (GET uniquement)
        if (e.request.method === "GET" && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // 3. Fallback Offline : si on navigue et qu'il n'y a pas de réseau, renvoie l'index.html
        if (e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
