import { isAnimePath } from '$lib/route-policy';

export function excludeAnimeFromSitemap(xml: string): string {
  return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url\s*>/g, (entry) => {
    const location = entry.match(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/)?.[1];
    if (!location) return entry;

    const value = location.trim().replace(/&amp;/g, '&');
    try {
      const pathname = new URL(value, 'https://mokultur.com').pathname;
      return isAnimePath(pathname) ? '' : entry;
    } catch {
      return entry;
    }
  });
}
