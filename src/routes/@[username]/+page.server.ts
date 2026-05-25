import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });
  try {
    const profile = await getUserProfile(params.username, page);
    return { profile, username: params.username, page };
  } catch (e: any) {
    if (e?.status === 404) error(404, 'Penulis tidak ditemukan');
    error(500, 'Gagal memuat profil');
  }
};
