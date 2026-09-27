const CACHE_NAME = 'chat-gde-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.jpg',
  '/icon-512.jpg'
];

// Instalar Service Worker y precachear recursos estáticos principales
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker Chat GDE...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar y limpiar cachés obsoletas
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Fetch: Network-First con fallback a Caché (Ideal para chat y zonas sin cobertura Wi-Fi temporal en el CD)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar requests a las APIs y WebSockets para no interferir con la comunicación en tiempo real
  if (request.url.includes('/api/') || request.url.includes('/socket.io/')) {
    return;
  }

  // Ignorar peticiones no GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clonar respuesta válida en caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay red (zona muerta de Wi-Fi en bodega), responder desde la caché
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Notificaciones Push en segundo plano (Zebra TC22)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Chat GDE - Nuevo Mensaje';
    const options = {
      body: data.body || 'Has recibido un nuevo mensaje en el centro de distribución',
      icon: '/icon-192.jpg',
      badge: '/icon-192.jpg',
      vibrate: [200, 100, 200], // Patrón de vibración especial para la Zebra TC22
      data: {
        url: data.url || '/'
      },
      tag: 'chat-gde-message',
      renotify: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Error procesando notificación push:', err);
  }
});

// Clic en notificación push -> abrir o enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la ventana ya está abierta, enfocarla
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
