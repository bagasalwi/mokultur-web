import type { PageServerLoad } from './$types';
import { fetchForumThreads } from '$lib/forum';

export const load: PageServerLoad = async ({ url, fetch }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const animeId = url.searchParams.get('animeId') ? Number(url.searchParams.get('animeId')) : undefined;

  const { data, meta } = await fetchForumThreads(fetch, { page, perPage: 20, animeId });
  return { threads: data, meta, animeId };
};
