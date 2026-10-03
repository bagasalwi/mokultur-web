import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAnime } from '$lib/api';
import { animeSlug } from '$lib/anime';

export const trailingSlash = 'ignore';

/**
 * Legacy per-episode URLs from the Laravel frontend.
 *
 * Those pages moved years ago, but Google still retries them — they were a
 * large share of the 404s in Search Console, and every retry is crawl budget
 * not spent on articles. The anime page carries the episode list now, so a
 * permanent redirect there is the honest answer rather than a 404.
 */
export const GET: RequestHandler = async ({ params }) => {
  const malId = Number(params.malId);

  if (!Number.isInteger(malId) || malId <= 0) throw redirect(301, '/anime');

  const res = await getAnime(malId).catch(() => null);

  if (!res?.data) throw redirect(301, '/anime');

  throw redirect(301, `/anime/${malId}/${animeSlug(res.data.title)}`);
};
