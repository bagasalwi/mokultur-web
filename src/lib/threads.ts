import { PUBLIC_API_URL } from '$env/static/public';

export type Thread = {
  id: number;
  slug: string;
  title: string | null;
  body: string | null;
  imagePath: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
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
  authorUsername: string | null;
  authorImg: string | null;
};

export type ThreadReply = {
  id: number;
  body: string;
  status: string;
  parentReplyId: number | null;
  createdAt: string | null;
  authorId: number | null;
  authorName: string | null;
  authorUsername: string | null;
  authorImg: string | null;
};

export type ThreadDetail = Thread & { replies: ThreadReply[] };

export type AnimeOption = {
  id: number;
  malId: number;
  title: string;
  season: string | null;
  seasonYear: number | null;
  picture: string | null;
};

type FetchFn = typeof fetch;

export async function fetchThreads(
  fetch: FetchFn,
  opts: { page?: number; perPage?: number; animeId?: number } = {},
): Promise<{ data: Thread[]; meta: { total: number; page: number; perPage: number; hasMore: boolean } }> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.perPage) params.set('perPage', String(opts.perPage));
  if (opts.animeId) params.set('animeId', String(opts.animeId));

  const qs = params.toString();
  const res = await fetch(`${PUBLIC_API_URL}/api/threads${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`Threads list ${res.status}`);
  return res.json();
}

export async function fetchThread(fetch: FetchFn, id: number): Promise<ThreadDetail | null> {
  const res = await fetch(`${PUBLIC_API_URL}/api/threads/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Thread ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchTopThreads(fetch: FetchFn, limit = 5): Promise<Thread[]> {
  const res = await fetch(`${PUBLIC_API_URL}/api/threads/top?limit=${limit}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

export async function fetchAnimeOptions(fetch: FetchFn): Promise<AnimeOption[]> {
  const res = await fetch(`${PUBLIC_API_URL}/api/threads/anime-options`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

export function authorHandle(
  t: { authorUsername?: string | null; authorId?: number | null } | null | undefined,
): string {
  if (!t) return 'user';
  return t.authorUsername || (t.authorId ? `u${t.authorId}` : 'user');
}

export function threadUrl(t: {
  id: number;
  authorUsername?: string | null;
  authorId?: number | null;
}): string {
  return `/threads/@${authorHandle(t)}/${t.id}`;
}

export function imgUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${PUBLIC_API_URL}${path}`;
  // legacy Laravel storage path
  if (path.startsWith('storage/') || path.startsWith('/storage/')) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `https://mokultur.com${p}`;
  }
  return path;
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
