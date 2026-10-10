<script lang="ts">
  import type { PageData } from './$types';
  import LatestList from '$components/home/LatestList.svelte';
  import Pagination from '$components/common/Pagination.svelte';
  import AdBanner from '$components/common/AdBanner.svelte';
  import SocialFollowCard from '$components/sidebar/SocialFollowCard.svelte';
  import GoogleNewsFollow from '$components/sidebar/GoogleNewsFollow.svelte';
  import NewsletterSignup from '$components/sidebar/NewsletterSignup.svelte';
  import ContactCard from '$components/sidebar/ContactCard.svelte';
  import MediaPartnerCard from '$components/sidebar/MediaPartnerCard.svelte';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: categories = data.categories ?? [];
  $: activeCategory = categories.find((c) => c.slug === data.category) ?? null;
  $: heading = activeCategory ? `Semua Artikel ${activeCategory.name}` : data.reviewOnly ? 'Semua Review' : 'Semua Artikel';
  $: title = `${heading}${data.page > 1 ? ` · Halaman ${data.page}` : ''}`;
  $: description = `Semua artikel ${siteName}: berita, review, event, dan budaya pop Jepang, dari yang terbaru.`;

  function link(changes: { category?: string | null; reviewOnly?: boolean; page?: number }): string {
    const category = changes.category !== undefined ? changes.category : data.category || null;
    const reviewOnly = changes.reviewOnly !== undefined ? changes.reviewOnly : data.reviewOnly;
    const page = changes.page ?? 1;
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (reviewOnly) params.set('reviewOnly', 'true');
    if (page > 1) params.set('page', String(page));
    return `/index-article${params.size ? `?${params}` : ''}`;
  }
  const buildUrl = (page: number) => link({ page });
  $: canonical = absoluteUrl(data.indexable ? buildUrl(data.page) : '/index-article');
</script>

