import type { RequestHandler } from './$types';
import { PUBLIC_API_URL } from '$env/static/public';

/** Served from this origin so the feed URL matches the site's own domain. */
export const GET: RequestHandler = async () => {
  const res = await fetch(`${PUBLIC_API_URL}/rss.xml`);
  const xml = await res.text();

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
};
