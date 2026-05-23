import { PUBLIC_API_URL } from '$env/static/public';

const BASE = PUBLIC_API_URL;

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

export function listArticles(params: {
  page?: number;
  perPage?: number;
  category?: string;
  search?: string;
  reviewOnly?: boolean;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.category) q.set('category', params.category);
  if (params.search) q.set('search', params.search);
  if (params.reviewOnly) q.set('reviewOnly', 'true');
  return apiFetch<{ data: ArticleListItem[]; meta: ArticleMeta }>(`/api/articles?${q}`);
}

export function getArticle(id: number, slug: string, ifNoneMatch?: string) {
  return apiFetch<{
    data: ArticleSingle;
    related: ArticleListItem[];
    relatedIds: number[];
    seo: ArticleSeo;
    jsonLd: object[];
  }>(`/api/articles/${id}/${slug}`, {
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

export function getCategoryArticles(slug: string, page = 1, search?: string) {
  const q = new URLSearchParams({ page: String(page) });
  if (search) q.set('search', search);
  return apiFetch<{ data: ArticleListItem[]; meta: ArticleMeta; category: Category; seo: ArticleSeo }>(
    `/api/categories/${slug}/articles?${q}`,
  );
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
  return apiFetch<{ data: ArticleListItem[]; meta: ArticleMeta; tag: { name: string; slug: string }; seo: ArticleSeo }>(
    `/api/tags/${slug}/articles?page=${page}`,
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
}

export function listWriters(page = 1, perPage = 12) {
  return apiFetch<{ data: Writer[]; meta: ArticleMeta }>(`/api/users/writers?page=${page}&perPage=${perPage}`);
}

export function getUserProfile(username: string, page = 1) {
  return apiFetch<{
    user: Writer & { createdAt: string | null };
    stats: { totalArticles: number; totalViews: number; totalLikes: number };
    achievements: string[];
    articles: { data: ArticleListItem[]; meta: ArticleMeta };
  }>(`/api/users/${username}/profile?page=${page}`);
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

export function getPopularArticles(limit = 5) {
  return apiFetch<{ data: ArticleListItem[] }>(`/api/articles/popular?limit=${limit}`);
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
  site_favicon: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  curhat_enabled: boolean;
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

export function getAd(slot: string, preview = false): Promise<{ data: AdItem } | null> {
  const url = preview ? `/api/ads/slot/${slot}?preview_ads=true` : `/api/ads/slot/${slot}`;
  return apiFetch<{ data: AdItem }>(url).catch(() => null);
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

