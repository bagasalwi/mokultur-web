import type { PageServerLoad } from './$types';
import { listAnimeSeasons } from '$lib/api';

export const load: PageServerLoad = async ({ setHeaders }) => {
  // A season index changes four times a year; there is no reason to re-render it
  // per visitor.
  setHeaders({ 'cache-control': 'public, max-age=3600, stale-while-revalidate=86400' });

  const res = await listAnimeSeasons().catch(() => null);

  return { seasons: res?.data ?? [] };
};
