import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Same-origin proxy for the event share card.
 *
 * `download` is ignored cross-origin, so linking straight at api.mokultur.com
 * turns the click into a plain navigation to another host — some browsers just
 * open a blank tab. Served from this origin the attribute is honoured and the
 * visitor never leaves the page. Same reasoning as the talent card proxy.
 */
export const GET: RequestHandler = async ({ params, fetch, setHeaders }) => {
  const upstream = `${PUBLIC_API_URL}/api/events/${encodeURIComponent(params.slug)}/share.png`;
  const res = await fetch(upstream);

  if (!res.ok) {
    throw error(res.status === 404 ? 404 : 502, 'Kartu event tidak tersedia.');
  }

  setHeaders({
    'content-type': 'image/png',
    // Matches the API's own TTL — the card changes whenever the event is edited.
    'cache-control': 'public, max-age=300, s-maxage=300, must-revalidate',
    'content-disposition': `attachment; filename="mokultur-event-${params.slug}.png"`,
  });

  return new Response(res.body);
};
