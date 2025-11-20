// Service Worker для PWA
const CACHE_NAME = 'wallnux-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кэша если есть
        if (response) {
          return response;
        }
        
        // Иначе загружаем из сети
        return fetch(event.request).then(response => {
          // Проверяем что ответ валидный
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Клонируем ответ
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
