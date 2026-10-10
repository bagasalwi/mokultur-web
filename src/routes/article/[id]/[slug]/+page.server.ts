import type { PageServerLoad } from './$types';
import { getArticle, getPopularTags, getAd, listCurhatan, listEvents } from '$lib/api';
import { error, redirect, fail } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions } from './$types';
import { loadReader } from '$lib/server/reader';
import type { ReaderArticleState } from '$lib/reader';

const COOKIE = 'mokultur_token';

export const load: PageServerLoad = async ({ params, request, setHeaders, url, locals, cookies, fetch }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'Not found');

  const preview = url.searchParams.get('preview_ads') === 'true';

  // Signed token minted by the dashboard so editors can open an unpublished
  // article. Never cache such a response: it holds draft content.
  const previewToken = url.searchParams.get('preview') ?? undefined;

  if (!preview && !previewToken) {
    setHeaders({ 'cache-control': 'public, max-age=120, stale-while-revalidate=600' });
  } else if (previewToken) {
    // The API marks the JSON noindex; the rendered page needs saying too, or a
    // shared preview link is indexable even though the article is unpublished.
    setHeaders({ 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' });
  }

  // The browser's If-None-Match is not forwarded: a 304 from the API would make apiFetch throw and the page 500.
  const ifNoneMatch = undefined;

  let res;
  try {
    const [articleRes, tagsRes, articleAd1Res, articleAd2Res, articleAd3Res, curhatanRes, eventsRes] = await Promise.allSettled([
      getArticle(id, params.slug, ifNoneMatch, previewToken),
      getPopularTags(15),
      getAd('article_ad_1', preview),
      getAd('article_ad_2', preview),
      getAd('article_ad_3', preview),
      listCurhatan({ perPage: 5 }),
      listEvents('upcoming', 6),
    ]);

    if (articleRes.status === 'rejected') {
      const e = articleRes.reason;
      if (e.status === 404) throw error(404, 'Artikel tidak ditemukan');
      throw error(500, 'Server error');
    }

    res = articleRes.value;

    // fetch() follows the API's own 301, so a stale slug shows up as a slug mismatch, not as `redirect`.
    if ((res as any).redirect || (res.data?.slug && res.data.slug !== params.slug)) {
      const suffix = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : '';
      throw redirect(301, `/article/${id}/${res.data?.slug ?? params.slug}${suffix}`);
    }

    const readerState = locals.user && !previewToken
      ? await loadReader<{ data: ReaderArticleState }>(fetch, cookies.get(COOKIE) ?? '', `articles/${id}`).then((r) => r.data).catch(() => null)
      : null;

    return {
      readerState,
      article: res.data,
      related: res.related,
      seo: res.seo,
      jsonLd: res.jsonLd,
      popularTags: tagsRes.status === 'fulfilled' ? tagsRes.value.data : [],
      adHero: articleAd1Res.status === 'fulfilled' ? (articleAd1Res.value?.data ?? null) : null,
      adSidebar: articleAd2Res.status === 'fulfilled' ? (articleAd2Res.value?.data ?? null) : null,
      adAfterContent: articleAd3Res.status === 'fulfilled' ? (articleAd3Res.value?.data ?? null) : null,
      promoCurhatan: curhatanRes.status === 'fulfilled' ? curhatanRes.value.data : [],
      upcomingEvents: eventsRes.status === 'fulfilled' ? eventsRes.value.data : [],
      isPreview: Boolean(previewToken),
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
