import type { PageServerLoad } from './$types';
import { getCategoryArticles, getPopularArticles } from '$lib/api';
import { error, isHttpError } from '@sveltejs/kit';
import { pageNumber, paginationTotal } from '$lib/pagination';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const page = pageNumber(url.searchParams.get('page'));
  if (page === null) error(404, 'Halaman tidak ditemukan');
  const search = url.searchParams.get('search')?.trim() || undefined;
  if (!search) {
    setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
  }
  try {
    const [catRes, popularRes] = await Promise.allSettled([
      getCategoryArticles(params.slug, page, search),
      getPopularArticles(5),
    ]);
    if (catRes.status === 'rejected') throw catRes.reason;
    const meta = { ...catRes.value.meta, totalPages: paginationTotal(catRes.value.meta) };
    if (page > meta.totalPages) error(404, 'Halaman tidak ditemukan');
    return {
      articles: catRes.value.data,
      meta,
      category: catRes.value.category,
      seo: catRes.value.seo,
      page,
      search: search ?? null,
      popularArticles: popularRes.status === 'fulfilled' ? popularRes.value.data : [],
    };
  } catch (e: any) {
    if (isHttpError(e)) throw e;
    if (e.status === 404) throw error(404, 'Kategori tidak ditemukan');
    throw error(500, 'Server error');
  }
};
