import type { PageServerLoad } from './$types';
import { getUserProfile, type ProfileSort } from '$lib/api';
import { error, isHttpError } from '@sveltejs/kit';
import { listingPage, paginationTotal } from '$lib/pagination';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  // ?articles_page=N is the old profile pager; listingPage sends it to ?page=N.
  const page = listingPage(url, 'articles_page');
  const sort: ProfileSort = url.searchParams.get('sort') === 'popular' ? 'popular' : 'latest';
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });
  try {
    const profile = await getUserProfile(params.username, page, sort);
    profile.articles.meta.totalPages = paginationTotal(profile.articles.meta);
    if (page > profile.articles.meta.totalPages) error(404, 'Halaman tidak ditemukan');
    return { profile, username: params.username, page, sort };
  } catch (e: any) {
    if (isHttpError(e)) throw e;
    if (e?.status === 404) error(404, 'Penulis tidak ditemukan');
    error(500, 'Gagal memuat profil');
  }
};
