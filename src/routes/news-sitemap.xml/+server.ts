import type { RequestHandler } from './$types';
import { PUBLIC_API_URL } from '$env/static/public';
import { excludeAnimeFromSitemap } from '$lib/server/sitemap';

/** Served from this origin so the feed URL sits on the site's own domain. */
export const GET: RequestHandler = async ({ fetch }) => {
  const res = await fetch(`${PUBLIC_API_URL}/news-sitemap.xml`);
  const xml = await res.text();

  return new Response(excludeAnimeFromSitemap(xml), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Shorter than the regular sitemap: this file exists to be fresh.
      'cache-control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
};
