// OneSignal push handler — must be first
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// PWA cache
const CACHE = 'streak-v5';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './STREAK logo v4.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
