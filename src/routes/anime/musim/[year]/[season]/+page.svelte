<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';
  import { animeSlug, seasonLabel } from '$lib/anime';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { imgFallback } from '$lib/format';

  export let data: PageData;

  const SEASON_ID: Record<string, string> = {
    winter: 'Winter',
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
  };

  const SEASON_MONTHS: Record<string, string> = {
    winter: 'Januari – Maret',
    spring: 'April – Juni',
    summer: 'Juli – September',
    fall: 'Oktober – Desember',
  };

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: label = `${SEASON_ID[data.season] ?? seasonLabel(data.season)} ${data.year}`;
  $: canonical = absoluteUrl(`/anime/musim/${data.year}/${data.season}`);
  $: pageTitle = buildPageTitle(`Jadwal Anime ${label}`, siteName);
  $: description =
    `Daftar lengkap ${data.total} anime yang tayang pada musim ${label} ` +
    `(${SEASON_MONTHS[data.season] ?? ''}), diurutkan dari skor tertinggi.`;

  // The three best-scored titles carry the season, so they get named in the
  // description a search result actually shows.
  $: highlights = data.anime.slice(0, 3).map((a) => a.title).join(', ');

  $: jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Jadwal Anime ${label}`,
    numberOfItems: data.anime.length,
    itemListElement: data.anime.slice(0, 50).map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/anime/${a.malId}/${animeSlug(a.title)}`),
      name: a.title,
    })),
  };

</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={highlights ? `${description} Termasuk ${highlights}.` : description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(
    buildBreadcrumb([
      { name: 'Anime', path: '/anime' },
      { name: 'Musim', path: '/anime/musim' },
      { name: label, path: `/anime/musim/${data.year}/${data.season}` },
    ])
  )}<\/script>`}
</svelte:head>

<section class="section-md container-xl">
  <header class="season-hero mb-4">
    <span class="badge badge-main mb-3">Panduan Musim</span>
    <h1 class="season-hero__title">Anime {label}</h1>
    <p class="season-hero__desc mb-0">
      {data.total} judul tayang {SEASON_MONTHS[data.season] ?? ''}, diurutkan dari skor tertinggi.
    </p>
  </header>

  <div class="season-grid">
    {#each data.anime as anime, i (anime.malId)}
      <a class="season-card" href="/anime/{anime.malId}/{animeSlug(anime.title)}">
        <div class="season-card__poster">
          <img
            src={imgUrl(anime.image, 320)}
            srcset={imgSrcset(anime.image, 200)}
            sizes="(max-width: 767px) 45vw, 200px"
            alt={anime.title}
            loading={i < 8 ? 'eager' : 'lazy'}
            decoding="async"
            on:error={imgFallback}
          />
          {#if anime.score}
            <span class="season-card__score"><i class="bi bi-star-fill"></i> {anime.score}</span>
          {/if}
        </div>
        <div class="season-card__body">
          <h2 class="season-card__title">{anime.title}</h2>
          <p class="season-card__meta">
            {[anime.mediaType?.toUpperCase(), anime.numEpisodes ? `${anime.numEpisodes} eps` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </a>
    {/each}
  </div>

  <p class="season-footnote">
    Skor dan data judul bersumber dari MyAnimeList, disegarkan berkala.
  </p>
</section>

<style>
  .season-hero {
    border-radius: 28px;
    padding: 2rem;
    color: #fff;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--site-accent-glow, #f1ff32) 75%, transparent),
        transparent 22%
      ),
      linear-gradient(135deg, #0a0a0a 0%, #111827 48%, #1f2937 100%);
    box-shadow: 0 24px 80px rgb(10 10 10 / 15%);
  }

  .season-hero__title {
    font-size: clamp(1.9rem, 3vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #fff;
    margin: 0 0 0.35rem;
  }

  .season-hero__desc {
    color: rgb(255 255 255 / 78%);
  }

  .season-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 1rem;
  }

  .season-card {
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
  }

  .season-card__poster {
    position: relative;
    aspect-ratio: 2 / 3;
    border-radius: 10px;
    overflow: hidden;
    background: #14171c;
  }

  .season-card__poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s ease;
  }

  .season-card:hover .season-card__poster img {
    transform: scale(1.04);
  }

  .season-card__score {
    position: absolute;
    left: 0.4rem;
    bottom: 0.4rem;
    padding: 0.1rem 0.4rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 800;
    background: rgb(0 0 0 / 72%);
    color: var(--site-primary, #f1ff32);
    backdrop-filter: blur(4px);
  }

  .season-card__title {
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0.5rem 0 0.15rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .season-card__meta {
    margin: 0;
    font-size: 0.72rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  .season-footnote {
    margin: 2rem 0 0;
    font-size: 0.78rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  @media (max-width: 1199.98px) {
    .season-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }

  @media (max-width: 991.98px) {
    .season-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 767.98px) {
    .season-hero {
      border-radius: 20px;
      padding: 1.5rem;
    }

    .season-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
    }
  }

  @media (max-width: 479.98px) {
    .season-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
