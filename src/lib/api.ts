import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';

const BASE = browser ? PUBLIC_API_URL : 'http://127.0.0.1:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(8000),
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error ?? 'API error'), { status: res.status });
  }
  return res.json() as Promise<T>;
}

// ---- Articles ----

export interface ArticleMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ArticleListItem {
  format?: 'article' | 'photo-story';
  photoCount?: number;
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  publishDate: string | null;
  viewCount: number | null;
  isReview: boolean;
  reviewScore: string | null;
  author: { id: number; name: string; username: string | null; img: string | null } | null;
  category: { id: number; name: string; slug: string } | null;
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export interface ArticleSingle extends ArticleListItem {
  photoStory?: PhotoStory | null;
  content: string;
  toc: TocItem[];
  updatedAt: string | null;
  tags: { name: string; slug: string }[];
  review: {
    score: string | null;
    summary: string | null;
    pros: string[];
    cons: string[];
    verdict: string | null;
  } | null;
}

export interface ArticleSeo {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  og: { title: string; description: string; image: string | null; type: string; url: string };
  twitter: { card: string; title: string; description: string; image: string | null };
}

export interface PhotoStory {
  coverId: number | null;
  schemaType: 'NewsArticle' | 'Article';
  photos: { galleryId: number; url: string; width: number | null; height: number | null; alt: string; caption: string; credit: string; text: string }[];
}

export function listArticles(params: {
  page?: number;
  perPage?: number;
  category?: string;
  search?: string;
  reviewOnly?: boolean;
  /** 'YYYY-MM' archive month. */
  month?: string;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.category) q.set('category', params.category);
  if (params.search) q.set('search', params.search);
  if (params.reviewOnly) q.set('reviewOnly', 'true');
  if (params.month) q.set('month', params.month);
  return apiFetch<{ data: ArticleListItem[]; meta: ArticleMeta }>(`/api/articles?${q}`);
}

/** Published article count per month ('YYYY-MM'), newest first. */
export function getArticleArchive() {
  return apiFetch<{ data: { month: string; count: number }[] }>('/api/articles/archive');
}

export function getArticle(id: number, slug: string, ifNoneMatch?: string, preview?: string) {
  const q = preview ? `?preview=${encodeURIComponent(preview)}` : '';
  return apiFetch<{
    data: ArticleSingle;
    related: ArticleListItem[];
    relatedIds: number[];
    seo: ArticleSeo;
    jsonLd: object[];
  }>(`/api/articles/${id}/${slug}${q}`, {
    headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {},
  });
}

// ---- Categories ----

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export function listCategories() {
  return apiFetch<{ data: Category[] }>('/api/categories');
}

export type ArticleSort = 'latest' | 'popular';

export function getCategoryArticles(slug: string, page = 1, search?: string, sort: ArticleSort = 'latest', perPage?: number) {
  const q = new URLSearchParams({ page: String(page) });
  if (search) q.set('search', search);
  if (sort === 'popular') q.set('sort', 'popular');
  if (perPage) q.set('perPage', String(perPage));
  return apiFetch<{ data: ArticleListItem[]; meta: ArticleMeta; category: Category; seo: ArticleSeo }>(
    `/api/categories/${slug}/articles?${q}`,
  );
}

// ---- Search ----

export type SearchSort = 'relevance' | 'latest' | 'popular';
export type SearchPeriod = 'week' | 'month' | 'year';

export interface SearchArticle extends ArticleListItem {
  /** Plain text around the first matching word; highlight it client-side. */
  snippet: string | null;
}

export interface SearchEntities {
  topics: { id: string; label: string; href: string }[];
  tags: { name: string; slug: string; count: number }[];
  categories: { name: string; slug: string; count: number }[];
  authors: { name: string; username: string; img?: string | null; count: number }[];
}

export interface SearchResponse {
  query: string;
  tokens: string[];
  /** 'all' = every word matched; 'any' = closest matches; 'phrase' = literal title match. */
  mode: 'all' | 'any' | 'phrase' | 'none';
  didYouMean: string | null;
  data: SearchArticle[];
  meta: ArticleMeta;
  filters: { category?: string; author?: string; tag?: string; period?: SearchPeriod; sort: SearchSort };
  facets: {
    categories: { name: string; slug: string; count: number }[];
    authors: { name: string; username: string; count: number }[];
  };
  entities: SearchEntities | null;
}

export interface SearchParams {
  q: string;
  page?: number;
  perPage?: number;
  sort?: SearchSort;
  period?: SearchPeriod;
  category?: string;
  author?: string;
  tag?: string;
}

export function searchArticles(params: SearchParams, init?: RequestInit) {
  const q = new URLSearchParams({ q: params.q });
  for (const key of ['page', 'perPage', 'sort', 'period', 'category', 'author', 'tag'] as const) {
    const value = params[key];
    if (value !== undefined && value !== '' && !(key === 'sort' && value === 'relevance') && !(key === 'page' && value === 1)) {
      q.set(key, String(value));
    }
  }
  return apiFetch<SearchResponse>(`/api/search?${q}`, init);
}

export interface SearchSuggestions extends SearchEntities {
  query: string;
  total?: number;
  articles: { id: number; slug: string; title: string; image: string | null; category: string | null; publishDate: string | null }[];
}

/**
 * Called per keystroke from the browser, so it skips apiFetch's JSON
 * content-type: a plain GET needs no CORS preflight, halving the round trips.
 */
export async function searchSuggest(q: string, signal?: AbortSignal): Promise<SearchSuggestions> {
  const res = await fetch(`${BASE}/api/search/suggest?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw Object.assign(new Error('Saran gagal dimuat'), { status: res.status });
  return res.json() as Promise<SearchSuggestions>;
}

export function getTrendingSearches() {
  return apiFetch<{ data: string[] }>('/api/search/trending');
}

// ---- Tags ----

export interface Tag {
  name: string;
  slug: string;
  count?: number;
}

export function getPopularTags(limit = 15) {
  return apiFetch<{ data: Tag[] }>(`/api/tags/popular?limit=${limit}`);
}

export function getTagArticles(slug: string, page = 1) {
  // `redirect` is set when the slug is an old or variant spelling of a live tag.
  return apiFetch<{ data: ArticleListItem[]; meta: ArticleMeta; tag: { name: string; slug: string }; seo: ArticleSeo; redirect?: string }>(
    `/api/tags/${encodeURIComponent(slug)}/articles?page=${page}`,
  );
}

// ---- Users ----

export interface Writer {
  id: number;
  name: string;
  username: string | null;
  img: string | null;
  description: string | null;
  instagram: string | null;
  facebook: string | null;
  role: string;
  totalArticles: number;
  totalViews: number;
  latestPublishDate: string | null;
  /** Their most-used categories, most first. */
  beats?: WriterBeat[];
  articles30d?: number;
  latestArticle?: { id: number; slug: string; title: string; image: string | null; publishDate: string | null } | null;
}

export interface WriterBeat {
  name: string;
  slug: string;
  count: number;
}

export function listWriters(page = 1, perPage = 12) {
  return apiFetch<{ data: Writer[]; meta: ArticleMeta }>(`/api/users/writers?page=${page}&perPage=${perPage}`);
}

export type ProfileSort = 'latest' | 'popular';

export function getUserProfile(username: string, page = 1, sort: ProfileSort = 'latest') {
  const q = new URLSearchParams({ page: String(page) });
  if (sort === 'popular') q.set('sort', 'popular');
  return apiFetch<{
    user: Writer & { createdAt: string | null };
    stats: { totalArticles: number; totalViews: number; totalLikes: number };
    latestPublishDate: string | null;
    beats: WriterBeat[];
    achievements: string[];
    articles: { data: ArticleListItem[]; meta: ArticleMeta; sort: ProfileSort };
  }>(`/api/users/${encodeURIComponent(username)}/profile?${q}`);
}

// ---- Social Media ----

export interface SocialMediaItem {
  id: number;
  platform: string;
  username: string;
  url: string;
  icon: string | null;
  followers: string | null;
  order: number;
}

export function getSocialMedia() {
  return apiFetch<{ data: SocialMediaItem[] }>('/api/social-media');
}

// ---- Popular Articles ----

export type PopularRange = 'today' | 'week' | 'month' | 'all';

export function getPopularArticles(limit = 5, range: PopularRange = 'week', category?: string) {
  const q = new URLSearchParams({ limit: String(limit), range });
  if (category) q.set('category', category);
  return apiFetch<{ data: ArticleListItem[]; range: PopularRange }>(`/api/articles/popular?${q}`);
}

// ---- Settings ----

export interface SiteSettings {
  primary_color: string | null;
  dark_color: string | null;
  site_name: string | null;
  site_description: string | null;
  site_logo: string | null;
  accent_glow: string | null;
  badge_text_color: string | null;
  navbar_bg: string | null;
  navbar_text: string | null;
  primary_contrast: string | null;
  card_style: string | null;
  hero_type: string | null;
  article_detail_style: string | null;
  event_section_style: string | null;
  tech_section_style: string | null;
  navbar_style: string | null;
  /** Terbaru on the homepage: 'card-grid' (follows card_style) or 'news-list'. */
  latest_section_style: string | null;
  /** Homepage section order: 'news-first' or 'classic'. */
  home_layout: string | null;
  /** Homepage anime block: 'trio' (three columns) or 'poster-rail'. */
  anime_section_style: string | null;
  anime_enabled: boolean;
  quiz_enabled: boolean;
  event_enabled: boolean;
  ai_chat_enabled: boolean;
  ai_chat_title: string | null;
  ai_chat_greeting: string | null;
  ai_chat_placeholder: string | null;
  ai_chat_suggestions: string | null;
  site_favicon: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  curhat_enabled: boolean;
  google_analytics: string | null;
  adsense_enabled: boolean;
  adsense_publisher_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image: string | null;
  /** Mokultur's publication page on Google News, when set in Site Settings. */
  google_news_url?: string | null;
}

export function getSettings() {
  return apiFetch<{ data: SiteSettings }>('/api/settings');
}

// ---- Navbar ----

export interface NavbarItem {
  navName: string;
  navTarget: string;
}

export function getNavbar(type: 'header' | 'footer', limit = 10) {
  return apiFetch<{ data: NavbarItem[] }>(`/api/navbar?type=${type}&limit=${limit}`);
}

// ---- Bio Links ----

export interface BioLink {
  id: number;
  name: string;
  url: string;
  image: string | null;
}

export function getBioLinks() {
  return apiFetch<{ data: BioLink[] }>('/api/bio-links');
}

// ---- Media Partners ----

export interface MediaPartner {
  id: number;
  name: string;
  link: string | null;
  description: string | null;
  logo: string | null;
  industry: string | null;
  featured: boolean;
  type: number;
}

export interface MediaPartnerSection {
  type: number;
  label: string;
  eyebrow: string;
  description: string;
  partners: MediaPartner[];
}

export interface MediaPartnerStats {
  total: number;
  media: number;
  paid: number;
  invitational: number;
}

export function getMediaPartners() {
  return apiFetch<{
    featured: MediaPartner[];
    sections: MediaPartnerSection[];
    stats: MediaPartnerStats;
  }>('/api/media-partners');
}

// ---- Ads ----

export interface AdItem {
  id: number;
  title: string;
  image: string;
  imageMobile: string | null;
  url: string | null;
  slot: string;
}

export function getAd(slot: string, preview = false): Promise<{ data: AdItem | null } | null> {
  const url = preview ? `/api/ads/slot/${slot}?preview_ads=true` : `/api/ads/slot/${slot}`;
  // An empty slot now answers 200 with data:null; the catch stays for genuine
  // transport failures.
  return apiFetch<{ data: AdItem | null }>(url).catch(() => null);
}

// ── Curhatan ──────────────────────────────────────────────────────────────

export interface CurhatanItem {
  id: number;
  curhatan: string;
  curhatanDari: string;
  userId: number | null;
  cardColor: string;
  gambar: string | null;
  like: number;
  view: number;
  createdAt: string | null;
}

export interface CurhatanMeta {
  total: number;
  hasMore: boolean;
  nextCursor: number | null;
}

export function listCurhatan(params?: {
  filter?: string;
  cursor?: number;
  perPage?: number;
}): Promise<{ data: CurhatanItem[]; meta: CurhatanMeta }> {
  const q = new URLSearchParams();
  if (params?.filter) q.set('filter', params.filter);
  if (params?.cursor != null) q.set('cursor', String(params.cursor));
  if (params?.perPage) q.set('perPage', String(params.perPage));
  return apiFetch<{ data: CurhatanItem[]; meta: CurhatanMeta }>(`/api/curhatan?${q}`);
}

export function getCurhatan(id: number): Promise<{ data: CurhatanItem; related: CurhatanItem[] }> {
  return apiFetch<{ data: CurhatanItem; related: CurhatanItem[] }>(`/api/curhatan/${id}`);
}

export async function submitCurhatan(body: FormData): Promise<{ success: boolean; data?: CurhatanItem; error?: string }> {
  const BASE = (typeof window !== 'undefined' ? '' : (process.env.PUBLIC_API_URL ?? ''));
  const res = await fetch(`${BASE}/api/curhatan`, { method: 'POST', body });
  return res.json();
}

export async function upvoteCurhatan(id: number): Promise<{ success: boolean; likes: number }> {
  const BASE = (typeof window !== 'undefined' ? '' : (process.env.PUBLIC_API_URL ?? ''));
  const res = await fetch(`${BASE}/api/curhatan/${id}/upvote`, { method: 'POST' });
  return res.json();
}

export async function laporCurhatan(id: number, laporan: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const BASE = (typeof window !== 'undefined' ? '' : (process.env.PUBLIC_API_URL ?? ''));
  const res = await fetch(`${BASE}/api/curhatan/${id}/lapor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ laporan }),
  });
  return res.json();
}

