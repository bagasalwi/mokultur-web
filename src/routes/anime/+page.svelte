<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildPageTitle } from '$lib/seo';
  import { ANIME_SEASONS, formatAirDate, seasonLabel } from '$lib/anime';
  import AnimeCard from '$components/anime/AnimeCard.svelte';
  import Carousel from '$components/ui/Carousel.svelte';
  import AnimeSlide from '$components/anime/AnimeSlide.svelte';
  import AiringTodaySection from '$components/anime/AiringTodaySection.svelte';
  import SectionHead from '$components/ui/SectionHead.svelte';
  import AnimeShare from '$components/anime/AnimeShare.svelte';
  import { page } from '$app/stores';
  import { replaceState } from '$app/navigation';
  import { getTopAnime, type AnimeCard as AnimeCardType } from '$lib/api';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl('/anime');
  $: shareUrl = absoluteUrl($page.url.pathname + $page.url.search);

  $: seasonHeading = data.currentSeason
    ? `${seasonLabel(data.currentSeason.season)} ${data.currentSeason.year}`
    : 'Season Ini';

  // Whichever filter the visitor arrived with stays open, so a shared link
  // lands on the tab that produced it.
  let mode: 'genre' | 'season' = data.seasonFilter.season ? 'season' : 'genre';

  // Form state, seeded from the server load so a shared URL renders its results
  // immediately and the selects show what produced them.
  let genreYear: number | '' = data.genreFilter.year ?? '';
  let genreSlug = data.genreFilter.genre ?? '';
  let seasonYear: number | '' = data.seasonFilter.year ?? '';
  let seasonValue = data.seasonFilter.season ?? '';

  type Results = {
    items: AnimeCardType[];
    label: string;
    syncing: boolean;
  } | null;

  let genreResults: Results = data.genreResults
    ? { items: data.genreResults, label: `${data.genreFilter.genre} · ${data.genreFilter.year}`, syncing: false }
    : null;
  let seasonResults: Results = data.seasonResults
    ? {
        items: data.seasonResults,
        label: `${seasonLabel(data.seasonFilter.season)} · ${data.seasonFilter.year}`,
        syncing: false,
      }
    : null;

  let loading: 'genre' | 'season' | null = null;
  let error = '';

  /**
   * Keep the query string in step with what is on screen without navigating.
   * The share buttons read the URL, so a result the visitor is looking at has
   * to be linkable — that is why this uses replaceState rather than dropping
   * the params entirely.
   */
  function syncUrl() {
    const q = new URLSearchParams();
    if (genreYear && genreSlug) {
      q.set('genreYear', String(genreYear));
      q.set('genre', genreSlug);
    }
    if (seasonYear && seasonValue) {
      q.set('seasonYear', String(seasonYear));
      q.set('season', seasonValue);
    }
    const search = q.toString();
    replaceState(search ? `?${search}` : $page.url.pathname, {});
  }

  async function submitGenre() {
    if (!genreYear || !genreSlug) return;
    loading = 'genre';
    error = '';

    try {
      const res = await getTopAnime({ year: Number(genreYear), genre: genreSlug, limit: 5 });
      const name = typeof res.genre === 'object' && res.genre ? res.genre.name : genreSlug;
      genreResults = { items: res.data, label: `${name} · ${genreYear}`, syncing: Boolean(res.syncing) };
      syncUrl();
    } catch {
      error = 'Gagal memuat data. Coba lagi.';
    } finally {
      loading = null;
    }
  }

  async function submitSeason() {
    if (!seasonYear || !seasonValue) return;
    loading = 'season';
    error = '';

    try {
      const res = await getTopAnime({ year: Number(seasonYear), season: seasonValue, limit: 5 });
      seasonResults = {
        items: res.data,
        label: `${seasonLabel(seasonValue)} · ${seasonYear}`,
        syncing: Boolean(res.syncing),
      };
      syncUrl();
    } catch {
      error = 'Gagal memuat data. Coba lagi.';
    } finally {
      loading = null;
    }
  }

  const description =
    'Koleksi anime dari MyAnimeList: top season berjalan, episode terbaru berskor tinggi, dan pencarian per tahun, genre, atau season.';
</script>

