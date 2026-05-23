import type { PageServerLoad } from './$types';
import { listWriters } from '$lib/api';

export const load: PageServerLoad = async ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const res = await listWriters(page, 12).catch(() => ({ data: [], meta: { total: 0, page, perPage: 12, totalPages: 0 } }));
  return { writers: res.data, meta: res.meta, page };
};
