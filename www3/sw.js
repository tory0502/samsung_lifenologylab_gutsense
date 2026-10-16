// GutSense Service Worker ???�프?�인 캐싱 + PWA ?�치 가??// ?�략: network-first (버전 쿼리 ?v=N 존재 ????�� 최신 ???�빙, ?�패 ??캐시 ?�백)
var CACHE = 'gutsense-v37';
var ASSETS = [
  './', './index.html',
  'vendor/three.min.js', 'vendor/gsap.min.js', 'vendor/confetti.min.js',
  'config.js',
  'js/data.js', 'js/gutmetrics.js', 'js/medical.js', 'js/chars.js', 'js/store.js', 'js/engine.js',
  'js/fx.js', 'js/effects.js', 'js/ui.js', 'js/llm.js', 'js/drjang.js',
  'js/story.js', 'js/sim.js', 'js/nav.js',
  'js/screens/login.js', 'js/screens/home.js', 'js/screens/gutmap.js',
  'js/screens/diet.js', 'js/screens/endoscope.js', 'js/screens/quest.js',
  'js/screens/alert.js', 'js/screens/profile.js', 'js/screens/secretlab.js',
  'assets/img/icon-192.png', 'assets/img/icon-512.png',
  'manifest.json'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(ASSETS).catch(function () {});
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 영상(.mp4)은 캐시 우선 — 반복 재생 시 네트워크 재다운로드로 인한 버퍼링/끊김 방지
  if (/\.mp4$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function () {}); });
          }
          return res;
        });
      })
    );
    return;
  }
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function () {}); });
      return res;
    }).catch(function () {
      return caches.match(req);
    })
  );
});
