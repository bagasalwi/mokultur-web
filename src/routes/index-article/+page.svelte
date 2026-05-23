<script lang="ts">
  import type { PageData } from './$types';
  import ArticleCard from '$components/articles/ArticleCard.svelte';
  import Pagination from '$components/common/Pagination.svelte';
  import PopularTags from '$components/common/PopularTags.svelte';
  import AdBanner from '$components/common/AdBanner.svelte';

  export let data: PageData;

  $: isSearch = !!data.search;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: metaTitle = isSearch
    ? `Cari "${data.search}" - Indeks Artikel - ${siteName}`
    : `Indeks Artikel - ${siteName}`;
  $: metaDesc = isSearch
    ? `Hasil pencarian artikel untuk "${data.search}" di ${siteName}.`
    : `Jelajahi indeks artikel ${siteName} dari berbagai kategori, tema, dan topik terbaru.`;

  function buildUrl(page: number): string {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (data.search) params.set('search', data.search);
    if (data.category) params.set('category', data.category);
    if (data.reviewOnly) params.set('reviewOnly', 'true');
    return `/index-article?${params}`;
  }
</script>

<svelte:head>
  <title>{metaTitle}</title>
  <meta name="description" content={metaDesc} />
  <meta name="robots" content={isSearch ? 'noindex, follow' : 'index, follow'} />
</svelte:head>

<div class="section-md container-xl archive-page">
  <nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb small mb-0">
      <li class="breadcrumb-item"><a href="/" class="text-muted text-decoration-none">Home</a></li>
      <li class="breadcrumb-item active text-muted" aria-current="page">Indeks Artikel</li>
    </ol>
  </nav>

  <div class="archive-hero archive-hero--index mb-4">
    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-7">
        <span class="badge badge-main mb-3">{isSearch ? 'Search Results' : 'Editorial Archive'}</span>
        <h1 class="archive-hero__title mb-2">
          {isSearch ? `Hasil untuk "${data.search}"` : `Indeks Artikel ${siteName}`}
        </h1>
        <p class="archive-hero__description mb-4">
          {#if isSearch}
            Telusuri artikel yang paling relevan dari seluruh arsip {siteName}, lalu lanjutkan eksplorasi ke kategori yang paling dekat dengan pencarianmu.
          {:else}
            Semua artikel {siteName} terkumpul di sini. Temukan rilisan terbaru, review, event, dan kategori yang paling ramai dibahas.
          {/if}
        </p>
        {#if data.archiveCategories.length > 0}
          <div class="archive-hero__chips">
            {#each data.archiveCategories as cat}
              <a href="/category/{cat.slug}">{cat.name}</a>
            {/each}
          </div>
        {/if}
      </div>

      <div class="col-12 col-lg-5">
        <div class="archive-search-card">
          <span class="badge badge-main mb-2">Cari Artikel</span>
          <h2 class="h5 fw-bold text-white mb-3">Cari artikel favoritmu!</h2>
          <form method="GET" action="/index-article">
            <div class="search-field-mokultur archive-search-card__field">
              <span class="search-icon-prefix"><i class="bi bi-search"></i></span>
              <input
                type="text"
                name="search"
                class="search-input-mokultur"
                placeholder="Cari artikel, kategori, atau topik..."
                value={data.search}
                autocomplete="off"
              />
            </div>
            <div class="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" class="btn btn-light fw-bold d-inline-flex align-items-center gap-2 px-4 py-2">
                <i class="bi bi-search"></i> Cari
              </button>
              {#if isSearch}
                <a href="/index-article" class="btn btn-outline-light fw-bold d-inline-flex align-items-center gap-2 px-4 py-2">
                  <i class="bi bi-arrow-counterclockwise"></i> Reset
                </a>
              {/if}
            </div>
          </form>
          <p class="archive-search-card__meta mb-0">
            {data.meta.total.toLocaleString('id-ID')} artikel ditemukan di indeks.
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-4">
    <div class="col-12 col-lg-8">
      <div class="archive-section card border-0">
        <div class="card-body p-4">
          <div class="mb-4">
            <span class="badge badge-main mb-2">Archive Feed</span>
            <h2 class="h4 fw-boldest mb-0">
              {isSearch ? 'Artikel yang cocok dengan pencarianmu' : 'Artikel Terbaru dari Arsip'}
            </h2>
          </div>

          {#if data.articles.length > 0}
            <div class="row g-4">
              {#each data.articles as article}
                <div class="col-6 col-sm-6 col-md-6 col-lg-4">
                  <ArticleCard {article} variant="vertical" />
                </div>
              {/each}
            </div>
            <Pagination
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              {buildUrl}
            />
          {:else}
            <div class="py-5 text-center">
              <i class="bi bi-search display-4 mb-3 d-block text-muted"></i>
              <h3 class="h5 mb-2">Belum ada artikel yang cocok</h3>
              <p class="text-muted mb-0">Coba kata kunci lain atau jelajahi kategori yang sedang populer di arsip {siteName}.</p>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="col-12 col-lg-4 archive-sidebar-stack">
      <div class="sticky-top" style="top: 80px;">
        {#if data.editorPicks.length > 0}
          <div class="archive-sidebar-card card border-0 mb-4">
            <div class="card-body p-4">
              <span class="badge badge-main mb-2">Editors Pick</span>
              <h3 class="h5 fw-bold mb-3">Review</h3>
              <div class="archive-sidebar-card__list">
                {#each data.editorPicks as item}
                  <a href="/article/{item.id}/{item.slug}" class="archive-sidebar-card__item text-decoration-none">
                    <div class="archive-sidebar-card__image">
                      <img src={item.image ?? '/images/noimage.png'} alt={item.title} loading="lazy" decoding="async" />
                    </div>
                    <div class="flex-grow-1">
                      {#if item.category}<span class="badge badge-main mb-1">{item.category.name}</span>{/if}
                      <strong class="d-block">{item.title}</strong>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          </div>
        {/if}
        <PopularTags tags={data.popularTags} />
        <AdBanner ad={data.adSidebar} adSlot="ad_2" size="sidebar" />
      </div>
    </div>
  </div>
</div>
