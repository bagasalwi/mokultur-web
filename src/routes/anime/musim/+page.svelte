<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';

  export let data: PageData;

  const SEASON_LABEL: Record<string, string> = {
    winter: 'Winter',
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
  };

  const SEASON_ORDER = ['winter', 'spring', 'summer', 'fall'];

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl('/anime/musim');
  $: pageTitle = buildPageTitle('Jadwal Anime per Musim', siteName);
  $: description = `Daftar anime tiap musim, dari yang terbaru sampai arsip lama, diurutkan dari skor tertinggi.`;

  /** Grouped by year so the page reads as an archive rather than a flat list. */
  $: byYear = (() => {
    const map = new Map<number, typeof data.seasons>();
    for (const s of data.seasons) {
      if (!map.has(s.year)) map.set(s.year, []);
      map.get(s.year)!.push(s);
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, seasons]) => ({
        year,
        seasons: [...seasons].sort(
          (a, b) => SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season)
        ),
      }));
  })();
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  {@html `<script type="application/ld+json">${JSON.stringify(
    buildBreadcrumb([
      { name: 'Anime', path: '/anime' },
      { name: 'Musim', path: '/anime/musim' },
    ])
  )}<\/script>`}
</svelte:head>

<section class="section-md container-xl">
  <header class="season-index__hero mb-4">
    <span class="badge badge-main mb-3">Arsip</span>
    <h1 class="season-index__title">Jadwal Anime per Musim</h1>
    <p class="season-index__desc mb-0">
      Pilih musimnya untuk melihat daftar lengkap judul yang tayang, diurutkan dari skor tertinggi.
    </p>
  </header>

  {#if byYear.length}
    {#each byYear as group (group.year)}
      <h2 class="season-index__year">{group.year}</h2>
      <div class="season-index__row">
        {#each group.seasons as s (s.season)}
          <a class="season-index__chip" href="/anime/musim/{s.year}/{s.season}">
            <strong>{SEASON_LABEL[s.season] ?? s.season}</strong>
            <span>{s.total} judul</span>
          </a>
        {/each}
      </div>
    {/each}
  {:else}
    <p class="text-muted">Data musim belum tersedia.</p>
  {/if}
</section>

<style>
  .season-index__hero {
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

  .season-index__title {
    font-size: clamp(1.9rem, 3vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #fff;
    margin: 0 0 0.35rem;
  }

  .season-index__desc {
    color: rgb(255 255 255 / 78%);
  }

  .season-index__year {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    padding-left: 0.75rem;
    border-left: 4px solid var(--site-primary, #f1ff32);
    margin: 2rem 0 0.85rem;
  }

  .season-index__row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .season-index__chip {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    border: 1px solid var(--bs-border-color, #dee2e6);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }

  .season-index__chip:hover {
    transform: translateY(-2px);
    border-color: var(--site-primary, #f1ff32);
  }

  .season-index__chip span {
    font-size: 0.78rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  @media (max-width: 767.98px) {
    .season-index__hero {
      border-radius: 20px;
      padding: 1.5rem;
    }

    .season-index__row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
