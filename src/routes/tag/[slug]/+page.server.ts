import type { PageServerLoad } from './$types';
import { getTagArticles, getPopularArticles } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
  try {
    const [tagRes, popularRes] = await Promise.allSettled([
      getTagArticles(params.slug, page),
      getPopularArticles(5),
    ]);
    if (tagRes.status === 'rejected') throw (tagRes as PromiseRejectedResult).reason;
    return {
      articles: tagRes.value.data,
      meta: tagRes.value.meta,
      tag: tagRes.value.tag,
      seo: tagRes.value.seo,
      page,
      popularArticles: popularRes.status === 'fulfilled' ? popularRes.value.data : [],
    };
  } catch (e: any) {
    if (e.status === 404) throw error(404, 'Tag tidak ditemukan');
    throw error(500, 'Server error');
  }
};
