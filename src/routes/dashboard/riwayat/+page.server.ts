import { COOKIE_NAME } from '$lib/auth';
import { loadReader } from '$lib/server/reader';
import type { ReaderCollection } from '$lib/reader';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
  const page = Math.min(10000, Math.max(1, Math.floor(Number(url.searchParams.get('page')) || 1)));
  try {
    const collection = await loadReader<ReaderCollection>(fetch, cookies.get(COOKIE_NAME) ?? '', `history?page=${page}`);
    return { collection, readerError: null };
  } catch {
    return {
      collection: { data: [], meta: { page, perPage: 20, total: 0 } } as ReaderCollection,
      readerError: 'Riwayat belum dapat dimuat. Coba lagi.',
    };
  }
};
