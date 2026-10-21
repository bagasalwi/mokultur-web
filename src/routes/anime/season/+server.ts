import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const trailingSlash = 'ignore';

const SEASONS = new Set(['winter', 'spring', 'summer', 'fall']);

/**
 * The Laravel frontend's season page, /anime/season?season=winter&year=2026.
 * Nothing links to it any more, but Google still crawls it and got a 404 for
 * every season and page. /anime/musim is its replacement: a known season and
 * year go to that season's page, anything else to the index. `page` is
 * dropped; the new season page is a single list.
 */
export const GET: RequestHandler = ({ url }) => {
  const season = url.searchParams.get('season')?.toLowerCase() ?? '';
  const year = Number(url.searchParams.get('year'));
  if (SEASONS.has(season) && Number.isInteger(year) && year >= 1917 && year <= 2100) {
    throw redirect(301, `/anime/musim/${year}/${season}`);
  }
  throw redirect(301, '/anime/musim');
};