// ── Static Pages ──────────────────────────────────────────────────────────────

export interface PageItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export function getPage(id: number): Promise<{ data: PageItem }> {
  return apiFetch<{ data: PageItem }>(`/api/pages/${id}`);
}

export function listPages(): Promise<{ data: Pick<PageItem, 'id' | 'name' | 'slug'>[] }> {
  return apiFetch<{ data: Pick<PageItem, 'id' | 'name' | 'slug'>[] }>('/api/pages');
}

// ── Instagram Reels ───────────────────────────────────────────────────────────

export interface Reel {
  id: number;
  shortcode: string;
  permalink: string;
  thumbnail: string | null;
  caption: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  postedAt: string | null;
}

export interface IgProfile {
  username: string;
  fullName: string | null;
  avatar: string | null;
  followers: number;
  totalPosts: number;
  isVerified: boolean;
}

export function listReels(): Promise<{ profile: IgProfile | null; data: Reel[] }> {
  return apiFetch<{ profile: IgProfile | null; data: Reel[] }>('/api/reels');
}


// ── Events ────────────────────────────────────────────────────────────────────

export type EventStatus = 'upcoming' | 'ongoing' | 'done' | 'postponed' | 'cancelled';
export type EventFilter = 'upcoming' | 'past' | 'all';

