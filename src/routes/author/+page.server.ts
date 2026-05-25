import type { PageServerLoad } from './$types';
import { listWriters } from '$lib/api';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });
  const res = await listWriters(page, 12).catch(() => ({ data: [], meta: { total: 0, page, perPage: 12, totalPages: 0 } }));
  return { writers: res.data, meta: res.meta, page };
};
