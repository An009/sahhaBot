const CACHE_NAME = 'sahhabot-v1';
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/offline');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline symptom submissions
  const offlineData = await getOfflineData();
  if (offlineData.length > 0) {
    for (const item of offlineData) {
      try {
        await syncToServer(item);
        await removeFromOfflineStorage(item.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}

async function getOfflineData() {
  // Implementation would retrieve from IndexedDB
  return [];
}

async function syncToServer(data) {
  // Implementation would sync to Supabase
  return fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function removeFromOfflineStorage(id) {
  // Implementation would remove from IndexedDB
  return true;
}