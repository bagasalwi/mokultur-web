import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listAnimeSeasons } from '$lib/api';

export const load: PageServerLoad = async ({ setHeaders, parent }) => {
  // Disabled features are gone, not merely hidden: the route 404s.
  const { settings } = await parent();
  if (settings?.anime_enabled === false) throw error(404, 'Anime tidak tersedia.');

  // A season index changes four times a year; there is no reason to re-render it
  // per visitor.
  setHeaders({ 'cache-control': 'public, max-age=3600, stale-while-revalidate=86400' });

  const res = await listAnimeSeasons().catch(() => null);

  return { seasons: res?.data ?? [] };
};
