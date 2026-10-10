import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Same-origin proxy for the article's Instagram Story image.
 *
 * Served from this origin so `download` is honoured and the share sheet can
 * fetch the PNG into a File for `navigator.share` without a CORS round.
 */
export const GET: RequestHandler = async ({ params, url, fetch, setHeaders }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) throw error(404, 'Artikel tidak ditemukan.');

  const upstream = new URL(`${PUBLIC_API_URL}/api/articles/${id}/story.png`);
  const bold = url.searchParams.get('bold');
  if (bold !== null) upstream.searchParams.set('bold', bold);

  const res = await fetch(upstream);
  if (!res.ok) throw error(res.status === 404 ? 404 : 502, 'Gambar story tidak tersedia.');

  setHeaders({
    'content-type': 'image/png',
    'cache-control': 'public, max-age=300, s-maxage=300, must-revalidate',
    'content-disposition': `attachment; filename="mokultur-story-${params.slug}.png"`,
  });

  return new Response(res.body);
};