<svelte:head>
  <title>{title} - {siteName}</title>
  <meta name="description" content={description} />
  <meta name="robots" content={data.indexable ? 'index, follow' : 'noindex, follow'} />
  <link rel="canonical" href={canonical} />
  {#if data.indexable && data.page > 1}<link rel="prev" href={absoluteUrl(buildUrl(data.page - 1))} />{/if}
  {#if data.indexable && data.page < data.meta.totalPages}<link rel="next" href={absoluteUrl(buildUrl(data.page + 1))} />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{title} - {siteName}" />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content={data.settings?.og_image ? 'summary_large_image' : 'summary'} />
  {#if data.settings?.og_image}
    <meta property="og:image" content={data.settings.og_image} />
    <meta name="twitter:image" content={data.settings.og_image} />
  {/if}
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: canonical,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: data.articles.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/article/${a.id}/${a.slug}`), name: a.title })),
    },
  })}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Semua Artikel', path: '/index-article' }]))}<\/script>`}
</svelte:head>

<div class="ix container-xl">
  <header class="ix-head">
    <nav class="ix-crumbs" aria-label="Breadcrumb">
      <a href="/">Beranda</a><i class="bi bi-chevron-right" aria-hidden="true"></i><span aria-current="page">Semua Artikel</span>
    </nav>
    <div class="ix-head__row">
      <div class="ix-head__text">
        <h1>{heading}</h1>
        <p class="ix-head__meta">{data.meta.total.toLocaleString('id-ID')} artikel, diurutkan dari yang terbaru</p>
      </div>
      <form class="ix-find" role="search" action="/search" method="GET">
        <label class="visually-hidden" for="ix-find-q">Cari artikel</label>
        <i class="bi bi-search" aria-hidden="true"></i>
        <input id="ix-find-q" name="q" type="search" placeholder="Cari artikel, topik, atau penulis…" autocomplete="off" minlength="2" required enterkeyhint="search" />
        <button type="submit" aria-label="Cari"><i class="bi bi-arrow-right" aria-hidden="true"></i></button>
      </form>
    </div>
    <nav class="ix-chips" aria-label="Saring kategori">
      <ul>
        <li><a href={link({ category: null, reviewOnly: false })} class:is-active={!data.category && !data.reviewOnly} aria-current={!data.category && !data.reviewOnly ? 'true' : undefined}>Semua</a></li>
        {#if data.reviewOnly}<li><a href={link({ reviewOnly: false })} class="is-active" aria-label="Hapus filter review">Hanya review <i class="bi bi-x" aria-hidden="true"></i></a></li>{/if}
        {#each categories as c (c.slug)}
          <li><a href={link({ category: c.slug, reviewOnly: false })} class:is-active={data.category === c.slug} aria-current={data.category === c.slug ? 'true' : undefined}>{c.name}</a></li>
        {/each}
      </ul>
    </nav>
  </header>

  <div class="ix-grid">
    <section class="ix-main" aria-label="Daftar artikel">
      {#if data.failed}
        <div class="ix-empty" role="alert">
          <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
          <h2>Daftar artikel belum bisa dimuat</h2>
          <p>Coba muat ulang halaman ini sebentar lagi.</p>
        </div>
      {:else if data.articles.length}
        <LatestList articles={data.articles} showCategory={!activeCategory} />
        {#if data.meta.totalPages > 1}
          <div class="ix-pager"><Pagination currentPage={data.page} totalPages={data.meta.totalPages} {buildUrl} /></div>
        {/if}
      {:else}
        <div class="ix-empty">
          <i class="bi bi-journal" aria-hidden="true"></i>
          <h2>Belum ada artikel{#if activeCategory} {activeCategory.name}{/if}</h2>
          <p>Artikel yang baru terbit akan muncul di sini.</p>
          <a class="theme-btn theme-btn--see-all theme-btn--sm" href="/index-article"><i class="bi bi-x-lg" aria-hidden="true"></i> Lihat semua artikel</a>
        </div>
      {/if}
    </section>

    <aside class="ix-aside" aria-label="Tentang {siteName}">
      <SocialFollowCard socials={data.socials ?? []} {siteName} />
      <GoogleNewsFollow settings={data.settings} />
      <NewsletterSignup source="index" />
      <ContactCard settings={data.settings} />
      <MediaPartnerCard partners={data.partners} total={data.partnerTotal} />
      <AdBanner ad={data.adSidebar} adSlot="ad_2" size="sidebar" />
    </aside>
  </div>
</div>

<style>
  .ix { padding-top: 1.5rem; padding-bottom: 3.5rem; }

  .ix-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-bottom: 0.75rem; font-size: 0.8125rem; color: #6b7280; }
  .ix-crumbs a { color: #4b5563; text-decoration: none; }
  .ix-crumbs a:hover { color: #1a1a1a; text-decoration: underline; }
  .ix-crumbs i { font-size: 0.65rem; }
  .ix-crumbs span { color: #1a1a1a; font-weight: 600; }

  .ix-head { padding-bottom: 1.25rem; margin-bottom: 1.75rem; border-bottom: 1px solid #ececec; }
  .ix-head__row { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem 2rem; }
  .ix-head__text { flex: 1 1 380px; min-width: 0; }
  .ix-head h1 { margin: 0; font-size: clamp(1.75rem, 3vw, 2.25rem); font-weight: 800; letter-spacing: -0.025em; line-height: 1.1; }
  .ix-head__meta { margin: 0.5rem 0 0; color: #6b7280; font-size: 0.875rem; font-variant-numeric: tabular-nums; }

  .ix-find { position: relative; display: flex; align-items: center; flex: 0 1 320px; min-width: 220px; height: 40px; border: 1px solid #d1d5db; border-radius: 999px; background: #fff; transition: border-color 160ms ease, box-shadow 160ms ease; }
  .ix-find:focus-within { border-color: var(--site-dark, #111); box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-primary, #f1ff32) 55%, transparent); }
  .ix-find > i { position: absolute; left: 0.9rem; color: #9ca3af; font-size: 0.875rem; }
  .ix-find input { flex: 1; min-width: 0; height: 100%; padding: 0 0.5rem 0 2.25rem; border: 0; background: transparent; font-size: 0.875rem; color: #1a1a1a; outline: none; }
  .ix-find button { display: grid; place-items: center; width: 32px; height: 32px; margin-right: 4px; border: 0; border-radius: 50%; background: var(--site-dark, #111); color: #fff; transition: background-color 160ms ease, color 160ms ease; }
  .ix-find button:hover, .ix-find button:focus-visible { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .ix-chips { margin-top: 1.25rem; }
  .ix-chips ul { display: flex; gap: 0.4rem; margin: 0; padding: 0 0 0.25rem; list-style: none; overflow-x: auto; scrollbar-width: none; }
  .ix-chips ul::-webkit-scrollbar { display: none; }
  .ix-chips a { display: inline-flex; align-items: center; gap: 0.35rem; min-height: 36px; padding: 0 0.9rem; border: 1px solid #e5e7eb; border-radius: 999px; background: #fff; color: #374151; font-size: 0.8125rem; font-weight: 700; white-space: nowrap; text-decoration: none; transition: border-color 160ms ease, background-color 160ms ease; }
  .ix-chips a:hover { border-color: var(--site-dark, #111); color: #1a1a1a; }
  .ix-chips a.is-active { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .ix-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 330px); gap: 2.5rem; align-items: start; }
  .ix-main { min-width: 0; }
  .ix-pager { display: flex; justify-content: center; margin-top: 2rem; }
  .ix-aside { display: grid; gap: 0 1.25rem; }

  .ix-empty { padding: 2.5rem 1.5rem; border: 1px dashed #d1d5db; border-radius: 18px; text-align: center; }
  .ix-empty > i { display: block; margin-bottom: 0.5rem; font-size: 1.75rem; color: #9ca3af; }
  .ix-empty h2 { margin: 0 0 0.35rem; font-size: 1.0625rem; font-weight: 800; }
  .ix-empty p { max-width: 46ch; margin: 0 auto 1rem; color: #6b7280; font-size: 0.875rem; }

  .ix :is(a, button):focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  @media (max-width: 991px) {
    .ix-grid { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
    .ix-aside { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: start; }
  }
  @media (max-width: 575px) {
    .ix { padding-top: 1rem; }
    .ix-find { flex: 1 1 100%; }
  }
</style>
