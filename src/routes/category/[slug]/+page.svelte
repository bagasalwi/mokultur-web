<script lang="ts">
  import type { PageData } from './$types';
  import Pagination from '$components/common/Pagination.svelte';
  import SectionHead from '$components/ui/SectionHead.svelte';
  import NewsroomBlock from '$components/home/NewsroomBlock.svelte';
  import LatestList from '$components/home/LatestList.svelte';
  import PopularArticlesCard from '$components/common/PopularArticlesCard.svelte';
  import FollowTopic from '$components/reader/FollowTopic.svelte';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';
  import { timeAgo } from '$lib/format';
  import { paginationPath } from '$lib/pagination';
  import type { ReaderInterest } from '$lib/reader';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: category = data.category;
  $: base = `/category/${category.slug}`;
  $: isSearch = !!data.search;
  $: isPopular = data.sort === 'popular';
  // The lead block only makes sense on the front page of the latest view.
  $: showFeature = data.page === 1 && !isSearch && !isPopular && data.articles.length >= 3;
  $: featured = showFeature ? data.articles.slice(0, 5) : [];
  $: listed = showFeature ? data.articles.slice(5) : data.articles;
  $: newest = !isPopular && !isSearch && data.page === 1 ? data.articles[0] : null;
  $: canonicalUrl = absoluteUrl(paginationPath(base, isSearch || isPopular ? 1 : data.meta.page));
  $: description = category.description || `Berita dan ulasan ${category.name} terbaru dari ${siteName}.`;

  let interests: ReaderInterest[] = [];
  $: interests = data.interests;
  $: followed = !!data.interest && interests.includes(data.interest);
  $: returnTo = `${base}${data.page > 1 ? `?page=${data.page}` : ''}`;

  $: listTitle = isSearch
    ? `Hasil “${data.search}”`
    : isPopular
      ? `Terpopuler di ${category.name}`
      : data.page > 1
        ? `${category.name} · Halaman ${data.page}`
        : `Terbaru di ${category.name}`;

  function href(page: number, sort = data.sort): string {
    const q = new URLSearchParams();
    if (data.search) q.set('search', data.search);
    if (sort === 'popular') q.set('sort', 'popular');
    if (page > 1) q.set('page', String(page));
    return `${base}${q.size ? `?${q}` : ''}`;
  }
  const buildUrl = (page: number) => href(page);
</script>

<svelte:head>
  <title>{isSearch ? `Cari "${data.search}" di ${category.name}` : `${category.name}${data.page > 1 ? ` · Halaman ${data.page}` : ''}`} - {siteName}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  {#if isSearch || isPopular}
    <meta name="robots" content="noindex, follow" />
  {:else}
    <meta name="robots" content="index, follow" />
    {#if data.meta.page > 1}<link rel="prev" href={absoluteUrl(paginationPath(base, data.meta.page - 1))} />{/if}
    {#if data.meta.page < data.meta.totalPages}<link rel="next" href={absoluteUrl(paginationPath(base, data.meta.page + 1))} />{/if}
  {/if}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={data.seo?.og.title ?? category.name} />
  <meta property="og:description" content={data.seo?.og.description ?? description} />
  <meta property="og:url" content={canonicalUrl} />
  {#if data.seo?.og.image}<meta property="og:image" content={data.seo.og.image} />{/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={data.seo?.twitter.title ?? category.name} />
  <meta name="twitter:description" content={data.seo?.twitter.description ?? description} />
  {#if data.seo?.twitter.image}<meta name="twitter:image" content={data.seo.twitter.image} />{/if}
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': isSearch ? 'SearchResultsPage' : 'CollectionPage',
    name: data.seo?.title ?? category.name,
    description: category.description ?? undefined,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: data.articles.slice(0, 10).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(`/article/${a.id}/${a.slug}`),
        name: a.title,
      })),
    },
  })}<\/script>`}
  {#if !isSearch}
    {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: category.name, path: base }]))}<\/script>`}
  {/if}
</svelte:head>