/**
 * Named EventItem, not Event: `Event` is a DOM global that components already
 * use in their handler signatures, and shadowing it produces type errors that
 * read like nonsense.
 */
export interface EventItem {
  slug: string;
  name: string;
  poster: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  /** "HH:MM", WIB. */
  endTime: string | null;
  location: string | null;
  city: string | null;
  ticketUrl: string | null;
  /** Free text from the editor: "Mulai Rp75.000", "Gratis". */
  priceLabel: string | null;
  status: EventStatus;
  /** Whole days until it opens; negative once it has started. */
  daysUntil: number | null;
}

export interface EventArticle {
  format?: 'article' | 'photo-story';
  photoCount?: number;
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  publishDate: string | null;
  catName: string | null;
  catSlug: string | null;
  authorName: string | null;
}

export interface EventDetail extends EventItem {
  description: string | null;
  endDateEffective: string;
  organizer: string | null;
  /** Handle without the @. */
  organizerInstagram: string | null;
  address: string | null;
  mapsUrl: string | null;
  articles: EventArticle[];
}

export function listEvents(filter: EventFilter = 'upcoming', limit = 50) {
  return apiFetch<{ data: EventItem[]; filter: EventFilter; today: string }>(
    `/api/events?filter=${filter}&limit=${limit}`
  );
}

