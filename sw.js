const cacheName = "metrotime-web-v20";
const baseUrl = self.registration.scope;
const assets = [
  "", "index.html", "styles.css", "app.js", "auth.js", "shifts.js", "firebase-config.js", "manifest.json",
  "assets/metrotime-mark.svg",
  "assets/avatars/avatar_driver_m.png",
  "assets/avatars/avatar_driver_f.png",
  "assets/avatars/avatar_tcm.png",
  "assets/avatars/avatar_dde.png",
  "assets/avatars/avatar_sec_m.png",
  "assets/avatars/avatar_sec_f.png",
  "assets/avatars/avatar_station_m.png",
  "assets/avatars/avatar_station_f.png",
].map((path) => new URL(path, baseUrl).toString());

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
