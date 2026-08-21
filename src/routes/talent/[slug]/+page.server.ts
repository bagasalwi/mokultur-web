import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTalent } from '$lib/api';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const res = await getTalent(params.slug).catch(() => null);

  if (!res) {
    error(404, 'Talent tidak ditemukan');
  }

  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });

  return { talent: res.data };
};
