import type { RequestHandler } from './$types';
import { PUBLIC_API_URL } from '$env/static/public';
import { excludeAnimeFromSitemap } from '$lib/server/sitemap';

export const GET: RequestHandler = async () => {
  const res = await fetch(`${PUBLIC_API_URL}/sitemap.xml`);
  const xml = await res.text();
  return new Response(excludeAnimeFromSitemap(xml), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300, stale-while-revalidate=60',
    },
  });
};
