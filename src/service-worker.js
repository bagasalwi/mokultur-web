/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

/**
 * Deliberately narrow: static assets only.
 *
 * This is a news site. A service worker that serves cached HTML would hand
 * readers yesterday's headlines and, worse, could pin a signed-in page for the
 * next person on the device — /dashboard is per-user and sent as
 * `private, no-store`. So navigations and API calls are never touched here;
 * they go to the network exactly as they would without a service worker.
 *
 * What is cached is the part that is safe to cache and expensive to refetch:
 * the hashed build output, fonts, and icons. Those buy an instant second load
 * without any staleness risk, because their URLs change whenever the contents
 * do.
 */

const CACHE = `static-${version}`;

/** Fonts and icons are large, immutable and on every page. */
const STATIC_ASSETS = files.filter(
  (f) => f.startsWith('/fonts/') || f.startsWith('/icons/') || f.startsWith('/assets/'),
);

// `build` is content-hashed, so an entry can only ever be the file it names.
const PRECACHE = [...build, ...STATIC_ASSETS];
const PRECACHE_SET = new Set(PRECACHE);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // Taking over immediately is safe here: nothing served from this cache
      // can conflict with a page rendered by the previous version, because
      // every cached URL is content-hashed or version-scoped.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only. api.mokultur.com and anything else stays untouched.
  if (url.origin !== self.location.origin) return;

  // Navigations always hit the network. This is what keeps headlines fresh and
  // keeps one reader's dashboard from being served to another.
  if (request.mode === 'navigate') return;

  if (!PRECACHE_SET.has(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(url.pathname);
      if (cached) return cached;

      // Missing from the cache (evicted, or a failed install): fetch it and
      // top the cache back up, but never fail the request because of caching.
      const response = await fetch(request);
      if (response.ok) cache.put(url.pathname, response.clone());
      return response;
    }),
  );
});

/**
 * Lets the page trigger an update without a full reload, used by the
 * "version baru tersedia" prompt.
 */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