<svelte:head>
  <title>{buildPageTitle('Anime', siteName)}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={buildPageTitle('Anime', siteName)} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="container-xl py-4">
  <header class="anime-head mb-4">
    <p class="anime-head__eyebrow">MyAnimeList</p>
    <h1 class="anime-head__title">Anime</h1>
    <p class="anime-head__desc">{description}</p>

    <div class="anime-head__links">
      <a class="theme-btn theme-btn--primary theme-btn--sm" href="/anime/selera">
        <i class="bi bi-stars me-2"></i>Cari selera anime kamu
      </a>
      <a class="theme-btn theme-btn--surface theme-btn--sm" href="/anime/musim">
        <i class="bi bi-calendar3 me-2"></i>Jadwal per musim
      </a>
    </div>
  </header>

  <!-- Hero: top season berjalan -->
  {#if data.seasonTop.length}
    <section class="mb-5" aria-label={`Top anime ${seasonHeading}`}>
      <Carousel items={data.seasonTop} label={`Yang terbaik ${seasonHeading}`} let:item>
        <AnimeSlide anime={item} eyebrow={`Yang Terbaik · ${seasonHeading}`} />
      </Carousel>
      <div class="d-flex justify-content-end mt-3">
        <AnimeShare list="season" url={absoluteUrl('/anime')} title={`Top 5 Anime ${seasonHeading} — ${siteName}`} />
      </div>
    </section>
  {/if}

  <AiringTodaySection anime={data.airingToday} day={data.airingDay} />

  <!-- Episode terbaru berskor tinggi -->
  <section class="mb-5">
    <SectionHead
      title="Episode Terbaru Berskor Tinggi"
      sub="Episode yang baru tayang dari anime dengan skor MAL tertinggi."
    >
      <span slot="action">
        {#if data.latestEpisodes.length}
          <AnimeShare list="episodes" url={absoluteUrl('/anime')} title={`Episode terbaru berskor tinggi — ${siteName}`} />
        {/if}
      </span>
    </SectionHead>

    {#if data.latestEpisodes.length}
      <div class="anime-grid">
        {#each data.latestEpisodes as item, i (item.malId)}
          <AnimeCard
            anime={item}
            rank={i + 1}
            meta={`Ep ${item.latestEpisode.number}${
              formatAirDate(item.latestEpisode.airedAt) ? ` · ${formatAirDate(item.latestEpisode.airedAt)}` : ''
            }`}
          />
        {/each}
      </div>
    {:else}
      <p class="text-muted small mb-0">Belum ada episode terbaru yang tercatat.</p>
    {/if}
  </section>

  <!-- Penelusuran -->
  <section class="mb-4">
    <SectionHead
      title="Telusuri Top 5"
      sub="Pilih tahun lalu saring per genre atau per season. Hasilnya bisa langsung dibagikan lewat URL."
    />

    <div class="finder">
      <div class="finder__tabs" role="tablist" aria-label="Mode penelusuran">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'genre'}
          class="finder__tab"
          class:finder__tab--active={mode === 'genre'}
          on:click={() => (mode = 'genre')}
        >Tahun &amp; Genre</button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'season'}
          class="finder__tab"
          class:finder__tab--active={mode === 'season'}
          on:click={() => (mode = 'season')}
        >Tahun &amp; Season</button>
      </div>

      {#if mode === 'genre'}
        <form class="finder__form" on:submit|preventDefault={submitGenre}>
          <div class="finder__field">
            <label class="finder__label" for="genreYear">Tahun</label>
            <select class="form-select" id="genreYear" bind:value={genreYear} required>
              <option value="">Pilih tahun</option>
              {#each data.years as year (year)}
                <option value={year}>{year}</option>
              {/each}
            </select>
          </div>

          <div class="finder__field">
            <label class="finder__label" for="genre">Genre</label>
            <select class="form-select" id="genre" bind:value={genreSlug} required>
              <option value="">Pilih genre</option>
              {#each data.genres as g (g.slug)}
                <option value={g.slug}>{g.name}</option>
              {/each}
            </select>
          </div>

          <button type="submit" class="btn btn-anime" disabled={loading === 'genre'}>
            {loading === 'genre' ? 'Memuat…' : 'Tampilkan'}
          </button>
        </form>
      {:else}
        <form class="finder__form" on:submit|preventDefault={submitSeason}>
          <div class="finder__field">
            <label class="finder__label" for="seasonYear">Tahun</label>
            <select class="form-select" id="seasonYear" bind:value={seasonYear} required>
              <option value="">Pilih tahun</option>
              {#each data.years as year (year)}
                <option value={year}>{year}</option>
              {/each}
            </select>
          </div>

          <div class="finder__field">
            <label class="finder__label" for="season">Season</label>
            <select class="form-select" id="season" bind:value={seasonValue} required>
              <option value="">Pilih season</option>
              {#each ANIME_SEASONS as sn (sn.value)}
                <option value={sn.value}>{sn.label}</option>
              {/each}
            </select>
          </div>

          <button type="submit" class="btn btn-anime" disabled={loading === 'season'}>
            {loading === 'season' ? 'Memuat…' : 'Tampilkan'}
          </button>
        </form>
      {/if}

      {#if error}
        <p class="finder__error">{error}</p>
      {/if}
    </div>

    {#if genreResults}
      <div class="results">
        <div class="results__head">
          <h3 class="results__title">Top 5 {genreResults.label}</h3>
          {#if genreResults.items.length}
            <AnimeShare
              list="genre"
              year={Number(genreYear)}
              genre={genreSlug}
              url={shareUrl}
              title={`Top 5 anime ${genreResults.label} — ${siteName}`}
            />
          {/if}
        </div>

        {#if genreResults.items.length}
          <div class="anime-grid">
            {#each genreResults.items as item, i (item.malId)}
              <AnimeCard anime={item} rank={i + 1} />
            {/each}
          </div>
        {:else if genreResults.syncing}
          <p class="text-muted small mb-0">
            Tahun ini belum pernah kami ambil dari MyAnimeList. Datanya sedang diambil — coba lagi sebentar lagi.
          </p>
        {:else}
          <p class="text-muted small mb-0">Belum ada data untuk kombinasi ini.</p>
        {/if}
      </div>
    {/if}

    {#if seasonResults}
      <div class="results">
        <div class="results__head">
          <h3 class="results__title">Top 5 {seasonResults.label}</h3>
          {#if seasonResults.items.length}
            <AnimeShare
              list="season-year"
              year={Number(seasonYear)}
              season={seasonValue}
              url={shareUrl}
              title={`Top 5 anime ${seasonResults.label} — ${siteName}`}
            />
          {/if}
        </div>

        {#if seasonResults.items.length}
          <div class="anime-grid">
            {#each seasonResults.items as item, i (item.malId)}
              <AnimeCard anime={item} rank={i + 1} />
            {/each}
          </div>
        {:else if seasonResults.syncing}
          <p class="text-muted small mb-0">
            Tahun ini belum pernah kami ambil dari MyAnimeList. Datanya sedang diambil — coba lagi sebentar lagi.
          </p>
        {:else}
          <p class="text-muted small mb-0">Belum ada data untuk kombinasi ini.</p>
        {/if}
      </div>
    {/if}
  </section>
</div>

<style>
  .anime-head__links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .anime-head__eyebrow {
    margin: 0 0 0.15rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--site-primary, #55ad9b);
  }

  .anime-head__title {
    margin: 0;
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .anime-head__desc {
    margin: 0.35rem 0 0;
    max-width: 60ch;
    color: var(--bs-secondary-color, #6c757d);
  }

  /* Fixed column count, not auto-fill: every section returns exactly 5 items,
     and auto-fill sized them at ~150px and left the rest of the row empty.
     minmax(0, 1fr) stops long titles from forcing columns wider than their
     share and blowing the grid past the container. */
  .anime-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1.25rem;
  }

  @media (max-width: 991.98px) {
    .anime-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .finder {
    padding: 1rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.75rem;
    background: var(--bs-tertiary-bg, #f8f9fa);
  }

  .finder__tabs {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    margin-bottom: 0.9rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
  }

  .finder__tab {
    padding: 0.3rem 0.9rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font-size: 0.85rem;
    font-weight: 600;
    color: inherit;
  }

  .finder__tab--active {
    background: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #fff);
  }

  .finder__form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .finder__field {
    flex: 1 1 180px;
    min-width: 0;
  }

  .finder__label {
    display: block;
    margin-bottom: 0.2rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--bs-secondary-color, #6c757d);
  }

  .btn-anime {
    background: var(--site-primary, #55ad9b);
    border-color: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #fff);
    font-weight: 600;
  }

  .btn-anime:hover {
    filter: brightness(0.93);
    color: var(--site-primary-contrast, #fff);
  }

  .finder__error {
    margin: 0.75rem 0 0;
    font-size: 0.85rem;
    color: #dc3545;
  }

  .results {
    margin-top: 1.75rem;
  }

  .results__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.9rem;
  }

  .results__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    text-transform: capitalize;
  }

  @media (max-width: 575.98px) {
    .anime-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.9rem;
    }

    .finder__form {
      gap: 0.6rem;
    }

    .finder__field {
      flex: 1 1 100%;
    }
  }
</style>
