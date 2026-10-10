<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { AnimeCard } from '$lib/api';
  import { airingDayLabel, seasonLabel } from '$lib/anime';
  import SectionHead from '$components/ui/SectionHead.svelte';
  import AiringCard from '$components/anime/AiringCard.svelte';
  import TastePromoCard from '$components/anime/TastePromoCard.svelte';

  /**
   * Homepage anime block, "Rak Poster" style: the season's top titles as a
   * shelf of posters, with today's schedule and the quiz in a side column.
   * One heading for the whole block instead of one per piece.
   */
  export let season: AnimeCard[] = [];
  export let seasonName: string | null = null;
  export let year: number | null = null;
  export let airing: AnimeCard[] = [];
  export let day: string | null = null;
  export let showQuiz = true;

  $: posters = season.slice(0, 8);
  $: schedule = airing.slice(0, 5);
  $: dayLabel = airingDayLabel(day);
  $: seasonText = seasonName && year ? `${seasonLabel(seasonName)} ${year}` : 'musim ini';
  $: hasAside = schedule.length > 0 || showQuiz;

  const meta = (a: AnimeCard) =>
    [a.mediaType ? a.mediaType.toUpperCase() : null, a.numEpisodes ? `${a.numEpisodes} eps` : null].filter(Boolean).join(' · ');
</script>

<section class="anime-rail" aria-labelledby="home-anime-heading">
  <div class="container-xl">
    <SectionHead title="Anime" headingId="home-anime-heading" sub={posters.length ? `Yang terbaik ${seasonText}, skor tertinggi di MyAnimeList.` : 'Jadwal tayang dan kuis anime.'}>
      <a slot="action" href="/anime" class="theme-btn theme-btn--see-all theme-btn--sm flex-shrink-0">
        Lihat Semua <i class="bi bi-arrow-right" aria-hidden="true"></i>
      </a>
    </SectionHead>

    <div class="anime-rail__grid" class:anime-rail__grid--solo={!posters.length || !hasAside}>
      {#if posters.length}
        <ol class="anime-rail__shelf">
          {#each posters as anime (anime.malId)}
            <li>
              <a class="anime-rail__poster" href={anime.malUrl} target="_blank" rel="noopener">
                <span class="anime-rail__art">
                  {#if anime.image}
                    <img src={imgUrl(anime.image, 320)} srcset={imgSrcset(anime.image, 210)} sizes="(max-width: 991px) 38vw, 210px" alt="" loading="lazy" decoding="async" />
                  {/if}
                  {#if anime.score !== null}
                    <span class="anime-rail__score" aria-label={`Skor MyAnimeList ${anime.score.toFixed(2)}`}>{anime.score.toFixed(2)}</span>
                  {/if}
                </span>
                <span class="anime-rail__title">{anime.title}</span>
                {#if meta(anime)}<span class="anime-rail__meta">{meta(anime)}</span>{/if}
              </a>
            </li>
          {/each}
        </ol>
      {/if}

      {#if hasAside}
        <aside class="anime-rail__aside">
          {#if schedule.length}
            <div class="anime-rail__schedule">
              <h3 class="anime-rail__aside-title">Tayang Hari Ini{dayLabel ? ` · ${dayLabel}` : ''}</h3>
              <p class="anime-rail__aside-sub">Jadwal WIB.</p>
              <div class="anime-rail__list">
                {#each schedule as anime (anime.malId)}
                  <AiringCard {anime} />
                {/each}
              </div>
            </div>
          {/if}
          {#if showQuiz}
            <TastePromoCard compact />
          {/if}
        </aside>
      {/if}
    </div>
  </div>
</section>

<style>
  .anime-rail { padding: 1.5rem 0; }

  .anime-rail__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
    gap: 2rem;
    align-items: start;
  }
  .anime-rail__grid--solo { grid-template-columns: minmax(0, 1fr); }

  .anime-rail__shelf {
    display: grid;
    /* Four across, two rows: tall enough to sit level with the schedule and
       quiz beside it instead of leaving a void under a single row. */
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.5rem 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .anime-rail__poster {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: inherit;
    text-decoration: none;
  }
  .anime-rail__poster:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 3px; border-radius: 10px; }

  .anime-rail__art {
    position: relative;
    display: block;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    border-radius: 10px;
    background: #e9ecef;
    margin-bottom: 0.25rem;
  }
  .anime-rail__art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .anime-rail__score {
    position: absolute;
    left: 0.5rem;
    bottom: 0.5rem;
    padding: 0.2rem 0.45rem;
    border-radius: 6px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
    font-size: 0.8125rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  .anime-rail__title {
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1.3;
    color: #1a1a1a;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .anime-rail__meta { font-size: 0.75rem; color: #6b7280; }

  @media (hover: hover) {
    .anime-rail__poster:hover img { transform: scale(1.05); }
    .anime-rail__poster:hover .anime-rail__title {
      text-decoration: underline;
      text-decoration-color: var(--site-primary, #f1ff32);
      text-decoration-thickness: 2px;
      text-underline-offset: 3px;
    }
  }
  @media (prefers-reduced-motion: reduce) { .anime-rail__art img { transition: none; } }

  .anime-rail__aside { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
  .anime-rail__schedule {
    padding: 1rem 0.75rem 0.5rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 14px;
    background: #fff;
  }
  .anime-rail__aside-title {
    margin: 0 0.35rem;
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .anime-rail__aside-sub { margin: 0.15rem 0.35rem 0.5rem; font-size: 0.75rem; color: #6b7280; }
  .anime-rail__list { display: flex; flex-direction: column; }

  @media (max-width: 991px) {
    .anime-rail__grid { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
    .anime-rail__aside { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
    /* Posters become a swipeable shelf instead of shrinking to stamps. */
    .anime-rail__shelf {
      grid-template-columns: none;
      grid-auto-flow: column;
      grid-auto-columns: minmax(132px, 22%);
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      padding-bottom: 0.25rem;
    }
    .anime-rail__shelf::-webkit-scrollbar { display: none; }
    .anime-rail__shelf li { scroll-snap-align: start; }
  }
  @media (max-width: 575px) {
    .anime-rail__shelf { grid-auto-columns: 38%; gap: 1rem 0.75rem; }
    .anime-rail__aside { grid-template-columns: minmax(0, 1fr); }
  }
</style>
