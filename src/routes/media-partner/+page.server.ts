import type { PageServerLoad } from './$types';
import { getMediaPartners } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
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
