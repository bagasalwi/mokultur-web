import type { PageServerLoad } from './$types';
import { fetchThreads, fetchTopThreads } from '$lib/threads';

export const load: PageServerLoad = async ({ url, fetch }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const animeId = url.searchParams.get('animeId') ? Number(url.searchParams.get('animeId')) : undefined;

  const [list, topThreads] = await Promise.all([
    fetchThreads(fetch, { page, perPage: 20, animeId }),
    fetchTopThreads(fetch, 5),
  ]);

  return { threads: list.data, meta: list.meta, animeId, topThreads };
};
