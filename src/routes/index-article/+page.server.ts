import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAd, getMediaPartners, listArticles } from '$lib/api';
import { pageNumber } from '$lib/pagination';

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const search = url.searchParams.get('search')?.trim() || undefined;
  const category = url.searchParams.get('category')?.trim().slice(0, 80) || '';
  // Search moved to /search; old links, bookmarks and Google's sitelinks box land there.
  if (search) {
    const target = new URLSearchParams({ q: search });
    if (category) target.set('category', category);
    redirect(301, `/search?${target}`);
  }
  const page = pageNumber(url.searchParams.get('page'));
  if (page === null || page > 1000) error(404, 'Halaman tidak ditemukan');
  const reviewOnly = url.searchParams.get('reviewOnly') === 'true';
  const preview = url.searchParams.get('preview_ads') === 'true';

  const [articlesRes, partnersRes, adRes] = await Promise.allSettled([
    listArticles({ page, perPage: PER_PAGE, category: category || undefined, reviewOnly }),
    getMediaPartners(),
    getAd('ad_2', preview),
  ]);
  const articles = articlesRes.status === 'fulfilled' ? articlesRes.value.data : [];
  const meta = articlesRes.status === 'fulfilled' ? articlesRes.value.meta : { total: 0, page, perPage: PER_PAGE, totalPages: 0 };
  if (articlesRes.status === 'fulfilled' && page > 1 && page > meta.totalPages) error(404, 'Halaman tidak ditemukan');

  // Media partnerships first, then paid and invitational ones.
  const partnerData = partnersRes.status === 'fulfilled' ? partnersRes.value : null;
  const partners = partnerData ? [...partnerData.sections].sort((a, b) => a.type - b.type).flatMap((s) => s.partners) : [];

  setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
  return {
    articles,
    meta,
    failed: articlesRes.status === 'rejected',
    partners,
    partnerTotal: partnerData?.stats.total ?? partners.length,
    adSidebar: adRes.status === 'fulfilled' ? (adRes.value?.data ?? null) : null,
    category,
    reviewOnly,
    page,
    indexable: !category && !reviewOnly && articles.length > 0,
  };
};
