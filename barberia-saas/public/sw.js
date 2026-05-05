// Service Worker mínimo para PWA installability en Chrome Android
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
// Fetch handler requerido por Chrome para habilitar el prompt de instalación
self.addEventListener('fetch', () => {})
