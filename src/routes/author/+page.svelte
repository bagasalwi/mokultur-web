<script lang="ts">
  import type { PageData } from './$types';
  import type { Writer } from '$lib/api';
  import Pagination from '$components/common/Pagination.svelte';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';
  import { compactNumber, imgFallback, timeAgo } from '$lib/format';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { initials } from '$lib/user';

  export let data: PageData;

  const DAY = 86_400_000;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: totalArticles = data.writers.reduce((sum, w) => sum + w.totalArticles, 0);
  $: totalViews = data.writers.reduce((sum, w) => sum + w.totalViews, 0);
  $: description = `Kenali ${data.meta.total} penulis di balik liputan anime, game, dan budaya pop Jepang di ${siteName}.`;

  // The writer with the most articles in the last 30 days gets the spotlight.
  $: spotlight = data.page === 1
    ? [...data.writers].sort((a, b) => (b.articles30d ?? 0) - (a.articles30d ?? 0) || stamp(b.latestPublishDate) - stamp(a.latestPublishDate))[0] ?? null
    : null;
  $: others = data.writers.filter((w) => w !== spotlight);

  function stamp(d: string | null | undefined): number {
    if (!d) return 0;
    return Date.parse(d.includes('T') ? d : `${d.replace(' ', 'T')}Z`) || 0;
  }
  const profileHref = (w: Writer) => `/@${encodeURIComponent(w.username ?? String(w.id))}`;
  const articleHref = (a: NonNullable<Writer['latestArticle']>) => `/article/${a.id}/${a.slug}`;
  const share = (w: Writer, count: number) => (w.totalArticles ? Math.round((count / w.totalArticles) * 100) : 0);
  const recent = (w: Writer) => Date.now() - stamp(w.latestPublishDate) <= 7 * DAY;
  const buildUrl = (page: number) => `/author?${new URLSearchParams({ ...(data.sort === 'views' ? { sort: 'views' } : {}), ...(page > 1 ? { page: String(page) } : {}) })}`;
</script>

<svelte:head>
  <title>Penulis - {siteName}</title>
  <meta name="description" content={description} />
  <meta name="robots" content={data.sort === 'views' ? 'noindex, follow' : 'index, follow'} />
  <link rel="canonical" href={absoluteUrl('/author')} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Orang-orang di balik {siteName}" />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={absoluteUrl('/author')} />
  <meta name="twitter:card" content={data.settings?.og_image ? 'summary_large_image' : 'summary'} />
  {#if data.settings?.og_image}
    <meta property="og:image" content={data.settings.og_image} />
    <meta name="twitter:image" content={data.settings.og_image} />
  {/if}
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Penulis ${siteName}`,
    url: absoluteUrl('/author'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: data.writers.map((w, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'Person', name: w.name, url: absoluteUrl(profileHref(w)), ...(w.img ? { image: w.img } : {}) },
      })),
    },
  })}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Penulis', path: '/author' }]))}<\/script>`}
</svelte:head>

