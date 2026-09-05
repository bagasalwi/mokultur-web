import type { PageServerLoad } from './$types';
import { listArticles, getPopularTags, getPopularArticles, listWriters, getAd, listCurhatan, listReels, getCurrentSeasonTop, getAiringToday, listEvents } from '$lib/api';
import { fetchTopThreads } from '$lib/threads';
import { LOUNGE_ENABLED } from '$lib/features';

export const load: PageServerLoad = async ({ setHeaders, url, fetch, parent }) => {
  const preview = url.searchParams.get('preview_ads') === 'true';
  // Settings already came down with the layout load, so this costs no request.
  const { settings } = await parent();
  const animeOn = settings?.anime_enabled !== false;
  const eventOn = settings?.event_enabled !== false;
  if (!preview) setHeaders({ 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });

  const [headlinesRes, latestRes, moreRes, tagsRes, popularRes, eventRes, writersRes, techRes, ad0Res, ad1Res, ad2Res, ad3Res, curhatanRes, threadsRes, reelsRes, seasonAnimeRes, airingRes, upcomingEventsRes] = await Promise.allSettled([
    listArticles({ page: 1, perPage: 6 }),
    listArticles({ page: 1, perPage: 15 }),
    listArticles({ page: 2, perPage: 20 }),
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
    LOUNGE_ENABLED ? fetchTopThreads(fetch, 4) : Promise.resolve([]),
    listReels(),
    animeOn ? getCurrentSeasonTop(8) : Promise.resolve(null),
    animeOn ? getAiringToday() : Promise.resolve(null),
    eventOn ? listEvents('upcoming', 8) : Promise.resolve(null),
  ]);

  const headlines = headlinesRes.status === 'fulfilled' ? headlinesRes.value.data : [];
  const latest = latestRes.status === 'fulfilled' ? latestRes.value.data : [];
  const seenIds = new Set([...headlines, ...latest].map((a) => a.id));
  const moreArticles = (moreRes.status === 'fulfilled' ? moreRes.value.data : [])
    .filter((a) => !seenIds.has(a.id))
    .slice(0, 16);

  return {
    headlines,
    latest,
    moreArticles,
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
    trendingThreads: threadsRes.status === 'fulfilled' ? threadsRes.value : [],
    reels: reelsRes.status === 'fulfilled' ? reelsRes.value.data : [],
    igProfile: reelsRes.status === 'fulfilled' ? reelsRes.value.profile : null,
    seasonAnime: seasonAnimeRes.status === 'fulfilled' ? (seasonAnimeRes.value?.data ?? []) : [],
    animeSeason: seasonAnimeRes.status === 'fulfilled' ? (seasonAnimeRes.value?.season ?? null) : null,
    animeSeasonYear: seasonAnimeRes.status === 'fulfilled' ? (seasonAnimeRes.value?.year ?? null) : null,
    airingToday: airingRes.status === 'fulfilled' ? (airingRes.value?.data ?? []) : [],
    airingDay: airingRes.status === 'fulfilled' ? (airingRes.value?.day ?? null) : null,
    upcomingEvents: upcomingEventsRes.status === 'fulfilled' ? (upcomingEventsRes.value?.data ?? []) : [],
  };
};