export function getEvent(slug: string) {
  return apiFetch<{ data: EventDetail }>(`/api/events/${encodeURIComponent(slug)}`);
}

// ── Talents ───────────────────────────────────────────────────────────────────

export type TalentTier = 'verified' | 'general' | 'partner';

/** Derived server-side so the listing, detail page and share image always agree. */
export interface TalentBadge {
  id: string;
  label: string;
  icon: string;
  tone: 'primary' | 'accent' | 'muted';
}

export interface TalentListItem {
  slug: string;
  alias: string;
  tagline: string | null;
  bioShort: string | null;
  avatar: string;
  themeColor: string;
  instagramUsername: string | null;
  igFollowers: number;
  talentTier: TalentTier;
  isFeatured: boolean;
  collabCount: number;
  badges: TalentBadge[];
}

export interface TalentStats {
  talentCount: number;
  totalFollowers: number;
  totalReels: number;
}

/** Platform, display name and icon all resolved server-side. */
export interface TalentSocialLink {
  platform: 'instagram' | 'youtube' | 'x' | 'facebook' | 'threads' | 'other';
  platformLabel: string;
  icon: string;
  label: string;
  url: string;
}

/** A reel made with Mokultur. Title falls back to the scraped caption. */
export interface TalentReel {
  url: string;
  title: string | null;
  thumbnail: string | null;
  viewCount: number;
  likeCount: number;
  postedAt: string | null;
}

