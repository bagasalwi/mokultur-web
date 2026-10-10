import { PUBLIC_API_URL } from '$env/static/public';
import { COOKIE_NAME } from '$lib/auth';

/**
 * GET an `/api/me/*` endpoint as the signed-in reader. Returns null on any
 * failure so each dashboard block can show its own empty state instead of
 * taking the whole page down.
 */
export async function meGet<T>(fetcher: typeof fetch, token: string, path: string): Promise<T | null> {
  try {
    const res = await fetcher(`${PUBLIC_API_URL}/api/me/${path}`, {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export type MeSummary = { total: number; published: number; drafts: number; views: number };

export type MeActivity = {
  type: 'comment' | 'like';
  id: number;
  createdAt: string | null;
  postId: number;
  postTitle: string | null;
  postSlug: string | null;
  excerpt: string | null;
};
