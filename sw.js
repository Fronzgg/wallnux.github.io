// Service Worker для PWA
const CACHE_NAME = 'wallnux-v2'; // Увеличили версию!
const DEV_MODE = true; // РЕЖИМ РАЗРАБОТКИ - отключает кэш

const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/styles.css',
  '/auth.css',
  '/badges.css',
  '/notifications.css',
  '/ban-system.css',
  '/telegram-search.css',
  '/script.js',
  '/auth.js',
  '/modern-features.js',
  '/badges.js',
  '/notifications.js',
  '/admin-features.js',
  '/ban-system.js',
  '/telegram-search.js',
  '/p2p-adapter.js',
  '/p2p-manager.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  // Пропустить ожидание и сразу активироваться
  self.skipWaiting();
  
  if (DEV_MODE) {
    console.log('⚠️ DEV MODE: Кэширование отключено');
    event.waitUntil(Promise.resolve());
  } else {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('✅ Cache opened');
          return cache.addAll(urlsToCache);
        })
    );
  }
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activated');
  
  // Сразу взять контроль над всеми клиентами
  event.waitUntil(
    clients.claim().then(() => {
      // Удалить все старые кэши
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', event => {
  // В режиме разработки - всегда загружать из сети
  if (DEV_MODE) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Добавляем заголовки для отключения кэша
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        })
        .catch(error => {
          console.error('❌ Fetch error:', error);
          return new Response('Network error', { status: 503 });
        })
    );
    return;
  }
  
  // В продакшене - использовать кэш
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
});

// Push уведомления
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Новое сообщение',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('WallNux Messenger', options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
