import type { RequestHandler } from './$types';
import { getSettings } from '$lib/api';
import { BRAND } from '$lib/server/site';

const icon = (src: string, sizes: string, purpose: 'any' | 'maskable') => ({ src, sizes, type: 'image/png', purpose });

/**
 * The web app manifest, built per site: name from site_name, the status bar
 * colour from the navbar it sits on, and shortcuts only to pages the site has.
 * It was a static file naming Mokultur, which a second site would have shipped.
 */
export const GET: RequestHandler = async () => {
  const settings = await getSettings().then((res) => res.data).catch(() => null);
  const name = settings?.site_name ?? 'Mokultur';
  const shortcut = (label: string, shortName: string, url: string) => ({
    name: label,
    short_name: shortName,
    url,
    icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
  });

  const manifest = {
    id: '/',
    name,
    short_name: name,
    description: BRAND.description || settings?.site_description || '',
    lang: 'id',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: settings?.navbar_bg ?? '#ffffff',
    categories: ['news', 'entertainment'],
    icons: [
      icon('/icons/icon-192.png', '192x192', 'any'),
      icon('/icons/icon-512.png', '512x512', 'any'),
      icon('/icons/maskable-192.png', '192x192', 'maskable'),
      icon('/icons/maskable-512.png', '512x512', 'maskable'),
    ],
    shortcuts: [
      ...(settings?.anime_enabled === false ? [] : [shortcut('Anime', 'Anime', '/anime')]),
      ...(settings?.event_enabled === false ? [] : [shortcut('Jadwal Event', 'Event', '/event')]),
      shortcut('Dashboard', 'Dashboard', '/dashboard'),
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
