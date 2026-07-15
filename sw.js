// ============================================================
// sw.js - Akino Store Service Worker
// ============================================================

// 🔥 VERSI - Ganti angka ini setiap kali update
const APP_VERSION = 'v4.1';
const CACHE_NAME = `akino-store-${APP_VERSION}`;

// 🔥 File yang di-cache (strategi Cache First)
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manga.html',
  '/browse.html',
  '/detail.html',
  '/reader.html',
  '/profile.html',
  '/login.html',
  '/about.html',
  '/privacy.html',
  '/terms.html',
  '/CarParkingMultiplayer.html',
  '/SosialMedia.html',
  '/designedit.html',
  '/stockmobil.html',
  '/admin.html',
  '/manifest.json',
  '/firebase-init.js'
];

// ============================================================
// INSTALL - Cache semua file statis
// ============================================================
self.addEventListener('install', event => {
  console.log('🔄 SW Install:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Caching static files...');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        // Skip waiting agar langsung aktif
        return self.skipWaiting();
      })
  );
});

// ============================================================
// ACTIVATE - Hapus cache lama & claim clients
// ============================================================
self.addEventListener('activate', event => {
  console.log('🔄 SW Activate:', APP_VERSION);
  event.waitUntil(
    Promise.all([
      // Hapus cache lama
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME && cache.startsWith('akino-store-')) {
              console.log('🗑️ Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      }),
      // Langsung kontrol semua tab
      self.clients.claim()
    ])
  );
});

// ============================================================
// FETCH - Strategi Cerdas (Cache + Network)
// ============================================================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 🔥 LEWATI: file yang TIDAK perlu di-cache (API, gambar, dll)
  if (url.pathname.includes('/proxy-image') ||
      url.pathname.includes('firestore') ||
      url.pathname.includes('firebase') ||
      url.pathname.includes('cloudinary') ||
      url.pathname.includes('turnstile') ||
      url.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|webp|mp4|webm)$/i)) {
    event.respondWith(fetch(request));
    return;
  }

  // 🔥 STRATEGI: Cache First dengan Fallback Network
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Jika ada di cache, kembalikan (cepat!)
        if (cachedResponse) {
          // 🔥 REVALIDASI: update cache di background (stale-while-revalidate)
          fetch(request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(request, networkResponse);
                  });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Jika tidak ada di cache, ambil dari network
        return fetch(request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            // Cache response untuk下次
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });
            return networkResponse;
          })
          .catch(() => {
            // Jika network gagal, coba fallback ke halaman utama
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// ============================================================
// MESSAGE HANDLER - Terima pesan dari client
// ============================================================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  // 🔥 Force refresh semua client jika ada update
  if (event.data === 'refreshAll') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage('reload');
      });
    });
  }
});

// ============================================================
// 🔥 PUSH NOTIFICATION (Opsional)
// ============================================================
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'Ada update baru!',
    icon: 'https://res.cloudinary.com/d39mdjct/image/upload/v1783493763/apk_pgxcmo.png',
    badge: 'https://res.cloudinary.com/d39mdjct/image/upload/v1783493763/apk_pgxcmo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Akino Store', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
