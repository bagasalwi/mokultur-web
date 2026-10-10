import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { COOKIE_NAME } from '$lib/auth';
import { loadReader } from '$lib/server/reader';
import { INTEREST_OPTIONS, type ReaderCollection, type ReaderInterest } from '$lib/reader';
import type { LayoutServerLoad } from './$types';

type InterestsResponse = { data: ReaderInterest[]; availableInterests: { id: ReaderInterest; label: string }[] };

/**
 * The single gate for the reader's personal space, plus what every tab shows
 * in the header: who they are, what they follow, how much they have saved.
 *
 * Capabilities are read from the API rather than from `locals.user`: the
 * session cookie lives 30 days, so its `role` claim can be a month stale.
 * `/api/auth/me` re-reads the row on every request.
 */
export const load: LayoutServerLoad = async ({ locals, cookies, fetch, url, setHeaders }) => {
  if (!locals.user) {
    throw redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname + url.search)}`);
  }
  setHeaders({ 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' });

  const token = cookies.get(COOKIE_NAME) ?? '';
  let profile = {
    ...locals.user,
    roleName: null as string | null,
    isVerified: false,
    canWrite: false,
    canPublishDirectly: false,
  };

  const [me, interests, saved] = await Promise.all([
    fetch(`${PUBLIC_API_URL}/api/auth/me`, { headers: { cookie: `${COOKIE_NAME}=${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null),
    loadReader<InterestsResponse>(fetch, token, 'interests').catch(() => null),
    loadReader<ReaderCollection>(fetch, token, 'saved?page=1').catch(() => null),
  ]);

  // Fail soft: defaulting canWrite to false means an outage never grants rights.
  if (me?.user) profile = { ...profile, ...me.user };

  return {
    profile,
    interests: interests?.data ?? [],
    availableInterests: interests?.availableInterests ?? INTEREST_OPTIONS,
    savedTotal: saved?.meta.total ?? null,
  };
};
