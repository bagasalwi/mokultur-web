import type { PageServerLoad } from './$types';
import { getEvent } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
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

  const res = await getEvent(params.slug).catch(() => null);

  if (!res) throw error(404, 'Event tidak ditemukan');

  return { event: res.data };
};