export interface TalentRate {
  label: string;
  price: number | null;
  currency: string;
  unit: string | null;
  notes: string | null;
}

export interface TalentWork {
  slug: string;
  title: string;
  client: string | null;
  type: string | null;
  url: string | null;
  thumbnail: string | null;
  description: string | null;
  publishedAt: string | null;
}

export interface TalentDetail extends TalentListItem {
  realName: string;
  heroImage: string | null;
  instagram: { username: string; url: string; followers: number; syncedAt: string | null } | null;
  contact: { label: string | null; url: string | null } | null;
  achievements: { slug: string; title: string; year: number; description: string | null }[];
  socialLinks: TalentSocialLink[];
  gallery: { slug: string; url: string; caption: string; year: number; width: number | null; height: number | null }[];
  works: TalentWork[];
  rates: TalentRate[];
  schedule: { slug: string; eventName: string; date: string; status: string; location: string }[];
  collabReels: TalentReel[];
}

export function listTalents(): Promise<{ data: TalentListItem[]; featured: TalentListItem[]; stats: TalentStats }> {
  return apiFetch<{ data: TalentListItem[]; featured: TalentListItem[]; stats: TalentStats }>('/api/talents');
}

export function getTalent(slug: string): Promise<{ data: TalentDetail }> {
  return apiFetch<{ data: TalentDetail }>(`/api/talents/${encodeURIComponent(slug)}`);
}

// ── Anime ─────────────────────────────────────────────────────────────────────

export interface AnimeGenreOption {
  slug: string;
  name: string;
}

export interface AnimeCard {
  malId: number;
  title: string;
  titleEn: string | null;
  image: string | null;
  score: number | null;
  rank: number | null;
  popularity: number | null;
  mediaType: string | null;
  numEpisodes: number | null;
  season: string | null;
  seasonYear: number | null;
  airing: boolean;
  broadcastTime: string | null;
  /** Same slot converted to WIB by the API, day shift included. */
  broadcastTimeWib: string | null;
  malUrl: string;
  genres: AnimeGenreOption[];
}

export interface AnimeEpisodeCard extends AnimeCard {
  latestEpisode: { number: number; title: string | null; airedAt: string | null; url: string | null };
}

