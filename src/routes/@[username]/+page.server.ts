import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/api';
import { error, isHttpError, redirect } from '@sveltejs/kit';
import { pageNumber, paginationTotal } from '$lib/pagination';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const page = pageNumber(url.searchParams.get('page') ?? url.searchParams.get('articles_page'));
  if (page === null) error(404, 'Halaman tidak ditemukan');
  if (url.searchParams.has('articles_page')) {
    const query = new URLSearchParams(url.searchParams);
    query.delete('articles_page');
    if (page > 1) query.set('page', String(page));
    else query.delete('page');
    redirect(301, `${url.pathname}${query.size ? `?${query}` : ''}`);
  }
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });
  try {
    const profile = await getUserProfile(params.username, page);
    profile.articles.meta.totalPages = paginationTotal(profile.articles.meta);
    if (page > profile.articles.meta.totalPages) error(404, 'Halaman tidak ditemukan');
    return { profile, username: params.username, page };
  } catch (e: any) {
    if (isHttpError(e)) throw e;
    if (e?.status === 404) error(404, 'Penulis tidak ditemukan');
    error(500, 'Gagal memuat profil');
  }
};
