// sw.js - Service Worker
const CACHE_NAME = 'ma3daly-v1';
const APP_VERSION = '1.0.0';

// الملفات التي سيتم تخزينها عند التثبيت
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] تثبيت');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] تخزين الملفات في الكاش');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] تخطي الانتظار');
        return self.skipWaiting();
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] تفعيل');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا كان الملف مخزناً، أرجه
        if (response) {
          return response;
        }

        // إذا لم يكن، جلب من الشبكة
        return fetch(event.request)
          .then(response => {
            // إذا فشل الاتصال، نرمي خطأ
            if (!response || response.status !== 200) {
              return response;
            }

            // نسخ الرد للتخزين في الكاش
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // إذا فشل الاتصال، حاول إرجاع الصفحة الرئيسية للطلبات الملاحية
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('عذرًا، أنت غير متصل بالإنترنت');
          });
      })
  );
});