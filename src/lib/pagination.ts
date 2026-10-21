import { redirect } from '@sveltejs/kit';

export function pageNumber(value: string | null): number | null {
  if (value === null) return 1;
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

/**
 * The page a listing URL asks for, sending every other spelling of it to the
 * one canonical URL with a 301:
 *
 *   ?page=0, ?page=1, ?page=-2, ?page=abc, ?page=  →  no ?page at all
 *   ?page=02                                     →  ?page=2
 *   ?<legacy>=3 (an old parameter name)          →  ?page=3
 *
 * Those used to answer 404, and a stray `?page=0` link put several of them in
 * Search Console. A page past the last one is still the caller's 404: that
 * needs the total, which only the listing knows.
 */
export function listingPage(url: URL, legacy?: string): number {
  const legacyValue = legacy ? url.searchParams.get(legacy) : null;
  const raw = url.searchParams.get('page') ?? legacyValue;
  if (raw === null) return 1;
  const page = /^\d+$/.test(raw) ? Number(raw) : NaN;
  const valid = Number.isSafeInteger(page) && page > 1;
  if (valid && String(page) === raw && legacyValue === null) return page;

  const query = new URLSearchParams(url.searchParams);
  query.delete('page');
  if (legacy) query.delete(legacy);
  if (valid) query.set('page', String(page));
  redirect(301, `${url.pathname}${query.size ? `?${query}` : ''}`);
}

export function paginationPath(pathname: string, page: number): string {
  return page > 1 ? `${pathname}?page=${page}` : pathname;
}

export function paginationTotal(meta: { total: number; perPage: number }): number {
  return Math.max(1, Math.ceil(meta.total / meta.perPage));
}
