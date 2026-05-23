import type { PageServerLoad } from './$types';
import { getCategoryArticles, getPopularArticles } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
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
    return {
      articles: catRes.value.data,
      meta: catRes.value.meta,
      category: catRes.value.category,
      seo: catRes.value.seo,
      page,
      search: search ?? null,
      popularArticles: popularRes.status === 'fulfilled' ? popularRes.value.data : [],
    };
  } catch (e: any) {
    if (e.status === 404) throw error(404, 'Kategori tidak ditemukan');
    throw error(500, 'Server error');
  }
};
