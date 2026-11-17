/* Drive Uyee — app-shell + image cache.
   Only the UI shell and the two image tiers are cached. API JSON, uploads and
   downloads always go to the network so a stale file list can never hide a
   newly synced file. */
// Version must change whenever the shell changes. The previous version pinned
// app.js and nexus.css forever, so a redeploy was invisible to returning users.
const VERSION = 'drive-uyee-v2';
// Only navigation shell and favicon live here. JS/CSS already carry a versioned
// query string and are cached by the browser as immutable — caching them here
// a second time only makes new deployments invisible.
const SHELL = ['/', '/index.html', '/favicon.svg'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (/^\/api\/(thumb|medium)\//.test(url.pathname)) {
    event.respondWith(
      caches.open(VERSION).then(function (cache) {
        return cache.match(req).then(function (hit) {
          const network = fetch(req).then(function (res) {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(function () { return hit; });
          return hit || network;
        });
      })
    );
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(VERSION).then(function (cache) { cache.put('/index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('/index.html');
      })
    );
  }
});