{#snippet face(w: Writer, size: number)}
  {#if w.img}
    <img src={imgUrl(w.img, size * 2) ?? w.img} srcset={imgSrcset(w.img, size)} sizes="{size}px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
  {:else}
    <span class="face__initials">{initials(w.name)}</span>
  {/if}
{/snippet}

<div class="crew container-xl">
  <header class="crew-head">
    <nav class="crew-crumbs" aria-label="Breadcrumb">
      <a href="/">Beranda</a><i class="bi bi-chevron-right" aria-hidden="true"></i><span aria-current="page">Penulis</span>
    </nav>
    <h1>Orang-orang di balik {siteName}</h1>
    <p class="crew-head__lead">Setiap liputan anime, game, dan event yang kamu baca ditulis oleh mereka. Terima kasih sudah menulis untuk komunitas.</p>
    <p class="crew-head__meta">
      <span><strong>{data.meta.total}</strong> penulis</span>
      <span><strong>{totalArticles.toLocaleString('id-ID')}</strong> artikel</span>
      <span><strong>{compactNumber(totalViews)}</strong> kali dibaca</span>
    </p>
  </header>

  {#if spotlight}
    <section class="spot" aria-labelledby="spot-name">
      <a class="spot__face face" href={profileHref(spotlight)} tabindex="-1" aria-hidden="true">{@render face(spotlight, 160)}</a>
      <div class="spot__body">
        <h2 id="spot-name"><a href={profileHref(spotlight)}>{spotlight.name}</a></h2>
        <p class="spot__honor">
          <i class="bi bi-award-fill" aria-hidden="true"></i>
          {#if (spotlight.articles30d ?? 0) > 0}Penulis paling produktif bulan ini · {spotlight.articles30d} artikel{:else}Terakhir menerbitkan artikel{/if}
        </p>
        {#if spotlight.description}<p class="spot__bio">{spotlight.description}</p>{/if}
        {#if spotlight.beats?.length}
          <p class="spot__beats">Menulis tentang {spotlight.beats.map((b) => b.name).join(' dan ')}.</p>
        {/if}
        <dl class="spot__stats">
          <div><dt>Total artikel</dt><dd>{spotlight.totalArticles.toLocaleString('id-ID')}</dd></div>
          <div><dt>Dibaca</dt><dd>{compactNumber(spotlight.totalViews)}</dd></div>
          {#if spotlight.latestPublishDate}<div><dt>Terakhir terbit</dt><dd>{timeAgo(spotlight.latestPublishDate)}</dd></div>{/if}
        </dl>
        <a class="theme-btn theme-btn--primary theme-btn--sm" href={profileHref(spotlight)}>Lihat profil {spotlight.name} <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
      </div>
      {#if spotlight.latestArticle}
        <a class="spot__latest" href={articleHref(spotlight.latestArticle)}>
          <span class="spot__latest-img">
            <img src={imgUrl(spotlight.latestArticle.image, 640) ?? '/images/noimage.png'} srcset={imgSrcset(spotlight.latestArticle.image, 320)} sizes="320px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
          </span>
          <span class="spot__latest-label">Tulisan terbaru</span>
          <strong>{spotlight.latestArticle.title}</strong>
        </a>
      {/if}
    </section>
  {/if}

  {#if others.length}
    <section class="crew-all" aria-labelledby="crew-all-h">
      <div class="crew-bar">
        <h2 id="crew-all-h">{spotlight ? 'Penulis lainnya' : 'Semua penulis'}</h2>
        <div class="crew-sort" role="group" aria-label="Urutkan penulis">
          <a href="/author" class:is-active={data.sort === 'active'} aria-current={data.sort === 'active' ? 'true' : undefined}>Paling aktif</a>
          <a href="/author?sort=views" class:is-active={data.sort === 'views'} aria-current={data.sort === 'views' ? 'true' : undefined}>Paling dibaca</a>
        </div>
      </div>

      <ul class="crew-grid">
        {#each others as w (w.id)}
          <li class="card-w">
            <a class="card-w__face face" href={profileHref(w)} tabindex="-1" aria-hidden="true">
              {@render face(w, 88)}
              {#if recent(w)}<span class="card-w__live" title="Menerbitkan artikel minggu ini"></span>{/if}
            </a>
            <h3 class="card-w__name"><a href={profileHref(w)}>{w.name}</a></h3>
            <p class="card-w__handle">
              @{w.username ?? w.id}
              {#if w.role === 'admin'}<span class="card-w__role">Redaksi</span>{/if}
            </p>
            {#if w.description}<p class="card-w__bio">{w.description}</p>{/if}
            {#if w.beats?.length}
              <p class="card-w__beats">
                {#each w.beats as b (b.slug)}<span>{b.name} <small>{share(w, b.count)}%</small></span>{/each}
              </p>
            {/if}
            <dl class="card-w__stats">
              <div><dt>Artikel</dt><dd>{w.totalArticles.toLocaleString('id-ID')}</dd></div>
              <div><dt>Dibaca</dt><dd>{compactNumber(w.totalViews)}</dd></div>
              <div><dt>Terbit</dt><dd>{w.latestPublishDate ? timeAgo(w.latestPublishDate) : '—'}</dd></div>
            </dl>
            {#if w.latestArticle}
              <p class="card-w__latest">
                <span>Tulisan terbaru</span>
                <a href={articleHref(w.latestArticle)}>{w.latestArticle.title}</a>
              </p>
            {/if}
            <a class="theme-btn theme-btn--see-all theme-btn--sm card-w__cta" href={profileHref(w)}>Lihat profil</a>
          </li>
        {/each}
      </ul>

      {#if data.meta.totalPages > 1}
        <div class="crew-pager"><Pagination currentPage={data.meta.page} totalPages={data.meta.totalPages} {buildUrl} /></div>
      {/if}
    </section>
  {:else if !spotlight}
    <div class="crew-empty">
      <i class="bi bi-people" aria-hidden="true"></i>
      <h2>Daftar penulis belum bisa dimuat</h2>
      <p>Coba muat ulang halaman ini sebentar lagi.</p>
    </div>
  {/if}

  <section class="crew-join" aria-labelledby="crew-join-h">
    <div>
      <h2 id="crew-join-h">Mau menulis untuk {siteName}?</h2>
      <p>Kami selalu mencari penulis yang suka anime, game, cosplay, dan budaya Jepang. Ceritakan dirimu dan contoh tulisanmu.</p>
    </div>
    <a class="theme-btn theme-btn--primary" href="/contact?type=other"><i class="bi bi-pencil" aria-hidden="true"></i> Gabung jadi penulis</a>
  </section>
</div>

<style>
  .crew { padding-top: 1.5rem; padding-bottom: 3.5rem; }

  .crew-crumbs { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.75rem; font-size: 0.8125rem; color: #6b7280; }
  .crew-crumbs a { color: #4b5563; text-decoration: none; }
  .crew-crumbs a:hover { color: #1a1a1a; text-decoration: underline; }
  .crew-crumbs i { font-size: 0.65rem; }
  .crew-crumbs span { color: #1a1a1a; font-weight: 600; }

  .crew-head { max-width: 760px; margin-bottom: 2rem; }
  .crew-head h1 { margin: 0; font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; letter-spacing: -0.035em; line-height: 1.05; text-wrap: balance; }
  .crew-head__lead { max-width: 60ch; margin: 0.85rem 0 0; color: #374151; font-size: 1rem; line-height: 1.6; }
  .crew-head__meta { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; margin: 1rem 0 0; color: #4b5563; font-size: 0.875rem; font-variant-numeric: tabular-nums; }
  .crew-head__meta strong { color: #111; font-weight: 800; }

  .face { display: block; overflow: hidden; border-radius: 50%; background: var(--site-primary, #f1ff32); }
  .face img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .face__initials { display: grid; place-items: center; width: 100%; height: 100%; color: var(--site-primary-contrast, #111); font-weight: 900; letter-spacing: -0.03em; }

  /* Spotlight: the house dark panel, reserved for the month's most active writer. */
  .spot {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr) minmax(220px, 300px);
    gap: 2rem;
    align-items: center;
    margin-bottom: 3rem;
    padding: 2rem;
    border-radius: 24px;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 70%, transparent), transparent 42%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #101827 55%, #1f2937 100%);
    box-shadow: 0 18px 44px rgba(10, 10, 10, 0.16);
  }
  .spot__face { width: 160px; height: 160px; box-shadow: 0 0 0 4px var(--site-primary, #f1ff32); }
  .spot__face .face__initials { font-size: 3rem; }
  .spot__body { min-width: 0; }
  .spot h2 { margin: 0; font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 900; letter-spacing: -0.035em; line-height: 1.05; }
  .spot h2 a { color: #fff; text-decoration: none; }
  .spot h2 a:hover { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 3px; text-underline-offset: 5px; }
  .spot__honor { display: inline-flex; align-items: center; gap: 0.4rem; margin: 0.75rem 0 0; padding: 0.3rem 0.75rem; border-radius: 999px; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); font-size: 0.8125rem; font-weight: 800; }
  .spot__bio, .spot__beats { max-width: 56ch; margin: 0.85rem 0 0; color: rgba(255, 255, 255, 0.82); font-size: 0.9375rem; line-height: 1.55; }
  .spot__beats + .spot__stats, .spot__bio + .spot__stats { margin-top: 1.1rem; }
  .spot__stats { display: flex; flex-wrap: wrap; gap: 0.5rem 2rem; margin: 1.1rem 0 1.25rem; }
  .spot__stats dt { color: rgba(255, 255, 255, 0.65); font-size: 0.75rem; font-weight: 600; }
  .spot__stats dd { margin: 0.1rem 0 0; color: #fff; font-size: 1.25rem; font-weight: 800; font-variant-numeric: tabular-nums; }
  .spot__latest { display: grid; gap: 0.5rem; padding: 0.75rem; border-radius: 16px; background: rgba(255, 255, 255, 0.08); color: #fff; text-decoration: none; transition: background-color 160ms ease; }
  .spot__latest:hover { background: rgba(255, 255, 255, 0.14); }
  .spot__latest-img { display: block; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 10px; background: rgba(255, 255, 255, 0.06); }
  .spot__latest-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .spot__latest-label { color: var(--site-primary, #f1ff32); font-size: 0.75rem; font-weight: 800; }
  .spot__latest strong { font-size: 0.9375rem; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .spot a:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }

  .crew-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1.25rem; }
  .crew-bar h2 { margin: 0; font-size: 1.375rem; font-weight: 800; letter-spacing: -0.02em; }
  .crew-sort { display: inline-flex; gap: 0.2rem; padding: 0.2rem; border-radius: 999px; background: #f3f4f6; }
  .crew-sort a { display: inline-flex; align-items: center; min-height: 32px; padding: 0 0.85rem; border-radius: 999px; color: #4b5563; font-size: 0.8125rem; font-weight: 700; text-decoration: none; transition: background-color 160ms ease, color 160ms ease; }
  .crew-sort a:hover { color: #111; }
  .crew-sort a.is-active { background: var(--site-dark, #111); color: #fff; }

  .crew-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
  .card-w {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.75rem 1.25rem 1.25rem;
    border: 1px solid #ececec;
    border-radius: 20px;
    background: #fff;
    text-align: center;
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }
  .card-w:hover { border-color: #d6d6d6; box-shadow: 0 14px 32px rgba(10, 10, 10, 0.08); transform: translateY(-2px); }
  .card-w__face { position: relative; width: 88px; height: 88px; overflow: visible; box-shadow: 0 0 0 4px #fff, 0 0 0 5px #e5e7eb; }
  .card-w__face img, .card-w__face .face__initials { border-radius: 50%; font-size: 1.75rem; }
  .card-w__live { position: absolute; right: 2px; bottom: 4px; width: 16px; height: 16px; border: 3px solid #fff; border-radius: 50%; background: #16a34a; }
  .card-w__name { margin: 1rem 0 0; font-size: 1.1875rem; font-weight: 800; letter-spacing: -0.015em; }
  .card-w__name a { color: #111; text-decoration: none; }
  .card-w__name a:hover { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 3px; text-underline-offset: 4px; }
  .card-w__handle { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.4rem; margin: 0.2rem 0 0; color: #6b7280; font-size: 0.8125rem; }
  .card-w__role { padding: 0.1rem 0.45rem; border-radius: 6px; background: #111; color: #fff; font-size: 0.6875rem; font-weight: 800; }
  .card-w__bio { margin: 0.65rem 0 0; color: #4b5563; font-size: 0.875rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-w__beats { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.35rem; margin: 0.75rem 0 0; }
  .card-w__beats span { display: inline-flex; align-items: center; gap: 0.3rem; min-height: 26px; padding: 0 0.6rem; border: 1px solid #e5e7eb; border-radius: 999px; color: #374151; font-size: 0.75rem; font-weight: 700; }
  .card-w__beats small { color: #6b7280; font-size: 0.75rem; font-weight: 600; }
  .card-w__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; margin: 1rem 0 0; padding: 0.75rem 0; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; }
  .card-w__stats div + div { border-left: 1px solid #f0f0f0; }
  .card-w__stats dt { color: #6b7280; font-size: 0.6875rem; font-weight: 600; }
  .card-w__stats dd { margin: 0.1rem 0 0; color: #111; font-size: 0.9375rem; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 0.25rem; }
  .card-w__latest { display: grid; gap: 0.15rem; width: 100%; margin: 0.85rem 0 0; text-align: left; }
  .card-w__latest span { color: #6b7280; font-size: 0.6875rem; font-weight: 700; }
  .card-w__latest a { overflow: hidden; color: #111; font-size: 0.8125rem; font-weight: 700; line-height: 1.4; text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
  .card-w__latest a:hover { text-decoration: underline; }
  .card-w__cta { margin-top: auto; align-self: stretch; justify-content: center; }
  .card-w__latest + .card-w__cta, .card-w__stats + .card-w__cta { margin-top: 1rem; }

  .crew-pager { display: flex; justify-content: center; margin-top: 2rem; }

  .crew-empty { margin-top: 1.5rem; padding: 2.5rem 1.5rem; border: 1px dashed #d1d5db; border-radius: 18px; text-align: center; }
  .crew-empty > i { display: block; margin-bottom: 0.5rem; font-size: 1.75rem; color: #9ca3af; }
  .crew-empty h2 { margin: 0 0 0.35rem; font-size: 1.0625rem; font-weight: 800; }
  .crew-empty p { margin: 0; color: #6b7280; font-size: 0.875rem; }

  .crew-join { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem 2rem; margin-top: 3rem; padding: 1.75rem 2rem; border-radius: 20px; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .crew-join h2 { margin: 0; font-size: 1.375rem; font-weight: 900; letter-spacing: -0.02em; }
  .crew-join p { max-width: 58ch; margin: 0.35rem 0 0; font-size: 0.9375rem; line-height: 1.5; }
  .crew-join .theme-btn { background: var(--site-dark, #111); color: #fff; border-color: var(--site-dark, #111); }
  .crew-join .theme-btn:hover { background: #fff; color: #111; }

  .crew :is(a):focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  @media (max-width: 1199px) {
    .spot { grid-template-columns: 140px minmax(0, 1fr); }
    .spot__face { width: 140px; height: 140px; }
    .spot__latest { grid-column: 1 / -1; grid-template-columns: 160px minmax(0, 1fr); align-items: center; column-gap: 1rem; }
    .spot__latest-img { grid-row: 1 / span 2; }
  }
  @media (max-width: 991px) {
    .crew-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 575px) {
    .crew { padding-top: 1rem; }
    .spot { grid-template-columns: minmax(0, 1fr); gap: 1.25rem; padding: 1.5rem 1.25rem; border-radius: 20px; text-align: left; }
    .spot__face { width: 112px; height: 112px; }
    .spot__face .face__initials { font-size: 2.25rem; }
    .spot__latest { grid-template-columns: 112px minmax(0, 1fr); }
    .crew-grid { grid-template-columns: minmax(0, 1fr); }
    .crew-join { padding: 1.5rem 1.25rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .card-w { transition: none; }
    .card-w:hover { transform: none; }
  }
</style>
