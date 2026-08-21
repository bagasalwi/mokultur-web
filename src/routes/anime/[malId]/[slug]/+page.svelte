<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildPageTitle } from '$lib/seo';
  import { animeSlug, formatAirDate, seasonLabel } from '$lib/anime';
  import AnimeSlide from '$components/anime/AnimeSlide.svelte';
  import ShareButtons from '$components/common/ShareButtons.svelte';

  export let data: PageData;

  $: anime = data.anime;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl(`/anime/${anime.malId}/${animeSlug(anime.title)}`);
  $: pageTitle = buildPageTitle(anime.title, siteName);
  $: description =
    anime.synopsis?.slice(0, 200).trim() ??
    `${anime.title}${anime.score !== null ? ` — skor MAL ${anime.score.toFixed(2)}` : ''}`;
  $: episodes = anime.episodes.slice(0, 12);

  $: facts = [
    { label: 'Tipe', value: anime.mediaType?.toUpperCase() ?? null },
    { label: 'Status', value: anime.status },
    { label: 'Episode', value: anime.numEpisodes ? String(anime.numEpisodes) : null },
    { label: 'Tayang', value: anime.broadcast?.day ? `${anime.broadcast.day} ${anime.broadcast.time ?? ''}`.trim() : null },
    { label: 'Studio', value: anime.studios.length ? anime.studios.join(', ') : null },
    { label: 'Peringkat MAL', value: anime.rank ? `#${anime.rank}` : null },
    { label: 'Popularitas', value: anime.popularity ? `#${anime.popularity}` : null },
  ].filter((f) => f.value);

  $: jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: anime.title,
    alternateName: anime.titleEn ?? undefined,
    image: anime.image ?? undefined,
    description: anime.synopsis ?? undefined,
    numberOfEpisodes: anime.numEpisodes ?? undefined,
    genre: anime.genres.map((g) => g.name),
    sameAs: anime.malUrl,
    aggregateRating:
      anime.score !== null
        ? { '@type': 'AggregateRating', ratingValue: anime.score, bestRating: 10, ratingCount: 1 }
        : undefined,
  };
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="video.tv_show" />
  <meta property="og:url" content={canonical} />
  {#if anime.image}<meta property="og:image" content={anime.image} />{/if}
  <meta name="twitter:card" content="summary_large_image" />
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</${'script'}>`}
</svelte:head>

<div class="container-xl py-4">
  <nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb small mb-0">
      <li class="breadcrumb-item"><a href="/">Home</a></li>
      <li class="breadcrumb-item"><a href="/anime">Anime</a></li>
      <li class="breadcrumb-item active" aria-current="page">{anime.title}</li>
    </ol>
  </nav>

  <!-- Same treatment as the homepage carousel, so a slide and its destination
       read as the same object. -->
  <AnimeSlide
    {anime}
    heading="h1"
    linked={false}
    eyebrow={anime.season && anime.seasonYear ? `${seasonLabel(anime.season)} ${anime.seasonYear}` : 'Anime'}
  >
    <svelte:fragment slot="actions">
      <a href={anime.malUrl} target="_blank" rel="noopener" class="btn btn-sm btn-mal">
        <i class="bi bi-box-arrow-up-right me-1"></i> MyAnimeList
      </a>
      <ShareButtons url={canonical} title={`${anime.title} — ${siteName}`} compact />
    </svelte:fragment>
  </AnimeSlide>

  <div class="row g-4 mt-1">
    <div class="col-12 col-lg-8">
      {#if anime.synopsis}
        <section class="mb-4">
          <div class="section-head">
            <h2 class="section-head__title">Sinopsis</h2>
          </div>
          <p class="synopsis">{anime.synopsis}</p>
        </section>
      {/if}

      {#if episodes.length}
        <section>
          <div class="section-head">
            <h2 class="section-head__title">Episode Terbaru</h2>
          </div>
          <ul class="episodes">
            {#each episodes as ep (ep.number)}
              <li class="episode">
                <span class="episode__no">{ep.number}</span>
                <span class="episode__title">
                  {ep.title ?? `Episode ${ep.number}`}
                  {#if ep.filler}<span class="episode__tag">filler</span>{/if}
                  {#if ep.recap}<span class="episode__tag">recap</span>{/if}
                </span>
                <span class="episode__date">{formatAirDate(ep.airedAt)}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>

    <div class="col-12 col-lg-4">
      {#if facts.length}
        <section class="facts">
          <h2 class="facts__title">Informasi</h2>
          <dl class="facts__list">
            {#each facts as fact (fact.label)}
              <div class="facts__row">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            {/each}
          </dl>
        </section>
      {/if}
    </div>
  </div>
</div>

<style>
  .btn-mal {
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #fff;
    font-weight: 600;
    backdrop-filter: blur(4px);
  }

  .btn-mal:hover {
    background: var(--site-primary, #55ad9b);
    border-color: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #fff);
  }

  .section-head {
    margin-bottom: 0.85rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--site-primary, #55ad9b);
  }

  .section-head__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .synopsis {
    margin: 0;
    white-space: pre-line;
    line-height: 1.75;
  }

  .episodes {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--bs-border-color, #dee2e6);
  }

  .episode {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  }

  .episode__no {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    border-radius: 0.4rem;
    background: var(--bs-tertiary-bg, #f1f3f5);
    font-size: 0.82rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .episode__title {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.92rem;
  }

  .episode__tag {
    display: inline-block;
    margin-left: 0.35rem;
    padding: 0.05rem 0.35rem;
    border-radius: 0.3rem;
    background: rgba(0, 0, 0, 0.08);
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .episode__date {
    flex: 0 0 auto;
    font-size: 0.78rem;
    color: var(--bs-secondary-color, #6c757d);
    white-space: nowrap;
  }

  .facts {
    padding: 1rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.75rem;
    background: var(--bs-tertiary-bg, #f8f9fa);
  }

  .facts__title {
    margin: 0 0 0.6rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--bs-secondary-color, #6c757d);
  }

  .facts__list {
    margin: 0;
  }

  .facts__row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0;
    border-bottom: 1px dashed var(--bs-border-color, #dee2e6);
  }

  .facts__row:last-child {
    border-bottom: 0;
  }

  .facts__row dt {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--bs-secondary-color, #6c757d);
  }

  .facts__row dd {
    margin: 0;
    font-size: 0.85rem;
    text-align: right;
  }
</style>
