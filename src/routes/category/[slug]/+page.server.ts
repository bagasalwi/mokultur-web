import type { PageServerLoad } from './$types';
import { getCategoryArticles, getPopularArticles, type ArticleListItem, type ArticleSort, type PopularRange } from '$lib/api';
import { error, isHttpError } from '@sveltejs/kit';
import { pageNumber, paginationTotal } from '$lib/pagination';
import { COOKIE_NAME } from '$lib/auth';
import { loadReader } from '$lib/server/reader';
import { interestForCategory, type ReaderInterest } from '$lib/reader';

const PER_PAGE = 15;

/**
 * Category popularity per window, for the tabs on the popular card: today,
 * this week and this month, in parallel (the API caches each for 5 minutes).
 * A quieter category with fewer than three hits this month also gets an
 * all-time list, and opens on it, as the single-list card used to.
 */
async function popularIn(slug: string): Promise<{ ranges: Record<PopularRange, ArticleListItem[]>; initial: PopularRange }> {
  const pick = (range: PopularRange) => getPopularArticles(5, range, slug).then((r) => r.data).catch(() => [] as ArticleListItem[]);
  const [today, week, month] = await Promise.all([pick('today'), pick('week'), pick('month')]);
  const all = month.length >= 3 ? [] : await pick('all');
  return { ranges: { today, week, month, all }, initial: month.length >= 3 ? 'month' : 'all' };
}

export const load: PageServerLoad = async ({ params, url, setHeaders, locals, cookies, fetch }) => {
  const page = pageNumber(url.searchParams.get('page'));
  if (page === null) error(404, 'Halaman tidak ditemukan');
  const search = url.searchParams.get('search')?.trim() || undefined;
  const sort: ArticleSort = url.searchParams.get('sort') === 'popular' ? 'popular' : 'latest';
  if (!search) {
    setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
  }

  const interest = interestForCategory(params.slug);

  try {
    const [catRes, popular, interests] = await Promise.all([
      getCategoryArticles(params.slug, page, search, sort, PER_PAGE),
      popularIn(params.slug),
      // Only readers have interests; guests never pay for this request.
      locals.user && interest
        ? loadReader<{ data: ReaderInterest[] }>(fetch, cookies.get(COOKIE_NAME) ?? '', 'interests')
            .then((r) => r.data)
            .catch(() => [] as ReaderInterest[])
        : Promise.resolve([] as ReaderInterest[]),
    ]);
    const meta = { ...catRes.meta, totalPages: paginationTotal(catRes.meta) };
    if (page > meta.totalPages) error(404, 'Halaman tidak ditemukan');
    return {
      articles: catRes.data,
      meta,
      category: catRes.category,
      seo: catRes.seo,
      page,
      search: search ?? null,
      sort,
      popular: popular.ranges,
      popularInitial: popular.initial,
      interest,
      interests,
    };
  } catch (e: any) {
    if (isHttpError(e)) throw e;
    if (e.status === 404) throw error(404, 'Kategori tidak ditemukan');
    throw error(500, 'Server error');
  }
};
