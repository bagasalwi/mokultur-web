import type { PageServerLoad } from './$types';
import { listCurhatan } from '$lib/api';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const filter = url.searchParams.get('filter') ?? undefined;
  setHeaders({ 'cache-control': 'public, max-age=30, stale-while-revalidate=120' });

  const res = await listCurhatan({ filter }).catch(() => null);

  return {
    curhatan: res?.data ?? [],
    meta: res?.meta ?? { total: 0, hasMore: false, nextCursor: null },
    filter: filter ?? '',
  };
};
