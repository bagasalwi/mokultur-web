<script lang="ts">
  import ShareSheet from '$components/common/ShareSheet.svelte';
  import { animeShareImageUrl } from '$lib/api';

  /** Page URL being shared. */
  export let url: string;
  export let title = '';
  /** Which list the downloadable image should render. */
  export let list: 'season' | 'episodes' | 'genre' | 'season-year';
  export let year: number | null = null;
  export let genre: string | null = null;
  export let season: string | null = null;

  $: href5 = animeShareImageUrl({ list, year, genre, season, count: 5 });
  $: href3 = animeShareImageUrl({ list, year, genre, season, count: 3 });
</script>

<ShareSheet {url} {title}>
  <svelte:fragment slot="extra" let:close>
    <p class="sheet__label">Unduh gambar</p>
    <div class="sheet__row">
      <!-- Plain links: the endpoint sends content-disposition: attachment. -->
      <a class="sheet__card" href={href5} on:click={close}>
        <span class="sheet__card-num">5</span>
        <span class="sheet__card-text">Top 5<small>1080 × 1350</small></span>
      </a>
      <a class="sheet__card" href={href3} on:click={close}>
        <span class="sheet__card-num">3</span>
        <span class="sheet__card-text">Top 3<small>1080 × 1350</small></span>
      </a>
    </div>
  </svelte:fragment>
</ShareSheet>

<style>
  /* Svelte styles are scoped per component, and this markup lives here rather
     than in ShareSheet, so these rules have to be duplicated from it. */
  .sheet__label {
    margin: 0 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--bs-secondary-color, #6c757d);
  }

  .sheet__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
    margin-bottom: 1.15rem;
  }

  .sheet__card {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.8rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.7rem;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .sheet__card:hover {
    border-color: var(--site-primary, #55ad9b);
    background: rgba(0, 0, 0, 0.03);
  }

  .sheet__card-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.1rem;
    height: 2.1rem;
    flex-shrink: 0;
    border-radius: 0.5rem;
    background: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #fff);
    font-weight: 900;
    font-size: 1rem;
  }

  .sheet__card-text {
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .sheet__card-text small {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--bs-secondary-color, #6c757d);
  }
</style>
