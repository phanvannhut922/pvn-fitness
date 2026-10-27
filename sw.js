// Chế độ offline: lưu app + thư viện CDN + font sau lần mở đầu tiên có mạng.
// Mỗi lần sửa index.html / icon, hãy tăng số phiên bản bên dưới (v2 -> v3 ...) để máy người dùng nhận bản mới.
const CACHE = 'pvn-fitness-v2';
const CDN_HOSTS = ['cdn.tailwindcss.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo-pvn-fitness.png'];

self.addEventListener('install', e => {
  // Thiếu một file không làm hỏng cả bộ cache.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ok = url.origin === location.origin || CDN_HOSTS.includes(url.hostname);
  if (!ok) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: false }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return hit || net;
    })
  );
});
