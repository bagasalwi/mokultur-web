import type { ArticleListItem } from './api';

export type ReaderInterest = 'anime' | 'manga' | 'game' | 'film' | 'music' | 'tech' | 'cosplay' | 'jepang' | 'event';
export type ReaderArticleState = {
  postId: number; bookmarkedAt: string | null; lastReadAt: string | null; revision: number;
};
export type ReaderArticle = ArticleListItem & { reader: ReaderArticleState; reason?: string };
export type ReaderCollection = { data: ReaderArticle[]; meta: { page: number; perPage: number; total: number } };
export type ReaderFeed = {
  data: ReaderArticle[]; interests: ReaderInterest[]; availableInterests: { id: ReaderInterest; label: string }[];
  meta: { page: number; perPage: number; hasMore: boolean; asOf: string };
};
export const INTEREST_OPTIONS: { id: ReaderInterest; label: string }[] = [
  { id: 'anime', label: 'Anime' }, { id: 'manga', label: 'Manga' }, { id: 'game', label: 'Game' },
  { id: 'film', label: 'Film' }, { id: 'music', label: 'Musik' }, { id: 'tech', label: 'Tech' },
  { id: 'cosplay', label: 'Cosplay' }, { id: 'jepang', label: 'Jepang' }, { id: 'event', label: 'Event' },
];
/**
 * Which reader interest a category belongs to, if any. Mirrors the alias lists
 * in mokultur-elysia/src/modules/reader/model.ts (INTERESTS) — keep them equal.
 */
const INTEREST_ALIASES: Record<ReaderInterest, string[]> = {
  anime: ['anime', 'animation'],
  manga: ['manga', 'manhwa', 'manhua'],
  game: ['game', 'games', 'gaming', 'esports', 'e-sports'],
  film: ['film', 'movie', 'movies', 'cinema', 'series'],
  music: ['music', 'musik', 'jpop', 'j-pop', 'j-rock', 'idol'],
  tech: ['tech', 'technology', 'teknologi'],
  cosplay: ['cosplay', 'cosplayer'],
  jepang: ['jepang', 'japan', 'japanese', 'know-your-culture'],
  event: ['event', 'events', 'press-release', 'convention'],
};

export function interestForCategory(slug: string | null | undefined): ReaderInterest | null {
  const key = (slug ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  const hit = (Object.keys(INTEREST_ALIASES) as ReaderInterest[]).find((id) => INTEREST_ALIASES[id].includes(key));
  return hit ?? null;
}

export function emptyReaderState(postId: number): ReaderArticleState {
  return { postId, bookmarkedAt: null, lastReadAt: null, revision: 0 };
}
export function articleHref(article: Pick<ArticleListItem, 'id' | 'slug'>) {
  return `/article/${article.id}/${article.slug}`;
}
export class ReaderError extends Error {
  constructor(message: string, public status: number, public state?: ReaderArticleState) { super(message); }
}
export async function readerRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api/reader/${path}`, {
    method, headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ReaderError(result.error ?? 'Koneksi bermasalah. Coba lagi.', response.status, result.data);
  return result;
}
