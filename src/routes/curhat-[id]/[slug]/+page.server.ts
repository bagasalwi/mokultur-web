import type { PageServerLoad } from './$types';
import { getCurhatan } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'Not found');

  setHeaders({ 'cache-control': 'public, max-age=120, stale-while-revalidate=600' });

  try {
    const res = await getCurhatan(id);
    return {
      curhatan: res.data,
      related: res.related,
    };
  } catch (e: any) {
    if (e?.status === 404) throw error(404, 'Curhatan tidak ditemukan');
    throw error(500, 'Server error');
  }
};
