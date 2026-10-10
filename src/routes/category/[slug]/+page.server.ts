import type { PageServerLoad } from './$types';
import { getCategoryArticles, getPopularArticles, type ArticleListItem, type ArticleSort } from '$lib/api';
import { error, isHttpError } from '@sveltejs/kit';
import { pageNumber, paginationTotal } from '$lib/pagination';
import { COOKIE_NAME } from '$lib/auth';
import { loadReader } from '$lib/server/reader';
import { interestForCategory, type ReaderInterest } from '$lib/reader';

const PER_PAGE = 15;

/**
 * Category popularity, newest window first: this calendar month, falling back
 * to all time when a quieter category has not had three hits yet this month.
 */
async function popularIn(slug: string): Promise<{ articles: ArticleListItem[]; scope: 'month' | 'all' }> {
  const month = await getPopularArticles(5, 'month', slug).catch(() => null);
  if (month && month.data.length >= 3) return { articles: month.data, scope: 'month' };
  const all = await getPopularArticles(5, 'all', slug).catch(() => null);
  return { articles: all?.data ?? month?.data ?? [], scope: 'all' };
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
      popularArticles: popular.articles,
      popularScope: popular.scope,
      interest,
      interests,
    };
  } catch (e: any) {
    if (isHttpError(e)) throw e;
    if (e.status === 404) throw error(404, 'Kategori tidak ditemukan');
    throw error(500, 'Server error');
  }
};
