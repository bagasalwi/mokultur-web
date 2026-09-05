import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listEvents } from '$lib/api';

export const load: PageServerLoad = async ({ setHeaders, parent }) => {
  // Disabled features are gone, not merely hidden: the route 404s.
  const { settings } = await parent();
  if (settings?.event_enabled === false) throw error(404, 'Event tidak tersedia.');

  /**
   * Not cached anywhere, unlike the talent pages this was modelled on.
   *
   * A schedule is edited and then checked immediately. Every caching layer in
   * front of this page defeated that: the browser held its own copy for five
   * minutes, and nginx's proxy_cache kept serving a HIT of the old HTML for as
   * long as the response said it could — so a newly added event only appeared
   * after a hard reload. There is no purge module available to invalidate
   * nginx on save, so the response opts out instead.
   *
   * The cost is one SSR per visit, and that render is a single API call which
   * mokultur-elysia already caches in-process (and flushes on write). Freshness
   * is worth far more than an edge cache on a page this cheap.
   */
  setHeaders({ 'cache-control': 'no-store' });

  // Fail soft: an API hiccup should leave an empty schedule, not a 500 on a
  // page that is also a navigation target.
  const [upcomingRes, pastRes] = await Promise.allSettled([
    listEvents('upcoming', 50),
    listEvents('past', 12),
  ]);

  return {
    upcoming: upcomingRes.status === 'fulfilled' ? upcomingRes.value.data : [],
    past: pastRes.status === 'fulfilled' ? pastRes.value.data : [],
  };
};
