/**
 * Slug used in /anime/{malId}/{slug} URLs.
 *
 * Purely cosmetic — the malId alone identifies the anime, so a stale or
 * mismatched slug still resolves. That matters because MAL titles contain
 * characters (colons, dots, non-ASCII) that would otherwise break links.
 */
export function animeSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return slug || 'anime';
}

export const ANIME_SEASONS = [
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
] as const;

const DAY_LABEL: Record<string, string> = {
  Sundays: 'Minggu',
  Mondays: 'Senin',
  Tuesdays: 'Selasa',
  Wednesdays: 'Rabu',
  Thursdays: 'Kamis',
  Fridays: 'Jumat',
  Saturdays: 'Sabtu',
};

/** MAL's English plural broadcast day ("Thursdays") in Indonesian ("Kamis"). */
export function airingDayLabel(day: string | null): string | null {
  return day ? (DAY_LABEL[day] ?? day) : null;
}

export function seasonLabel(season: string | null): string {
  if (!season) return '';
  return season.charAt(0).toUpperCase() + season.slice(1);
}

export function formatAirDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
