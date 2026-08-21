import type { PageServerLoad } from './$types';
import { getPage, getPopularTags } from '$lib/api';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'Not found');

  setHeaders({ 'cache-control': 'public, max-age=3600, stale-while-revalidate=86400' });

  try {
    const [pageRes, tagsRes] = await Promise.allSettled([
      getPage(id),
      getPopularTags(15),
    ]);

    if (pageRes.status === 'rejected') {
      const e = pageRes.reason;
      if (e?.status === 404) throw error(404, 'Halaman tidak ditemukan');
      throw error(500, 'Server error');
    }

    const page = pageRes.value.data;

    // One page, one indexable URL: any other slug for this id is bounced to the
    // canonical spelling so link equity does not scatter across variants.
    if (page.slug && params.slug !== page.slug) {
      throw redirect(301, `/page/${page.id}/${page.slug}`);
    }

    return {
      page,
      popularTags: tagsRes.status === 'fulfilled' ? tagsRes.value.data : [],
    };
  } catch (e: any) {
    if (e?.status >= 300 && e?.status < 400) throw e;
    if (e?.status === 404 || e?.status === 500) throw e;
    throw error(500, 'Server error');
  }
};
