// Service worker: guarda la app en el iPad para que funcione sin internet.
// Si actualizas algún archivo, cambia el número de versión para que el iPad descargue la nueva.
const VERSION = "pv-v2";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", evento => {
  evento.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(c => c !== VERSION).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Primero responde con la copia guardada (rápido y sin internet) y,
// si hay conexión, actualiza la copia en segundo plano.
self.addEventListener("fetch", evento => {
  const solicitud = evento.request;
  if (solicitud.method !== "GET" || new URL(solicitud.url).origin !== self.location.origin) return;
  evento.respondWith(
    caches.open(VERSION).then(async cache => {
      const guardada = await cache.match(solicitud, { ignoreSearch: true });
      const deRed = fetch(solicitud)
        .then(respuesta => {
          if (respuesta && respuesta.ok) cache.put(solicitud, respuesta.clone());
          return respuesta;
        })
        .catch(() => guardada || cache.match("./index.html"));
      return guardada || deRed;
    })
  );
});
