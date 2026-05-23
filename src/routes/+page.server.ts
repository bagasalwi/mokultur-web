import type { PageServerLoad } from './$types';
import { listArticles, getPopularTags, getPopularArticles, listWriters, getAd, listCurhatan } from '$lib/api';

export const load: PageServerLoad = async ({ setHeaders, url }) => {
  const preview = url.searchParams.get('preview_ads') === 'true';
  if (!preview) setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });

  const [headlinesRes, latestRes, moreRes, tagsRes, popularRes, eventRes, writersRes, techRes, ad0Res, ad1Res, ad2Res, ad3Res, curhatanRes] = await Promise.allSettled([
    listArticles({ page: 1, perPage: 6 }),
    listArticles({ page: 1, perPage: 15 }),
    listArticles({ page: 2, perPage: 12 }),
    getPopularTags(15),
    getPopularArticles(5),
    listArticles({ page: 1, perPage: 8, category: 'event' }),
    listWriters(1, 3),
    listArticles({ page: 1, perPage: 5, category: 'tech' }),
    getAd('ad_0', preview),
    getAd('ad_1', preview),
    getAd('ad_2', preview),
    getAd('ad_3', preview),
    listCurhatan({ perPage: 6 }),
  ]);

  return {
    headlines: headlinesRes.status === 'fulfilled' ? headlinesRes.value.data : [],
    latest: latestRes.status === 'fulfilled' ? latestRes.value.data : [],
    moreArticles: moreRes.status === 'fulfilled' ? moreRes.value.data : [],
    popularTags: tagsRes.status === 'fulfilled' ? tagsRes.value.data : [],
    popularArticles: popularRes.status === 'fulfilled' ? popularRes.value.data : [],
    eventArticles: eventRes.status === 'fulfilled' ? eventRes.value.data : [],
    writers: writersRes.status === 'fulfilled' ? writersRes.value.data : [],
    techArticles: techRes.status === 'fulfilled' ? techRes.value.data : [],
    adTop: ad0Res.status === 'fulfilled' ? (ad0Res.value?.data ?? null) : null,
    adMid: ad1Res.status === 'fulfilled' ? (ad1Res.value?.data ?? null) : null,
    adSidebar: ad2Res.status === 'fulfilled' ? (ad2Res.value?.data ?? null) : null,
    adBottom: ad3Res.status === 'fulfilled' ? (ad3Res.value?.data ?? null) : null,
    homeCurhatan: curhatanRes.status === 'fulfilled' ? curhatanRes.value.data : [],
  };
};
