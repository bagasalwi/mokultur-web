<script lang="ts">
  import type { AnimeGenreOption } from '$lib/api';

  export let genres: AnimeGenreOption[] = [];
  /** Year the chip links to; omitted links just filter by genre. */
  export let year: number | null = null;
  export let max: number | null = null;
  export let tone: 'light' | 'dark' = 'light';
  /** Plain chips when the surrounding element is already a link. */
  export let linked = true;

  $: shown = max === null ? genres : genres.slice(0, max);

  function href(slug: string): string {
    return year === null ? `/anime?genre=${slug}` : `/anime?genreYear=${year}&genre=${slug}`;
  }
</script>

<!-- Renders nothing when a title has no genres: coverage depends on an upstream
     backfill that will never be complete, and an empty chip row reads as broken. -->
{#if shown.length}
  <ul class="chips chips--{tone}">
    {#each shown as genre (genre.slug)}
      <li>
        {#if linked}
          <a class="chip" href={href(genre.slug)}>{genre.name}</a>
        {:else}
          <span class="chip">{genre.name}</span>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .chip {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.4;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .chips--light .chip {
    background: rgba(0, 0, 0, 0.06);
    color: var(--bs-body-color, #212529);
  }

  .chips--light .chip:hover {
    background: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #fff);
  }

  .chips--dark .chip {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
    backdrop-filter: blur(4px);
  }

  .chips--dark .chip:hover {
    background: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #fff);
  }
</style>
