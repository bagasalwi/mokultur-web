import type { PageServerLoad } from './$types';
import { getRatecard } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ setHeaders }) => {
  let ratecard;
  try {
    ({ data: ratecard } = await getRatecard());
  } catch (err) {
    if ((err as { status?: number }).status === 404) throw error(404, 'Ratecard tidak ditemukan');
    throw error(503, 'Ratecard sedang tidak dapat dimuat');
  }
  // Short: edits from the dashboard should reach readers within minutes.
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' });
  return { ratecard };
};
