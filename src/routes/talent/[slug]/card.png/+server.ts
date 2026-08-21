import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Same-origin proxy for the talent share card.
 *
 * Linking straight at api.mokultur.com made some browsers open a blank tab
 * instead of downloading: `download` is ignored cross-origin, so the click
 * became a plain navigation to another host. Served from this origin the
 * attribute is honoured and the visitor never leaves the page.
 */
export const GET: RequestHandler = async ({ params, fetch, setHeaders }) => {
  const upstream = `${PUBLIC_API_URL}/api/talents/${encodeURIComponent(params.slug)}/share.png`;
  const res = await fetch(upstream);

  if (!res.ok) {
    throw error(res.status === 404 ? 404 : 502, 'Kartu talent tidak tersedia.');
  }

  setHeaders({
    'content-type': 'image/png',
    // Matches the API's own TTL: the card changes whenever the IG sync updates
    // follower counts.
    'cache-control': 'public, max-age=300, s-maxage=300, must-revalidate',
    'content-disposition': `attachment; filename="mokultur-talent-${params.slug}.png"`,
  });

  return new Response(res.body);
};
