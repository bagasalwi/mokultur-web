import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { getSettings } from '$lib/api';

export const trailingSlash = 'ignore';

/**
 * Same-origin proxy for the Story card.
 *
 * `download` is ignored cross-origin, so linking straight at api.mokultur.com
 * opens a blank tab on some browsers instead of saving the file — and saving it
 * is the entire point of a card made for Instagram.
 */
export const GET: RequestHandler = async ({ url, fetch, setHeaders }) => {
  // Share cards belong to the feature; when it is off they go too.
  const { data: settings } = await getSettings();
  if (settings.anime_enabled === false || settings.quiz_enabled === false) throw error(404, 'Kuis tidak tersedia.');

  const upstream = new URL(`${PUBLIC_API_URL}/api/anime/taste/share.png`);
  for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);

  const res = await fetch(upstream);

  if (!res.ok) throw error(res.status === 404 ? 404 : 502, 'Kartu tidak tersedia.');

  setHeaders({
    'content-type': 'image/png',
    'cache-control': 'public, max-age=300, s-maxage=300, must-revalidate',
    'content-disposition': 'attachment; filename="selera-anime-mokultur.png"',
  });

  return new Response(res.body);
};
