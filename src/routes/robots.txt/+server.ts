import type { RequestHandler } from './$types';
import { PUBLIC_SITE_URL } from '$env/static/public';

export const GET: RequestHandler = async () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    // Login URLs carry a ?redirect= for every article, so crawlers were pulling
    // hundreds of them. They are noindex already, but that only stops indexing
    // — this stops the crawl.
    'Disallow: /auth/',
    '',
    `Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml`,
    // Declared separately: Google reads the news sitemap on its own cadence and
    // only takes the last two days from it.
    `Sitemap: ${PUBLIC_SITE_URL}/news-sitemap.xml`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // An hour, not a day: robots.txt is edited rarely but when it is, a
      // 24-hour cached copy means crawlers keep reading the old one all day.
      'cache-control': 'public, max-age=3600',
    },
  });
};
