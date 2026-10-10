import type { PageServerLoad } from './$types';
import {
  getPopularTags,
  getTrendingSearches,
  listArticles,
  searchArticles,
  type SearchPeriod,
  type SearchResponse,
  type SearchSort,
} from '$lib/api';
import { pageNumber } from '$lib/pagination';

const SORTS: SearchSort[] = ['relevance', 'latest', 'popular'];
const PERIODS: SearchPeriod[] = ['week', 'month', 'year'];

function param(url: URL, name: string, max = 120): string {
  return (url.searchParams.get(name) ?? '').trim().slice(0, max);
}

export const load: PageServerLoad = async ({ url, request, setHeaders }) => {
  const q = param(url, 'q', 100).replace(/\s+/g, ' ');
  const page = Math.min(pageNumber(url.searchParams.get('page')) ?? 1, 100);
  const sortParam = param(url, 'sort') as SearchSort;
  const sort: SearchSort = SORTS.includes(sortParam) ? sortParam : 'relevance';
  const periodParam = param(url, 'period') as SearchPeriod;
  const period: SearchPeriod | '' = PERIODS.includes(periodParam) ? periodParam : '';
  const category = param(url, 'category');
  const author = param(url, 'author');
  const tag = param(url, 'tag');
  const filters = { sort, period, category, author, tag, page };

  const extras = async () => {
    const [trending, tags] = await Promise.allSettled([getTrendingSearches(), getPopularTags(14)]);
    return {
      trending: trending.status === 'fulfilled' ? trending.value.data : [],
      popularTags: tags.status === 'fulfilled' ? tags.value.data : [],
    };
  };

  if (q.length < 2) {
    const [more, latest] = await Promise.all([extras(), listArticles({ page: 1, perPage: 6 }).catch(() => null)]);
    setHeaders({ 'cache-control': 'public, max-age=60' });
    return { q, ...filters, result: null as SearchResponse | null, error: null as string | null, latest: latest?.data ?? [], ...more };
  }

  // The visitor's address, so the API's per-visitor limit applies to them and
  // not to this server as a whole.
  const forwarded = request.headers.get('x-forwarded-for');
  let result: SearchResponse | null = null;
  let error: string | null = null;
  try {
    result = await searchArticles(
      { q, page, perPage: 12, sort, period: period || undefined, category: category || undefined, author: author || undefined, tag: tag || undefined },
      forwarded ? { headers: { 'x-forwarded-for': forwarded } } : undefined,
    );
  } catch (e) {
    error = (e as { status?: number }).status === 429
      ? 'Terlalu banyak pencarian dalam semenit. Tunggu sebentar, lalu coba lagi.'
      : 'Pencarian sedang bermasalah. Coba lagi sebentar lagi.';
  }
  // Results depend only on the URL, so nginx may cache them briefly; failures not at all.
  setHeaders({ 'cache-control': error ? 'no-store' : 'public, max-age=60' });
  const more = !result || result.meta.total === 0 ? await extras() : { trending: [] as string[], popularTags: [] };
  return { q, ...filters, result, error, latest: [], ...more };
};
