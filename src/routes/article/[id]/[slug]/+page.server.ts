import type { PageServerLoad } from './$types';
import { getArticle, getPopularTags, getAd, listCurhatan } from '$lib/api';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, request, setHeaders, url }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'Not found');

  const preview = url.searchParams.get('preview_ads') === 'true';
  if (!preview) setHeaders({ 'cache-control': 'public, max-age=120, stale-while-revalidate=600' });

  const ifNoneMatch = request.headers.get('if-none-match') ?? undefined;

  let res;
  try {
    const [articleRes, tagsRes, articleAd1Res, articleAd2Res, articleAd3Res, curhatanRes] = await Promise.allSettled([
      getArticle(id, params.slug, ifNoneMatch),
      getPopularTags(15),
      getAd('article_ad_1', preview),
      getAd('article_ad_2', preview),
      getAd('article_ad_3', preview),
      listCurhatan({ perPage: 5 }),
    ]);

    if (articleRes.status === 'rejected') {
      const e = articleRes.reason;
      if (e.status === 404) throw error(404, 'Artikel tidak ditemukan');
      throw error(500, 'Server error');
    }

    res = articleRes.value;

    if ((res as any).redirect) {
      throw redirect(301, `/article/${id}/${res.data?.slug ?? params.slug}`);
    }

    return {
      article: res.data,
      related: res.related,
      seo: res.seo,
      jsonLd: res.jsonLd,
      popularTags: tagsRes.status === 'fulfilled' ? tagsRes.value.data : [],
      adHero: articleAd1Res.status === 'fulfilled' ? (articleAd1Res.value?.data ?? null) : null,
      adSidebar: articleAd2Res.status === 'fulfilled' ? (articleAd2Res.value?.data ?? null) : null,
      adAfterContent: articleAd3Res.status === 'fulfilled' ? (articleAd3Res.value?.data ?? null) : null,
      promoCurhatan: curhatanRes.status === 'fulfilled' ? curhatanRes.value.data : [],
    };
  } catch (e: any) {
    if (e.status === 301 || e.status === 302) throw e;
    if (e.status === 404) throw error(404, 'Artikel tidak ditemukan');
    throw error(500, 'Server error');
  }
};
