import { isAnimePath } from '$lib/route-policy';
/**
 * The API runs on this same box. Going through api.mokultur.com sent every
 * sitemap request out through Cloudflare and back in, where a bot check or a
 * hiccup turned Google's fetch into a 503; the loopback address cannot.
 * Same address src/lib/api.ts uses for server-side loads.
 */
const API_INTERNAL = 'http://127.0.0.1:3001';

export function cleanSitemap(xml: string): string {
  const seen = new Set<string>();
  return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url\s*>/g, (entry) => {
    const location = entry.match(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/)?.[1];
    if (!location) return '';

    const value = location.trim().replace(/&amp;/g, '&');
    try {
      const url = new URL(value);
      const privatePath = /^\/(?:untuk-kamu|artikel-tersimpan|auth|dashboard|admin|api)(?:\/|$)/.test(url.pathname);
      if (!['https:', 'http:'].includes(url.protocol) || privatePath || isAnimePath(url.pathname) || url.search || url.hash || seen.has(url.href)) return '';
      seen.add(url.href);
      return entry;
    } catch {
      return '';
    }
  });
}

export const excludeAnimeFromSitemap = cleanSitemap;

export async function sitemapResponse(fetcher: typeof fetch, path: string): Promise<Response> {
  try {
    const upstream = await fetcher(`${API_INTERNAL}/${path}`, { signal: AbortSignal.timeout(10000) });
    if (upstream.status === 404) return new Response('Sitemap tidak ditemukan.', { status: 404, headers: { 'cache-control': 'no-store' } });
    if (!upstream.ok) throw new Error('Sitemap unavailable');
    const xml = await upstream.text();
    if (!/<(?:urlset|sitemapindex)\b/.test(xml)) throw new Error('Invalid sitemap');
    return new Response(cleanSitemap(xml), { headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300, stale-while-revalidate=60',
    } });
  } catch {
    return new Response('Sitemap sementara tidak tersedia.', { status: 503, headers: {
      'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '60',
    } });
  }
}
