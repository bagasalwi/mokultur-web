/**
 * Shared display formatters.
 *
 * These lived as 13 copies of `timeAgo` and 16 of `imgFallback` scattered
 * across components and routes. The copies had drifted into eight distinct
 * behaviours — some capped at "36 bulan lalu", some fell back to an absolute
 * date after a year, one parsed the date in a way that shifted it by a
 * timezone. The versions below are the most complete of each, so a few callers
 * gain the year cutoff they were missing.
 */

const FALLBACK_IMAGE = '/images/noimage.png';

/**
 * Relative date in Indonesian, falling back to an absolute date past a year.
 *
 * The date is split into parts rather than passed to `new Date(string)`: the
 * API sends "YYYY-MM-DD HH:mm:ss" with no zone, which the string constructor
 * reads as UTC and can render as the previous day for readers east of it.
 *
 * `emptyLabel` covers callers that want something other than blank for a post
 * with no publish date (the author dashboard shows "Belum publish").
 */
export function timeAgo(d: string | null | undefined, emptyLabel = ''): string {
  if (!d) return emptyLabel;

  const [year, month, day] = d.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return emptyLabel;

  const date = new Date(year, month - 1, day);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  // Scheduled posts sit in the future; they read as today rather than negative.
  if (days <= 0) return 'Hari ini';
  if (days === 1) return 'Kemarin';
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `on:error` handler swapping a broken image for the placeholder. */
export function imgFallback(e: Event) {
  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
}

/** Compact Indonesian count: 169.161 → "169 rb", 1.2M → "1,2 jt". */
export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (n >= 10_000) return `${Math.round(n / 1000).toLocaleString('id-ID')} rb`;
  return n.toLocaleString('id-ID');
}
