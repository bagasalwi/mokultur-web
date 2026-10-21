import type { PageServerLoad } from './$types';
import { getCurhatan } from '$lib/api';
import { curhatSlug } from '$lib/curhat';
import { error, isHttpError, isRedirect, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'Not found');

  try {
    const res = await getCurhatan(id);
    // One URL per post: an old or hand-typed slug is a duplicate of this page.
    const slug = curhatSlug(res.data.curhatan);
    if (params.slug !== slug) throw redirect(301, `/curhat-${id}/${slug}`);

    setHeaders({ 'cache-control': 'public, max-age=120, stale-while-revalidate=600' });
    return {
      curhatan: res.data,
      related: res.related,
    };
  } catch (e: any) {
    if (isRedirect(e) || isHttpError(e)) throw e;
    // Deleted or hidden by moderation: gone for good, so Google drops it sooner.
    if (e?.status === 410) throw error(410, 'Curhatan ini sudah dihapus');
    if (e?.status === 404) throw error(404, 'Curhatan tidak ditemukan');
    throw error(500, 'Server error');
  }
};
