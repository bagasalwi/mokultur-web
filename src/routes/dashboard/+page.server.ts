import { PUBLIC_API_URL } from '$env/static/public';
import { COOKIE_NAME } from '$lib/auth';
import type { PageServerLoad } from './$types';

export type MeSummary = {
  total: number;
  published: number;
  drafts: number;
  views: number;
};

export type MeActivity = {
  type: 'comment' | 'like';
  id: number;
  createdAt: string | null;
  postId: number;
  postTitle: string | null;
  postSlug: string | null;
  excerpt: string | null;
};

export const load: PageServerLoad = async ({ parent, cookies, fetch }) => {
  const { profile } = await parent();
  const token = cookies.get(COOKIE_NAME) ?? '';
  const headers = { cookie: `${COOKIE_NAME}=${token}` };

  const get = async <T>(path: string): Promise<T | null> => {
    try {
      const res = await fetch(`${PUBLIC_API_URL}${path}`, { headers });
      return res.ok ? ((await res.json()) as T) : null;
    } catch {
      // Each card renders its own empty state, so one dead endpoint costs one
      // card rather than the page.
      return null;
    }
  };

  const [summary, activity] = await Promise.all([
    // Only writers have articles; asking for a summary of nothing is a wasted
    // round trip on every reader's dashboard.
    profile.canWrite ? get<MeSummary>('/api/me/summary') : Promise.resolve(null),
    get<{ data: MeActivity[] }>('/api/me/activity'),
  ]);

  return {
    summary,
    activity: activity?.data ?? [],
  };
};
