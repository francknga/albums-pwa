const CACHE_NAME = 'music-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie de cache: Network First pour les fichiers audio, Cache First pour le reste
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Pour les fichiers audio d'Archive.org, toujours essayer le réseau en premier
  if (url.hostname.includes('archive.org')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone la réponse car elle ne peut être utilisée qu'une fois
          const responseClone = response.clone();
          
          // Met en cache la réponse pour une utilisation offline
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
          // Si le réseau échoue, essaie de récupérer depuis le cache
          return caches.match(request);
        })
    );
  } else {
    // Pour les autres fichiers, utilise Cache First
    event.respondWith(
      caches.match(request)
        .then(response => {
          // Retourne depuis le cache si disponible
          if (response) {
            return response;
          }
          
          // Sinon, récupère depuis le réseau
          return fetch(request).then(response => {
            // Vérifie si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone et met en cache
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
            
            return response;
          });
        })
    );
  }
});

// Gestion des messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
