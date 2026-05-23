import type { PageServerLoad } from './$types';
import { listArticles, getPopularTags, listCategories, getAd } from '$lib/api';

export const load: PageServerLoad = async ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const search = url.searchParams.get('search') ?? undefined;
  const category = url.searchParams.get('category') ?? undefined;
  const reviewOnly = url.searchParams.get('reviewOnly') === 'true';
  const preview = url.searchParams.get('preview_ads') === 'true';

  const [articlesRes, tagsRes, editorPicksRes, categoriesRes, adSidebarRes] = await Promise.allSettled([
    listArticles({ page, perPage: 12, search, category, reviewOnly }),
    getPopularTags(15),
    listArticles({ page: 1, perPage: 7, reviewOnly: true }),
    listCategories(),
    getAd('ad_2', preview),
  ]);

  return {
    articles: articlesRes.status === 'fulfilled' ? articlesRes.value.data : [],
    meta: articlesRes.status === 'fulfilled' ? articlesRes.value.meta : { total: 0, page, perPage: 12, totalPages: 0 },
    popularTags: tagsRes.status === 'fulfilled' ? tagsRes.value.data : [],
    editorPicks: editorPicksRes.status === 'fulfilled' ? editorPicksRes.value.data : [],
    archiveCategories: categoriesRes.status === 'fulfilled' ? categoriesRes.value.data.slice(0, 6) : [],
    adSidebar: adSidebarRes.status === 'fulfilled' ? (adSidebarRes.value?.data ?? null) : null,
    search: search ?? '',
    category: category ?? '',
    reviewOnly,
    page,
  };
};
