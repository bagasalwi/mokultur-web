import type { PageServerLoad } from './$types';
import { listWriters, type Writer } from '$lib/api';
import { pageNumber } from '$lib/pagination';

type WriterSort = 'active' | 'views';

const time = (d: string | null) => (d ? Date.parse(d.includes('T') ? d : `${d.replace(' ', 'T')}Z`) || 0 : 0);

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const page = pageNumber(url.searchParams.get('page')) ?? 1;
  const sort: WriterSort = url.searchParams.get('sort') === 'views' ? 'views' : 'active';
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });
  // The whole roster fits on one page; paging only kicks in past 50 writers.
  const res = await listWriters(page, 50).catch(() => ({ data: [] as Writer[], meta: { total: 0, page, perPage: 50, totalPages: 0 } }));
  const writers = [...res.data].sort((a, b) =>
    sort === 'views' ? b.totalViews - a.totalViews : time(b.latestPublishDate) - time(a.latestPublishDate),
  );
  return { writers, meta: res.meta, page, sort };
};
