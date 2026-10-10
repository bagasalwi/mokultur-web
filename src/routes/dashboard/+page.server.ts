import { COOKIE_NAME } from '$lib/auth';
import { loadReader } from '$lib/server/reader';
import { INTEREST_OPTIONS, type ReaderCollection, type ReaderFeed } from '$lib/reader';
import type { PageServerLoad } from './$types';

const emptyFeed = (): ReaderFeed => ({
  data: [], interests: [], availableInterests: INTEREST_OPTIONS,
  meta: { page: 1, perPage: 20, hasMore: false, asOf: new Date().toISOString() },
});

/** "Untuk Kamu": the personal feed, plus the two shelves beside it. */
export const load: PageServerLoad = async ({ cookies, fetch }) => {
  const token = cookies.get(COOKIE_NAME) ?? '';
  const [feed, history, saved] = await Promise.all([
    loadReader<ReaderFeed>(fetch, token, 'feed').then((data) => ({ data, error: null as string | null }))
      .catch(() => ({ data: emptyFeed(), error: 'Feed belum dapat dimuat. Coba lagi.' })),
    loadReader<ReaderCollection>(fetch, token, 'history?page=1').catch(() => null),
    loadReader<ReaderCollection>(fetch, token, 'saved?page=1').catch(() => null),
  ]);
  return {
    feed: feed.data,
    feedError: feed.error,
    recentlyRead: history?.data.slice(0, 4) ?? [],
    recentlySaved: saved?.data.slice(0, 4) ?? [],
  };
};
