import type { PageServerLoad } from './$types';
import { getMediaPartners } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({ 'cache-control': 'public, max-age=3600, stale-while-revalidate=86400' });
  try {
    const res = await getMediaPartners();
    return {
      featured: res.featured,
      sections: res.sections,
      stats: res.stats,
    };
  } catch {
    throw error(500, 'Gagal memuat data media partner');
  }
};
