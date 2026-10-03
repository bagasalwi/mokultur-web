import type { PageServerLoad } from './$types';
import { getTagArticles, getPopularArticles } from '$lib/api';
import { error, isHttpError } from '@sveltejs/kit';
import { pageNumber, paginationTotal } from '$lib/pagination';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const page = pageNumber(url.searchParams.get('page'));
  if (page === null) error(404, 'Halaman tidak ditemukan');
  setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
  try {
    const [tagRes, popularRes] = await Promise.allSettled([
      getTagArticles(params.slug, page),
      getPopularArticles(5),
    ]);
    if (tagRes.status === 'rejected') throw (tagRes as PromiseRejectedResult).reason;
    const meta = { ...tagRes.value.meta, totalPages: paginationTotal(tagRes.value.meta) };
    if (page > meta.totalPages) error(404, 'Halaman tidak ditemukan');
    return {
      articles: tagRes.value.data,
      meta,
      tag: tagRes.value.tag,
      seo: tagRes.value.seo,
      page,
      popularArticles: popularRes.status === 'fulfilled' ? popularRes.value.data : [],
    };
  } catch (e: any) {
    if (isHttpError(e)) throw e;
    if (e.status === 404) throw error(404, 'Tag tidak ditemukan');
    throw error(500, 'Server error');
  }
};