export interface AnimeDetail extends AnimeCard {
  synopsis: string | null;
  status: string | null;
  broadcast: { day: string | null; time: string | null } | null;
  studios: string[];
  episodes: { number: number; title: string | null; airedAt: string | null; url: string | null; filler: boolean; recap: boolean }[];
  cachedAt: string | null;
}

export interface SeasonIndexItem {
  year: number;
  season: string;
  total: number;
}

export interface TasteProfile {
  id: string;
  label: string;
  blurb: string;
}

export type TasteAnswers = {
  mood: number;
  pace: number;
  world: number;
  heart: number;
  stakes: number;
  humor: number;
  fame: number;
  length: number;
  era: number;
};

export function getAnimeTaste(answers: TasteAnswers) {
  const q = new URLSearchParams(
    Object.entries(answers).map(([k, v]) => [k, String(v)])
  );
  return apiFetch<{ profile: TasteProfile; answers: TasteAnswers; poolSize: number; data: AnimeCard[] }>(
    `/api/anime/taste?${q}`
  );
}

export function listAnimeSeasons() {
  return apiFetch<{ data: SeasonIndexItem[] }>('/api/anime/seasons');
}

export function getAnimeSeason(year: number, season: string) {
  return apiFetch<{ year: number; season: string; total: number; data: AnimeCard[] }>(
    `/api/anime/season/${year}/${encodeURIComponent(season)}`
  );
}

export function getCurrentSeasonTop(limit = 5): Promise<{ season: string; year: number; data: AnimeCard[] }> {
  return apiFetch<{ season: string; year: number; data: AnimeCard[] }>(`/api/anime/season/current/top?limit=${limit}`);
}

/**
 * URL of the server-rendered 1080×1350 share image for a top-5 list.
 *
 * Points straight at the API rather than proxying through SvelteKit: the
 * endpoint already sends content-disposition: attachment, so a plain link
 * downloads it.
 */
export function animeShareImageUrl(params: {
  list: 'season' | 'episodes' | 'genre' | 'season-year';
  year?: number | null;
  genre?: string | null;
  season?: string | null;
  count?: 3 | 5;
}): string {
  const q = new URLSearchParams({ list: params.list });
  if (params.year) q.set('year', String(params.year));
  if (params.genre) q.set('genre', params.genre);
  if (params.season) q.set('season', params.season);
  if (params.count === 3) q.set('count', '3');

  return `${BASE}/api/anime/share.png?${q}`;
}

export function getAiringToday(): Promise<{ day: string; timezone: string; data: AnimeCard[] }> {
  return apiFetch<{ day: string; timezone: string; data: AnimeCard[] }>('/api/anime/airing/today');
}

export function getLatestEpisodes(limit = 5): Promise<{ data: AnimeEpisodeCard[] }> {
  return apiFetch<{ data: AnimeEpisodeCard[] }>(`/api/anime/episodes/latest?limit=${limit}`);
}

export function getTopAnime(params: { year: number; season?: string; genre?: string; limit?: number }) {
  const q = new URLSearchParams({ year: String(params.year), limit: String(params.limit ?? 5) });
  if (params.season) q.set('season', params.season);
  if (params.genre) q.set('genre', params.genre);
  return apiFetch<{
    year: number;
    season: string | null;
    genre: AnimeGenreOption | string | null;
    data: AnimeCard[];
    /** True when the year was never cached and a sync has just been queued. */
    syncing?: boolean;
  }>(`/api/anime/top?${q}`);
}

export function listAnimeGenres(): Promise<{ data: AnimeGenreOption[] }> {
  return apiFetch<{ data: AnimeGenreOption[] }>('/api/anime/genres');
}

/** `data` is the full selectable range; `available` is what is already cached. */
export function listAnimeYears(): Promise<{ data: number[]; available: number[] }> {
  return apiFetch<{ data: number[]; available: number[] }>('/api/anime/years');
}

export function getAnime(malId: number): Promise<{ data: AnimeDetail }> {
  return apiFetch<{ data: AnimeDetail }>(`/api/anime/${malId}`);
}
