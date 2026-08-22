<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { AnimeCard } from '$lib/api';
  import { seasonLabel } from '$lib/anime';
  import AnimeScore from './AnimeScore.svelte';
  import GenreChips from './GenreChips.svelte';

  export let anime: AnimeCard;
  export let eyebrow: string | null = null;
  /** Detail pages render their own <h1>, so the slide must not emit one too. */
  export let heading: 'h1' | 'h2' | 'h3' = 'h3';
  /** Detail hero is the page itself — nothing to link to. */
  export let linked = true;

  // Anime links go straight to MyAnimeList. Our own detail page still exists
  // and stays reachable by direct URL, but listings hand visitors to the
  // canonical source rather than a thinner local copy.
  $: href = anime.malUrl;
  $: metaLine = [
    anime.seasonYear ? String(anime.seasonYear) : null,
    anime.season ? seasonLabel(anime.season) : null,
    anime.mediaType ? anime.mediaType.toUpperCase() : null,
    anime.numEpisodes ? `${anime.numEpisodes} eps` : null,
  ]
    .filter(Boolean)
    .join(' · ');
</script>

<article class="slide">
  {#if anime.image}
    <!-- Backdrop is decorative: the same artwork already appears as the poster
         with the title beside it, so alt text here would just be noise. -->
    <img class="slide__backdrop" src={imgUrl(anime.image, 768)} srcset={imgSrcset(anime.image, 600)} sizes="100vw" alt="" aria-hidden="true" />
  {/if}
  <div class="slide__scrim"></div>

  <div class="slide__inner">
    <div class="slide__poster">
      {#if anime.image}
        <img src={imgUrl(anime.image, 320)} srcset={imgSrcset(anime.image, 200)} sizes="200px" alt={anime.title} loading="lazy" decoding="async" />
      {/if}
    </div>

    <div class="slide__body">
      {#if eyebrow}<p class="slide__eyebrow">{eyebrow}</p>{/if}

      <svelte:element this={heading} class="slide__title">
        {#if linked}
          <a href={href} target="_blank" rel="noopener">{anime.title}</a>
        {:else}
          {anime.title}
        {/if}
      </svelte:element>

      {#if anime.titleEn && anime.titleEn !== anime.title}
        <p class="slide__subtitle">{anime.titleEn}</p>
      {/if}

      <div class="slide__meta">
        <div class="slide__tags">
          <GenreChips genres={anime.genres} year={anime.seasonYear} max={3} tone="dark" />
          {#if metaLine}<p class="slide__metaline">{metaLine}</p>{/if}
        </div>

        <AnimeScore score={anime.score} size="xl" />
      </div>

      <!-- Detail hero fills this with share + MyAnimeList buttons; on the
           carousel it stays empty so slides keep a uniform height. -->
      <div class="slide__actions"><slot name="actions" /></div>
    </div>
  </div>
</article>

<style>
  .slide {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    background: var(--site-dark, #14181d);
    color: #fff;
    isolation: isolate;
    /* Sized against its own width, not the viewport's. The same slide runs
       full-width on /anime and the detail hero but only 40% wide in the
       homepage row, so a viewport media query would shrink the wrong ones. */
    container-type: inline-size;
  }

  .slide__backdrop {
    position: absolute;
    inset: 0;
    z-index: -2;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(28px) saturate(1.25);
    transform: scale(1.2);
  }

  .slide__scrim {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.66) 55%, rgba(0, 0, 0, 0.5) 100%),
      linear-gradient(0deg, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.15));
  }

  .slide__inner {
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 2rem);
    /* Less vertical than horizontal: the poster already sets the slide's height,
       so an equal pad on all four sides left visible dead bands top and bottom. */
    padding: clamp(0.85rem, 1.4vw, 1.15rem) clamp(1.1rem, 3vw, 2rem);
    min-height: 0;
  }

  .slide__poster {
    flex: 0 0 auto;
    width: clamp(104px, 15vw, 176px);
    aspect-ratio: 2 / 3;
    border-radius: 0.6rem;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    background: rgba(255, 255, 255, 0.08);
  }

  .slide__poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .slide__body {
    flex: 1 1 auto;
    min-width: 0;
  }

  .slide__eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--site-accent, #55ad9b);
  }

  .slide__title {
    margin: 0;
    /* Stated outright rather than inherited from .slide: Bootstrap matches
       h1-h6 directly, so any theme that gives --bs-heading-color a real value
       beats the inherited white and the title disappears into the backdrop. */
    color: #fff;
    font-size: clamp(1.25rem, 3.2vw, 2.15rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.1;
    /* Long MAL titles would otherwise push the score block off the slide. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .slide__title :global(a) {
    color: #fff;
    text-decoration: none;
  }

  .slide__title :global(a:hover) {
    color: var(--site-accent, #55ad9b);
  }

  .slide__subtitle {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .slide__meta {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-top: clamp(0.75rem, 2vw, 1.25rem);
  }

  .slide__tags {
    min-width: 0;
  }

  .slide__metaline {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.72);
  }

  .slide__actions:not(:empty) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.1rem;
  }

  /* Replaces the old max-width: 575.98px media query. A narrow phone and a
     narrow column need the same treatment, and this catches both.

     The threshold sits above the widest homepage column (632px at 1440) so
     that card keeps one character at every breakpoint, while the full-width
     heroes on /anime and the detail page stay large. */
  @container (max-width: 700px) {
    .slide__inner {
      min-height: 0;
      gap: 0.85rem;
      padding: 0.85rem;
      align-items: flex-start;
    }

    /* Same rule as the desktop column, scaled down: height set, width from
       aspect-ratio (150 × 2/3 = 100px). Not vw-based — in a half-width column
       the viewport says "desktop" while the space available says otherwise. */
    .slide__poster {
      width: auto;
      height: 150px;
    }

    .slide__title {
      font-size: 1.05rem;
      letter-spacing: -0.02em;
    }

    .slide__subtitle {
      font-size: 0.78rem;
    }

    .slide__meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    /* The xl score sizes itself off the viewport (clamp(…, 5vw, …)), which
       reads "desktop" even when the slide is only 40% of the row — left alone
       it becomes the biggest thing on the card. */
    .slide__meta :global(.score--xl) {
      padding: 0.5rem 0.8rem;
      min-width: 4.5rem;
      border-radius: 0.6rem;
    }

    .slide__meta :global(.score--xl .score__value) {
      font-size: 1.6rem;
    }
  }

  /* The homepage column on a desktop viewport — roomy enough for a proper
     hero, unlike the same column at md or a phone screen. Comes after the
     block above so its overrides win at equal specificity. */
  @container (min-width: 520px) and (max-width: 700px) {
    .slide__inner {
      align-items: center;
      gap: 1.1rem;
      padding: 1.1rem;
      /* Levels the card with the three-row schedule card in the next column;
         that one is content-sized, so this is the number to revisit if the
         schedule ever shows more or fewer rows. */
      min-height: 380px;
    }

    /* Height drives it, aspect-ratio supplies the width (300 × 2/3 = 200px).
       Safe here because the height is a definite value — when it was `auto`
       under a stretched parent the sizing went circular and settled at 425px
       wide with the text crushed to 154px. */
    .slide__poster {
      width: auto;
      height: 300px;
    }

    .slide__title {
      font-size: 2rem;
      /* The taller card has room for a third line, and at 2rem the two-line
         clamp cut most season titles mid-word. */
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }

    .slide__subtitle {
      font-size: 0.85rem;
    }

    .slide__meta :global(.score--xl) {
      padding: 0.7rem 1.1rem;
      min-width: 0;
      border-radius: 0.85rem;
    }

    .slide__meta :global(.score--xl .score__value) {
      font-size: 3rem;
    }
  }
</style>
