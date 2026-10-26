// Bodatic 서비스 워커: 인터넷이 없어도 앱 화면이 열리게 해줘요.
// 항상 최신 파일을 먼저 받아오고, 실패할 때만 저장해 둔 사본을 써요.
const CACHE = "bodatic-v1";
const CACHEABLE = url =>
  url.origin === self.location.origin ||
  url.hostname === "www.gstatic.com" ||
  url.hostname === "fonts.googleapis.com" ||
  url.hostname === "fonts.gstatic.com";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "index.html", "manifest.webmanifest", "icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!CACHEABLE(url)) return; // Firebase 데이터 요청은 건드리지 않아요
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
