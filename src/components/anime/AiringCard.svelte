<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { AnimeCard } from '$lib/api';

  export let anime: AnimeCard;

  /**
   * A schedule entry: time first, then a thumbnail big enough to recognise, and
   * both titles. Rank, score and genres stay off this list — they belong on the
   * ranked grids.
   */
  $: time = anime.broadcastTimeWib;
  $: english = anime.titleEn && anime.titleEn !== anime.title ? anime.titleEn : null;
</script>

<!-- Straight to MyAnimeList, like every other anime link on the site. -->
<a class="airing-row" href={anime.malUrl} target="_blank" rel="noopener">
  <span class="airing-row__thumb">
    {#if anime.image}
      <img src={imgUrl(anime.image, 160)} srcset={imgSrcset(anime.image, 80)} sizes="80px" alt="" loading="lazy" decoding="async" />
    {/if}
    <span class="airing-row__time">{time ?? '--:--'}</span>
  </span>

  <span class="airing-row__body">
    <span class="airing-row__title">{anime.title}</span>
    {#if english}
      <span class="airing-row__english">{english}</span>
    {/if}
  </span>
</a>

<style>
  .airing-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.45rem;
    border-radius: 0.6rem;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .airing-row:hover {
    background: var(--site-dark, #0b0d10);
    color: var(--site-primary, #f1ff32);
  }

  .airing-row__thumb {
    position: relative;
    flex: 0 0 auto;
    width: 72px;
    height: 100px;
    border-radius: 0.4rem;
    overflow: hidden;
    background: #e9ecef;
  }

  .airing-row__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* On the artwork rather than in its own column: at three per row the time
     would otherwise eat width the titles need. */
  .airing-row__time {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    padding: 0.15rem 0;
    background: rgba(0, 0, 0, 0.78);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .airing-row:hover .airing-row__time {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0b0d10);
  }

  .airing-row__body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .airing-row__title {
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .airing-row__english {
    font-size: 0.76rem;
    font-weight: 500;
    line-height: 1.3;
    color: var(--bs-secondary-color, #6c757d);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .airing-row:hover .airing-row__english {
    color: rgba(241, 255, 50, 0.7);
  }
</style>
