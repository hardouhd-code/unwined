const CACHE = "unwined-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/icon-72x72.png",
  "/icon-96x96.png",
  "/icon-128x128.png",
  "/icon-144x144.png",
  "/icon-152x152.png",
  "/icon-192x192.png",
  "/icon-384x384.png",
  "/icon-512x512.png",
  "/icon-512x512-maskable.png",
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap",
];

// Install — cache all assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(ASSETS.map(url => cache.add(url).catch(()=>{})));
    }).then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first for assets, network first for API
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Never cache Supabase or Claude API calls
  if(url.hostname.includes("supabase.co") || url.pathname.startsWith("/api/")) {
    return; // pass through to network
  }

  // Cache first for everything else (fonts, icons, app shell)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        // Cache successful GET responses
        if(e.request.method === "GET" && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback — return cached index.html for navigation
        if(e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
