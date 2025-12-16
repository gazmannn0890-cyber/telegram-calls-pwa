const CACHE_NAME = 'telegram-calls-pro-v1.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('⚡ Установка Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Кэширование ресурсов...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Ресурсы закэшированы');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Активация Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Удаление старого кэша: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker активирован');
      return self.clients.claim();
    })
  );
});

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
  // Пропускаем неподдерживаемые схемы
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Возвращаем кэшированный ответ, если есть
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Иначе загружаем из сети
        return fetch(event.request)
          .then((networkResponse) => {
            // Кэшируем успешные ответы
            if (networkResponse.ok && event.request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // Офлайн режим: для API возвращаем JSON
            if (event.request.url.includes('/api/')) {
              return new Response(
                JSON.stringify({ 
                  error: 'Нет подключения к интернету',
                  offline: true 
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
            
            // Для страниц возвращаем офлайн страницу
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            return new Response('Нет подключения к интернету', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Обработка push уведомлений
self.addEventListener('push', (event) => {
  console.log('📨 Push уведомление получено:', event);
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Новое уведомление',
    icon: 'assets/icons/icon-192.png',
    badge: 'assets/icons/badge-96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Telegram Calls Pro', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Клик по уведомлению:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Ищем открытое окно
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Если окно не найдено, открываем новое
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url || '/');
          }
        })
    );
  }
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  console.log('🔄 Фоновая синхронизация:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Здесь будет синхронизация сообщений
  console.log('Синхронизация сообщений...');
}

// Периодическая фоновая синхронизация
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-contacts') {
    event.waitUntil(updateContacts());
  }
});

async function updateContacts() {
  // Здесь будет обновление контактов
  console.log('Обновление контактов...');
}

// Получение сообщений
self.addEventListener('message', (event) => {
  console.log('📨 Сообщение от клиента:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
