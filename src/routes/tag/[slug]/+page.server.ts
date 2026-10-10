import type { PageServerLoad } from './$types';
import { getTagArticles, getPopularArticles } from '$lib/api';
import { error, isHttpError, redirect } from '@sveltejs/kit';
import { pageNumber, paginationTotal } from '$lib/pagination';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
  const page = pageNumber(url.searchParams.get('page'));
  if (page === null) error(404, 'Halaman tidak ditemukan');
  setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });

  let tagRes: Awaited<ReturnType<typeof getTagArticles>>;
  let popular: Awaited<ReturnType<typeof getPopularArticles>>['data'] = [];
  try {
    const [tagResult, popularResult] = await Promise.allSettled([getTagArticles(params.slug, page), getPopularArticles(5)]);
    if (tagResult.status === 'rejected') throw tagResult.reason;
    tagRes = tagResult.value;
    if (popularResult.status === 'fulfilled') popular = popularResult.value.data;
  } catch (e: any) {
    if (isHttpError(e)) throw e;
    if (e?.status === 404) error(404, 'Tag tidak ditemukan');
    error(500, 'Server error');
  }

  // Merged duplicate tags and other spellings land on the one canonical tag page.
  if (tagRes.redirect) redirect(301, `/tag/${encodeURIComponent(tagRes.redirect)}${page > 1 ? `?page=${page}` : ''}`);

  const meta = { ...tagRes.meta, totalPages: paginationTotal(tagRes.meta) };
  if (page > meta.totalPages) error(404, 'Halaman tidak ditemukan');
  return {
    articles: tagRes.data,
    meta,
    tag: tagRes.tag,
    seo: tagRes.seo,
    page,
    popularArticles: popular,
  };
};
