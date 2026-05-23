<script lang="ts">
  import type { PageData } from './$types';
  import Pagination from '$components/common/Pagination.svelte';

  export let data: PageData;

  $: isFirstPage = data.page === 1;
  $: isSearch = !!data.search;
  $: lead = isFirstPage && !isSearch && data.articles.length > 0 ? data.articles[0] : null;
  $: supporting = isFirstPage && !isSearch ? data.articles.slice(1, 5) : [];
  $: remaining = isFirstPage && !isSearch ? data.articles.slice(5) : [];
  $: flatArticles = !isFirstPage || isSearch ? data.articles : [];

  function buildUrl(page: number): string {
    const q = new URLSearchParams({ page: String(page) });
    if (data.search) q.set('search', data.search);
    return `/category/${data.category.slug}?${q}`;
  }

  function timeAgo(d: string | null): string {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }
</script>

<svelte:head>
  <title>
    {isSearch ? `Cari "${data.search}" di ${data.category.name}` : data.category.name} - {data.settings?.site_name ?? 'Mokultur'}
  </title>
  <meta name="description" content={data.category.description ?? `Artikel kategori ${data.category.name}`} />
  {#if !isSearch}
    <link rel="canonical" href="/category/{data.category.slug}" />
    <meta name="robots" content="index, follow" />
  {:else}
    <meta name="robots" content="noindex, follow" />
  {/if}
  {#if !isSearch}
    {#if data.meta.page > 1}
      <link rel="prev" href="/category/{data.category.slug}?page={data.meta.page - 1}" />
    {/if}
    {#if data.meta.page < data.meta.totalPages}
      <link rel="next" href="/category/{data.category.slug}?page={data.meta.page + 1}" />
    {/if}
  {/if}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={data.seo?.og.title ?? data.category.name} />
  <meta property="og:description" content={data.seo?.og.description ?? (data.category.description ?? `Artikel kategori ${data.category.name}`)} />
  <meta property="og:url" content={data.seo?.og.url ?? `/category/${data.category.slug}`} />
  {#if data.seo?.og.image}<meta property="og:image" content={data.seo.og.image} />{/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={data.seo?.twitter.title ?? data.category.name} />
  <meta name="twitter:description" content={data.seo?.twitter.description ?? (data.category.description ?? `Artikel kategori ${data.category.name}`)} />
  {#if data.seo?.twitter.image}<meta name="twitter:image" content={data.seo.twitter.image} />{/if}
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': isSearch ? 'SearchResultsPage' : 'CollectionPage',
    name: data.seo?.title ?? data.category.name,
    description: data.category.description ?? undefined,
    url: data.seo?.canonical ?? `/category/${data.category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: data.articles.slice(0, 10).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `/article/${a.id}/${a.slug}`,
        name: a.title,
      })),
    },
  })}<\/script>`}
</svelte:head>

<section class="section-md container-xl archive-page">
  <!-- Archive Hero -->
  <div class="archive-hero archive-hero--category mb-4">
    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-7">
        <span class="badge badge-main mb-3">{isSearch ? 'Category Search' : 'Category'}</span>
        <h1 class="archive-hero__title mb-2">{data.category.name}</h1>
        <p class="archive-hero__description mb-4">
          {#if isSearch}
            Menampilkan hasil pencarian yang relevan di dalam kategori {data.category.name}.
          {:else}
            {data.category.description || `Semua artikel kategori ${data.category.name} terkurasi di sini dengan tampilan arsip editorial yang lebih rapi.`}
          {/if}
        </p>
        <div class="archive-hero__chips">
          <span>{data.meta.total.toLocaleString('id-ID')} artikel</span>
          {#if lead}
            <span>Terbaru: {timeAgo(lead.publishDate)}</span>
          {/if}
        </div>
      </div>

      <div class="col-12 col-lg-5">
        <div class="archive-search-card">
          <span class="badge badge-main mb-2">Cari di Kategori</span>
          <h2 class="h5 fw-bold text-white mb-3">Temukan artikel {data.category.name}</h2>
          <form action="/category/{data.category.slug}" method="GET">
            <div class="search-field-mokultur archive-search-card__field">
              <span class="search-icon-prefix"><i class="bi bi-search"></i></span>
              <input
                type="text"
                class="search-input-mokultur"
                name="search"
                placeholder="Cari topik di kategori ini..."
                value={data.search ?? ''}
                autocomplete="off"
              />
            </div>
            <div class="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" class="theme-btn theme-btn--surface px-4">
                <i class="bi bi-search"></i> Cari
              </button>
              {#if isSearch}
                <a href="/category/{data.category.slug}" class="theme-btn theme-btn--ghost px-4">
                  <i class="bi bi-arrow-counterclockwise"></i> Reset
                </a>
              {/if}
            </div>
          </form>
          <p class="archive-search-card__meta text-white-50 mb-0">
            {data.meta.total.toLocaleString('id-ID')} artikel ditemukan di kategori ini.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main content row -->
  <div class="row g-4">
    <div class="col-12 col-lg-8">
      <div class="archive-section card border-0">
        <div class="card-body p-4">

          {#if isFirstPage && !isSearch && lead}
            <!-- Feature card -->
            <article class="archive-feature-card archive-feature-card--category mb-4">
              <a href="/article/{lead.id}/{lead.slug}" class="archive-feature-card__media d-block text-decoration-none">
                <div>
                  <img
                    src={lead.image ?? '/images/noimage.png'}
                    alt={lead.title}
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                    on:error={imgFallback}
                  />
                </div>
              </a>
              <div class="archive-feature-card__content">
                {#if lead.category}
                  <span class="badge badge-main mb-2">{lead.category.name}</span>
                {/if}
                <h2>
                  <a class="text-dark text-decoration-none" href="/article/{lead.id}/{lead.slug}">
                    {lead.title}
                  </a>
                </h2>
                {#if lead.description}
                  <p class="archive-section__intro mb-2">{lead.description}</p>
                {/if}
                <small><time datetime={lead.publishDate ?? ''}>{timeAgo(lead.publishDate)}</time></small>
              </div>
            </article>

            <!-- Supporting grid (items 2–5) -->
            {#if supporting.length > 0}
              <div class="row g-0 mt-0 mb-4">
                {#each supporting as item}
                  <div class="col-6 col-md-3">
                    <a href="/article/{item.id}/{item.slug}" class="article-card-link">
                      <div class="article-card">
                        <div class="article-card-img">
                          <img
                            src={item.image ?? '/images/noimage.png'}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            on:error={imgFallback}
                          />
                        </div>
                        <div class="article-card-body">
                          {#if item.category}
                            <span class="badge badge-main">{item.category.name}</span>
                          {/if}
                          <h6 class="article-card-title">{item.title}</h6>
                          <span class="article-card-date">{timeAgo(item.publishDate)}</span>
                        </div>
                      </div>
                    </a>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Remaining articles -->
            {#if remaining.length > 0}
              <div class="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-2 mb-3">
                <div>
                  <span class="badge badge-main mb-2">More from {data.category.name}</span>
                  <h2 class="h4 fw-boldest mb-0">Artikel Lainnya</h2>
                </div>
              </div>
              <div class="row g-0">
                {#each remaining as item}
                  <div class="col-6 col-sm-6 col-md-6 col-lg-4">
                    <a href="/article/{item.id}/{item.slug}" class="article-card-link">
                      <div class="article-card">
                        <div class="article-card-img">
                          <img
                            src={item.image ?? '/images/noimage.png'}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            on:error={imgFallback}
                          />
                        </div>
                        <div class="article-card-body">
                          {#if item.category}
                            <span class="badge badge-main">{item.category.name}</span>
                          {/if}
                          <h6 class="article-card-title">{item.title}</h6>
                          <span class="article-card-date">{timeAgo(item.publishDate)}</span>
                        </div>
                      </div>
                    </a>
                  </div>
                {/each}
              </div>
            {/if}

          {:else}
            <!-- Pages 2+ or search results -->
            <div class="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-2 mb-4">
              <div>
                <span class="badge badge-main mb-2">{isSearch ? 'Filtered Archive' : 'Archive'}</span>
                <h2 class="h4 fw-boldest mb-0">
                  {isSearch ? 'Hasil pencarian di kategori ini' : `Artikel di kategori ${data.category.name}`}
                </h2>
              </div>
            </div>

            {#if flatArticles.length > 0}
              <div class="row g-0">
                {#each flatArticles as item}
                  <div class="col-6 col-sm-6 col-md-6 col-lg-4">
                    <a href="/article/{item.id}/{item.slug}" class="article-card-link">
                      <div class="article-card">
                        <div class="article-card-img">
                          <img
                            src={item.image ?? '/images/noimage.png'}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            on:error={imgFallback}
                          />
                        </div>
                        <div class="article-card-body">
                          {#if item.category}
                            <span class="badge badge-main">{item.category.name}</span>
                          {/if}
                          <h6 class="article-card-title">{item.title}</h6>
                          <span class="article-card-date">{timeAgo(item.publishDate)}</span>
                        </div>
                      </div>
                    </a>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-5">
                <i class="bi bi-search fs-1 text-muted d-block mb-3"></i>
                <h3 class="h5 mb-2">Belum ada artikel yang cocok</h3>
                <p class="text-muted mb-0">Coba kata kunci lain atau kembali ke halaman kategori untuk melihat artikel terbaru.</p>
              </div>
            {/if}
          {/if}

          <!-- Pagination -->
          {#if data.meta.totalPages > 1}
            <div class="d-flex justify-content-center mt-4">
              <Pagination currentPage={data.meta.page} totalPages={data.meta.totalPages} {buildUrl} />
            </div>
          {/if}

        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="col-12 col-lg-4 archive-sidebar-stack">
      {#if data.popularArticles.length > 0}
        <div class="archive-sidebar-card card border-0">
          <div class="card-body p-4">
            <span class="badge badge-main mb-2">Popular Now</span>
            <h3 class="h5 fw-bold mb-3">Populer</h3>
            <div class="archive-sidebar-card__list">
              {#each data.popularArticles as item}
                <a href="/article/{item.id}/{item.slug}" class="archive-sidebar-card__item text-decoration-none">
                  <div class="archive-sidebar-card__image">
                    <img
                      src={item.image ?? '/images/noimage.png'}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      on:error={imgFallback}
                    />
                  </div>
                  <div class="flex-grow-1">
                    {#if item.category}
                      <span class="badge badge-main mb-2">{item.category.name}</span>
                    {/if}
                    <strong class="d-block">{item.title}</strong>
                    <small>{timeAgo(item.publishDate)}</small>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
