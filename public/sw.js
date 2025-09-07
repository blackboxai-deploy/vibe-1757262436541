const CACHE_NAME = 'alarm-app-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install service worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Background sync for alarm functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'alarm-sync') {
    event.waitUntil(handleAlarmSync());
  }
});

// Handle alarm notifications in background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_ALARM') {
    showAlarmNotification();
  }
});

function handleAlarmSync() {
  return self.registration.showNotification('20-Minute Alarm', {
    body: 'Your 20-minute interval is up!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'alarm-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  });
}

function showAlarmNotification() {
  return self.registration.showNotification('20-Minute Alarm', {
    body: 'Time for your next break or task!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [500, 200, 500, 200, 500],
    tag: 'alarm-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'dismiss',
        title: 'OK'
      },
      {
        action: 'stop',
        title: 'Stop Alarm'
      }
    ]
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'stop') {
    // Send message to client to stop alarm
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'STOP_ALARM' });
        });
      })
    );
  }
  
  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({
      type: 'window'
    }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});