<div class="cat container-xl">
  <header class="cat-head">
    <nav class="cat-crumbs" aria-label="Breadcrumb">
      <a href="/">Beranda</a><i class="bi bi-chevron-right" aria-hidden="true"></i><span aria-current="page">{category.name}</span>
    </nav>

    <div class="cat-head__row">
      <div class="cat-head__text">
        <h1>{category.name}</h1>
        <p class="cat-head__desc">{description}</p>
        <p class="cat-head__meta">
          <span>{data.meta.total.toLocaleString('id-ID')} artikel</span>
          {#if newest}<span>Terbaru {timeAgo(newest.publishDate).toLowerCase()}</span>{/if}
        </p>
      </div>

      <div class="cat-head__tools">
        {#if data.interest}
          <FollowTopic interest={data.interest} label={category.name} bind:interests loggedIn={!!data.user} {returnTo} />
        {/if}
        <form class="cat-search" role="search" action={base} method="GET">
          <label class="visually-hidden" for="cat-search-input">Cari di {category.name}</label>
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="cat-search-input" name="search" type="search" placeholder="Cari di {category.name}…" value={data.search ?? ''} autocomplete="off" />
          {#if isPopular}<input type="hidden" name="sort" value="popular" />{/if}
          <button type="submit" class="cat-search__go" aria-label="Cari"><i class="bi bi-arrow-right" aria-hidden="true"></i></button>
        </form>
      </div>
    </div>

    {#if data.categories?.length}
      <nav class="cat-chips" aria-label="Kategori lain">
        <ul>
          <li><a href="/index-article">Semua</a></li>
          {#each data.categories as item (item.slug)}
            <li>
              <a href="/category/{item.slug}" class:is-active={item.slug === category.slug} aria-current={item.slug === category.slug ? 'page' : undefined}>{item.name}</a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
  </header>

  <div class="cat-grid">
    <div class="cat-main">
      {#if showFeature}
        <section class="cat-feature" aria-label="Sorotan {category.name}">
          <NewsroomBlock articles={featured} showCategory={false} />
        </section>
      {/if}

      <section aria-labelledby="cat-list-heading">
        <SectionHead title={listTitle} headingId="cat-list-heading">
          <div slot="action" class="cat-sort" role="group" aria-label="Urutkan">
            <a href={href(1, 'latest')} class:is-active={!isPopular} aria-current={!isPopular ? 'true' : undefined}>Terbaru</a>
            <a href={href(1, 'popular')} class:is-active={isPopular} aria-current={isPopular ? 'true' : undefined}>Terpopuler</a>
          </div>
        </SectionHead>

        {#if listed.length}
          <LatestList articles={listed} showCategory={false} />
        {:else if isSearch}
          <div class="cat-empty">
            <i class="bi bi-search" aria-hidden="true"></i>
            <h3>Tidak ada artikel “{data.search}” di {category.name}</h3>
            <p>Coba kata kunci lain, atau lihat semua artikel {category.name}.</p>
            <a class="theme-btn theme-btn--see-all theme-btn--sm" href={base}><i class="bi bi-x-lg" aria-hidden="true"></i> Hapus pencarian</a>
          </div>
        {:else if !showFeature}
          <div class="cat-empty">
            <i class="bi bi-journal" aria-hidden="true"></i>
            <h3>Belum ada artikel di sini</h3>
            <p>Artikel {category.name} yang baru terbit akan muncul di halaman ini.</p>
          </div>
        {/if}

        {#if data.meta.totalPages > 1}
          <div class="cat-pager">
            <Pagination currentPage={data.meta.page} totalPages={data.meta.totalPages} {buildUrl} />
          </div>
        {/if}
      </section>
    </div>

    <aside class="cat-aside" aria-label="Pelengkap {category.name}">
      <PopularArticlesCard
        title={data.popularScope === 'month' ? `Populer bulan ini` : `Populer di ${category.name}`}
        articles={data.popularArticles}
      />

      {#if data.interest && !followed}
        <section class="cat-follow">
          <h2>Ikuti {category.name}</h2>
          <p>Artikel {category.name} akan lebih sering muncul di feed <strong>Untuk Kamu</strong> milikmu.</p>
          <FollowTopic interest={data.interest} label={category.name} bind:interests loggedIn={!!data.user} {returnTo} tone="on-dark" />
        </section>
      {/if}
    </aside>
  </div>
</div>

<style>
  .cat { padding-top: 1.5rem; padding-bottom: 3.5rem; }

  .cat-crumbs { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.75rem; font-size: 0.8125rem; color: #6b7280; }
  .cat-crumbs a { color: #4b5563; text-decoration: none; }
  .cat-crumbs a:hover { color: #1a1a1a; text-decoration: underline; }
  .cat-crumbs i { font-size: 0.65rem; }
  .cat-crumbs span { color: #1a1a1a; font-weight: 600; }

  .cat-head { padding-bottom: 1.25rem; margin-bottom: 1.75rem; border-bottom: 1px solid #ececec; }
  .cat-head__row { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem 2rem; }
  .cat-head__text { flex: 1 1 420px; min-width: 0; }
  .cat-head h1 {
    margin: 0;
    font-size: clamp(1.75rem, 3vw, 2.25rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.1;
  }
  .cat-head__desc { margin: 0.5rem 0 0; max-width: 65ch; color: #4b5563; font-size: 0.9375rem; line-height: 1.55; }
  .cat-head__meta { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; margin: 0.6rem 0 0; color: #6b7280; font-size: 0.8125rem; font-variant-numeric: tabular-nums; }
  .cat-head__meta span + span::before { content: '·'; margin-right: 1rem; color: #d1d5db; }

  .cat-head__tools { display: flex; align-items: center; gap: 0.6rem; }
  .cat-search {
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 1 300px;
    min-width: 220px;
    height: 40px;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    background: #fff;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }
  .cat-search:focus-within { border-color: var(--site-dark, #111); box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-primary, #f1ff32) 55%, transparent); }
  .cat-search > i { position: absolute; left: 0.9rem; color: #9ca3af; font-size: 0.875rem; }
  .cat-search input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 0.5rem 0 2.25rem;
    border: 0;
    background: transparent;
    font-size: 0.875rem;
    color: #1a1a1a;
    outline: none;
  }
  .cat-search__go {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-right: 4px;
    border: 0;
    border-radius: 50%;
    background: var(--site-dark, #111);
    color: #fff;
    transition: background-color 160ms ease, color 160ms ease;
  }
  .cat-search__go:hover,
  .cat-search__go:focus-visible { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .cat-chips { margin-top: 1.25rem; }
  .cat-chips ul { display: flex; gap: 0.4rem; margin: 0; padding: 0 0 0.25rem; list-style: none; overflow-x: auto; scrollbar-width: none; }
  .cat-chips ul::-webkit-scrollbar { display: none; }
  .cat-chips a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 0.9rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #fff;
    color: #374151;
    font-size: 0.8125rem;
    font-weight: 700;
    white-space: nowrap;
    text-decoration: none;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .cat-chips a:hover { border-color: var(--site-dark, #111); color: #1a1a1a; }
  .cat-chips a.is-active { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .cat-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 2.5rem; align-items: start; }
  .cat-main { min-width: 0; }
  .cat-feature { padding-bottom: 2rem; margin-bottom: 2rem; border-bottom: 1px solid #ececec; }
  .cat-aside { position: sticky; top: 80px; display: grid; gap: 1.25rem; }

  .cat-sort { display: inline-flex; gap: 0.2rem; padding: 0.2rem; border-radius: 999px; background: #f3f4f6; }
  .cat-sort a {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 0.85rem;
    border-radius: 999px;
    color: #4b5563;
    font-size: 0.8125rem;
    font-weight: 700;
    text-decoration: none;
    transition: background-color 160ms ease, color 160ms ease;
  }
  .cat-sort a:hover { color: #1a1a1a; }
  .cat-sort a.is-active { background: var(--site-dark, #111); color: #fff; }

  .cat-empty { padding: 2.5rem 1.5rem; border: 1px dashed #d1d5db; border-radius: 18px; text-align: center; }
  .cat-empty > i { display: block; margin-bottom: 0.5rem; font-size: 1.75rem; color: #9ca3af; }
  .cat-empty h3 { margin: 0 0 0.35rem; font-size: 1.0625rem; font-weight: 800; }
  .cat-empty p { max-width: 46ch; margin: 0 auto 1rem; color: #6b7280; font-size: 0.875rem; }

  .cat-pager { display: flex; justify-content: center; margin-top: 2rem; }

  .cat-follow {
    padding: 1.25rem;
    border-radius: 18px;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 65%, transparent), transparent 45%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a), #101827 55%, #1f2937);
  }
  .cat-follow h2 { margin: 0; font-size: 1.125rem; font-weight: 800; color: #fff; }
  .cat-follow p { margin: 0.35rem 0 0.9rem; font-size: 0.8125rem; line-height: 1.5; color: rgba(255, 255, 255, 0.75); }
  .cat-follow strong { color: var(--site-primary, #f1ff32); }

  .cat :is(a, button):focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .cat-follow :global(:is(a, button):focus-visible) { outline: 3px solid #fff; outline-offset: 2px; }

  @media (max-width: 991px) {
    .cat-grid { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
    .cat-aside { position: static; }
  }
  @media (max-width: 575px) {
    .cat { padding-top: 1rem; }
    .cat-head__tools { width: 100%; flex-wrap: wrap; }
    .cat-search { flex: 1 1 100%; }
    .cat-feature { padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
  }
</style>
