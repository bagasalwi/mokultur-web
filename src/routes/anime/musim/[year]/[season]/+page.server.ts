import type { PageServerLoad } from './$types';
import { getAnimeSeason } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders, parent }) => {
  // Disabled features are gone, not merely hidden: the route 404s.
  const { settings } = await parent();
  if (settings?.anime_enabled === false) throw error(404, 'Anime tidak tersedia.');

  const year = Number(params.year);

  if (!Number.isInteger(year)) throw error(404, 'Musim tidak ditemukan');

  setHeaders({ 'cache-control': 'public, max-age=3600, stale-while-revalidate=86400' });

  const res = await getAnimeSeason(year, params.season).catch(() => null);

  if (!res) throw error(404, 'Musim tidak ditemukan');

  return { year: res.year, season: res.season, total: res.total, anime: res.data };
};
