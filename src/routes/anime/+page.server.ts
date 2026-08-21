import type { PageServerLoad } from './$types';
import { getAiringToday, getCurrentSeasonTop, getLatestEpisodes, getTopAnime, listAnimeGenres, listAnimeYears } from '$lib/api';

const TOP_LIMIT = 5;
/** The hero carousel shows more than the ranked grids — one anime per slide. */
const SEASON_TOP_LIMIT = 8;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });

  // Filters live in the query string so any result set is a shareable link.
  const genreYear = Number(url.searchParams.get('genreYear'));
  const genre = url.searchParams.get('genre') ?? '';
  const seasonYear = Number(url.searchParams.get('seasonYear'));
  const season = url.searchParams.get('season') ?? '';

  const wantsGenre = Boolean(genre) && Number.isInteger(genreYear);
  const wantsSeason = Boolean(season) && Number.isInteger(seasonYear);

  const [seasonTopRes, latestRes, genresRes, yearsRes, genreRes, seasonRes, airingRes] = await Promise.allSettled([
    getCurrentSeasonTop(SEASON_TOP_LIMIT),
    getLatestEpisodes(TOP_LIMIT),
    listAnimeGenres(),
    listAnimeYears(),
    wantsGenre ? getTopAnime({ year: genreYear, genre, limit: TOP_LIMIT }) : Promise.resolve(null),
    wantsSeason ? getTopAnime({ year: seasonYear, season, limit: TOP_LIMIT }) : Promise.resolve(null),
    getAiringToday(),
  ]);

  const seasonTop = seasonTopRes.status === 'fulfilled' ? seasonTopRes.value : null;

  return {
    currentSeason: seasonTop ? { season: seasonTop.season, year: seasonTop.year } : null,
    seasonTop: seasonTop?.data ?? [],
    latestEpisodes: latestRes.status === 'fulfilled' ? latestRes.value.data : [],
    genres: genresRes.status === 'fulfilled' ? genresRes.value.data : [],
    years: yearsRes.status === 'fulfilled' ? yearsRes.value.data : [],
    genreFilter: { year: Number.isInteger(genreYear) ? genreYear : null, genre },
    seasonFilter: { year: Number.isInteger(seasonYear) ? seasonYear : null, season },
    genreResults: genreRes.status === 'fulfilled' ? (genreRes.value?.data ?? null) : null,
    seasonResults: seasonRes.status === 'fulfilled' ? (seasonRes.value?.data ?? null) : null,
    airingToday: airingRes.status === 'fulfilled' ? airingRes.value.data : [],
    airingDay: airingRes.status === 'fulfilled' ? airingRes.value.day : null,
  };
};
