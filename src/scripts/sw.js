import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { openDB } from 'idb';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev' && url.pathname.startsWith('/images/stories/'),
  new CacheFirst({
    cacheName: 'story-images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.origin.endsWith('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

self.addEventListener('push', (event) => {
  console.log('Service worker: Push notification diterima!');
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Notifikasi Baru',
      options: { body: 'Ada pesan baru untuk Anda.' },
    };
  }

  const title = data.title;
  const options = {
    body: data.options.body,
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    data: { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});

const DATABASE_NAME = 'story-app-database';
const OBJECT_STORE_OUTBOX_NAME = 'outbox_stories';

function openOutboxDB() {
  return openDB(DATABASE_NAME, 2);
}

async function uploadStoryFromOutbox(story) {
  const formData = new FormData();
  formData.append('description', story.description);
  formData.append('photo', story.photo);
  formData.append('lat', story.lat);
  formData.append('lon', story.lon);

  const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${story.token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload gagal');
  }
  
  return response.json();
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-stories') {
    console.log('Service Worker: Menjalankan background sync untuk "sync-new-stories"');
    event.waitUntil(
      openOutboxDB().then(async (db) => {
        const stories = await db.getAll(OBJECT_STORE_OUTBOX_NAME);
        const uploadPromises = stories.map(async (story) => {
          try {
            await uploadStoryFromOutbox(story);
            await db.delete(OBJECT_STORE_OUTBOX_NAME, story.id);
            console.log('SW Sync: Berhasil upload 1 cerita dari outbox');
          } catch (error) {
            console.error('SW Sync: Gagal upload 1 cerita:', error, story);
          }
        });
        await Promise.all(uploadPromises);
      })
    );
  }
});
