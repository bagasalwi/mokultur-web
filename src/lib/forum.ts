import { PUBLIC_API_URL } from '$env/static/public';

export type ForumThread = {
  id: number;
  slug: string;
  title: string;
  body: string | null;
  status: string;
  isPinned: boolean | number;
  viewCount: number;
  replyCount: number;
  lastReplyAt: string | null;
  createdAt: string | null;
  animeId: number | null;
  animeMalId: number | null;
  animeTitle: string | null;
  animeImg: string | null;
  authorId: number | null;
  authorName: string | null;
  authorImg: string | null;
};

export type ForumReply = {
  id: number;
  body: string;
  status: string;
  parentReplyId: number | null;
  createdAt: string | null;
  authorId: number | null;
  authorName: string | null;
  authorImg: string | null;
};

export type ForumThreadDetail = ForumThread & { replies: ForumReply[] };

export type AnimeOption = {
  id: number;
  malId: number;
  title: string;
  season: string | null;
  seasonYear: number | null;
  picture: string | null;
};

type FetchFn = typeof fetch;

export async function fetchForumThreads(
  fetch: FetchFn,
  opts: { page?: number; perPage?: number; animeId?: number } = {},
): Promise<{ data: ForumThread[]; meta: { total: number; page: number; perPage: number; hasMore: boolean } }> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.perPage) params.set('perPage', String(opts.perPage));
  if (opts.animeId) params.set('animeId', String(opts.animeId));

  const res = await fetch(`${PUBLIC_API_URL}/api/forum/threads?${params}`);
  if (!res.ok) throw new Error(`Forum list ${res.status}`);
  return res.json();
}

export async function fetchForumThread(fetch: FetchFn, slug: string): Promise<ForumThreadDetail | null> {
  const res = await fetch(`${PUBLIC_API_URL}/api/forum/threads/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Forum thread ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchAnimeOptions(fetch: FetchFn): Promise<AnimeOption[]> {
  const res = await fetch(`${PUBLIC_API_URL}/api/forum/anime-options`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

export function formatRelative(input: string | null): string {
  if (!input) return '';
  const d = new Date(input);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}d lalu`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}h lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
