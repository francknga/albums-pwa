self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('pwa-albums-v1').then((cache) => cache.addAll(['/','/index.html','/manifest.json']))
  );
});

self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if(url.pathname.endsWith('.mp3') || url.pathname.endsWith('.m4a') || url.pathname.endsWith('.flac') || url.pathname.endsWith('.ogg')){
    // network-first for audio
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(resp=>resp || fetch(event.request)));
});
