import type { PageServerLoad } from './$types';
import { getArticle, getPopularTags, getAd, listCurhatan } from '$lib/api';
import { error, redirect, fail } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions } from './$types';

const COOKIE = 'mokultur_token';

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

export const actions: Actions = {
  comment: async ({ request, cookies, fetch, locals, params }) => {
    if (!locals.user) return fail(401, { error: 'Masuk dulu untuk berkomentar.' });

    const fd = await request.formData();
    const body = String(fd.get('body') ?? '').trim();
    if (!body) return fail(400, { error: 'Komentar tidak boleh kosong.' });

    const token = cookies.get(COOKIE) ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/articles/${params.id}/comments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `${COOKIE}=${token}`,
      },
      body: JSON.stringify({ body }),
    });

    if (res.status === 429) return fail(429, { error: 'Terlalu banyak komentar. Coba lagi nanti.' });
    if (!res.ok) return fail(res.status, { error: 'Gagal mengirim komentar.' });
    return await res.json();
  },
};
