<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { AnimeCard } from '$lib/api';
  import AnimeScore from './AnimeScore.svelte';
  import GenreChips from './GenreChips.svelte';

  export let anime: AnimeCard;
  export let rank: number | null = null;
  /** Extra line under the title, e.g. "Ep 10 · 27 Mar 2026". */
  export let meta: string | null = null;

  $: fallbackMeta = [
    anime.seasonYear ? String(anime.seasonYear) : null,
    anime.numEpisodes ? `${anime.numEpisodes} eps` : null,
  ]
    .filter(Boolean)
    .join(' · ');
</script>

<article class="anime-card">
  <!-- Straight to MyAnimeList; see AnimeSlide for the reasoning. -->
  <a class="anime-card__link" href={anime.malUrl} target="_blank" rel="noopener">
    <div class="anime-card__thumb">
      {#if anime.image}
        <img src={imgUrl(anime.image, 320)} srcset={imgSrcset(anime.image, 200)} sizes="(max-width: 767px) 45vw, 200px" alt={anime.title} loading="lazy" decoding="async" />
      {:else}
        <div class="anime-card__placeholder"><i class="bi bi-image"></i></div>
      {/if}

      {#if rank !== null}
        <span class="anime-card__rank">#{rank}</span>
      {/if}

      <div class="anime-card__score">
        <AnimeScore score={anime.score} size="sm" />
      </div>
    </div>

    <h3 class="anime-card__title">{anime.title}</h3>
    <p class="anime-card__meta">{meta ?? fallbackMeta}</p>
  </a>

  <!-- Outside the anchor: genre chips are links themselves, and nesting <a>
       inside <a> is invalid and breaks keyboard navigation. -->
  <div class="anime-card__genres">
    <GenreChips genres={anime.genres} year={anime.seasonYear} max={2} />
  </div>
</article>

<style>
  .anime-card {
    display: flex;
    flex-direction: column;
    /* A surface of its own: without the padding and border the poster ran
       edge to edge and the title sat flush against it, so cards read as one
       cramped block rather than separate items. */
    padding: 0.6rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.85rem;
    background: var(--bs-body-bg, #fff);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  /* Hover inverts the card: black surface, brand-yellow type. Declared here
     rather than per-page so every list — homepage, /anime, Tayang Hari Ini —
     picks it up from the one component they all share. */
  .anime-card:hover {
    transform: translateY(-2px);
    background: var(--site-dark, #0b0d10);
    border-color: var(--site-dark, #0b0d10);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  }

  .anime-card:hover .anime-card__title,
  .anime-card:hover .anime-card__meta {
    color: var(--site-primary, #f1ff32);
  }

  .anime-card:hover :global(.chip) {
    background: rgba(241, 255, 50, 0.14);
    color: var(--site-primary, #f1ff32);
  }

  .anime-card__link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .anime-card__thumb {
    position: relative;
    aspect-ratio: 2 / 3;
    border-radius: 0.55rem;
    overflow: hidden;
    background: #e9ecef;
  }

  .anime-card__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.25s ease;
  }

  .anime-card__link:hover .anime-card__thumb img {
    transform: scale(1.05);
  }

  .anime-card__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #adb5bd;
    font-size: 1.5rem;
  }

  .anime-card__rank {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.15rem 0.45rem;
    border-radius: 0.35rem;
    background: var(--site-dark, #14181d);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .anime-card__score {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
  }

  .anime-card__title {
    margin: 0.6rem 0 0;
    transition: color 0.18s ease;
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .anime-card__meta {
    margin: 0.2rem 0 0;
    transition: color 0.18s ease;
    font-size: 0.76rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  .anime-card__genres:not(:empty) {
    margin-top: 0.4rem;
  }
</style>
