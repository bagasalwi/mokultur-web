import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAnime } from '$lib/api';
import { animeSlug } from '$lib/anime';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const malId = Number(params.malId);

  if (!Number.isInteger(malId) || malId <= 0) {
    error(404, 'Anime tidak ditemukan');
  }

  const res = await getAnime(malId).catch(() => null);

  if (!res) {
    error(404, 'Anime tidak ditemukan');
  }

  // Keep one canonical URL per anime — MAL titles change, and old links would
  // otherwise sit around as duplicate content.
  const canonicalSlug = animeSlug(res.data.title);
  if (params.slug !== canonicalSlug) {
    redirect(301, `/anime/${malId}/${canonicalSlug}`);
  }

  setHeaders({ 'cache-control': 'public, max-age=600, stale-while-revalidate=1800' });

  return { anime: res.data };
};
