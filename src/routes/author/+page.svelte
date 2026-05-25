<script lang="ts">
  import type { PageData } from './$types';
  import Pagination from '$components/common/Pagination.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';

  function timeAgo(d: string | null): string {
    if (!d) return 'Belum publish';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function truncate(s: string | null, n: number): string {
    if (!s) return '';
    return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
  }

  function buildUrl(page: number): string {
    return `/author?page=${page}`;
  }
</script>

<svelte:head>
  <title>Penulis - {siteName}</title>
  <meta name="description" content="Kenali para penulis dan kontributor di {siteName}." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="/author" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Penulis - {siteName}" />
  <meta property="og:description" content="Kenali para penulis dan kontributor di {siteName}." />
  <meta property="og:url" content="/author" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Penulis - {siteName}" />
  <meta name="twitter:description" content="Kenali para penulis dan kontributor di {siteName}." />
</svelte:head>

<div class="archive-page section-top container-xl">
  <nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb small mb-0">
      <li class="breadcrumb-item"><a href="/" class="text-muted text-decoration-none">Home</a></li>
      <li class="breadcrumb-item active text-muted" aria-current="page">Penulis</li>
    </ol>
  </nav>

  <!-- Archive Hero -->
  <div class="archive-hero mb-5">
    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-8">
        <span class="badge badge-main mb-3">Directory</span>
        <h1 class="archive-hero__title mb-3">Para Penulis {siteName}</h1>
        <p class="archive-hero__description mb-4">
          Temukan kontributor dan kreator konten yang memperkaya warna komunitas {siteName} lewat tulisan dan perspektif mereka.
        </p>
        <div class="archive-hero__chips">
          <span><i class="bi bi-people me-1"></i>{data.meta.total} kontributor</span>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="archive-search-card">
          <strong>{data.meta.total}</strong>
          <p class="mb-0">Penulis aktif yang sudah menerbitkan artikel di {siteName}.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Writers Grid -->
  {#if data.writers.length > 0}
    <div class="row g-4 mb-4">
      {#each data.writers as writer}
        <div class="col-12 col-md-6 col-xl-4">
          <a href="/@{writer.username ?? writer.id}" class="home-writer-card__item text-decoration-none d-flex align-items-center gap-3">
            <div class="home-writer-card__avatar">
              {#if writer.img}
                <img src={writer.img} alt={writer.name} loading="lazy" />
              {:else}
                <div class="writer-initial">{writer.name[0]?.toUpperCase()}</div>
              {/if}
            </div>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-items-center gap-2 mb-1">
                <strong class="text-dark">{writer.name}</strong>
                {#if writer.role === 'admin'}
                  <span class="badge bg-dark" style="font-size:0.6rem">Admin</span>
                {/if}
              </div>
              <span class="home-writer-card__handle">@{writer.username ?? writer.id}</span>
              {#if writer.description}
                <p class="mb-1 small text-muted" style="line-height:1.4; margin-top:0.25rem;">{truncate(writer.description, 96)}</p>
              {/if}
              <div class="d-flex gap-3 mt-1">
                <small class="text-muted"><i class="bi bi-file-text me-1"></i>{writer.totalArticles} artikel</small>
                <small class="text-muted"><i class="bi bi-eye me-1"></i>{writer.totalViews.toLocaleString('id-ID')}</small>
              </div>
              {#if writer.latestPublishDate}
                <span class="home-writer-card__meta">Terakhir publish {timeAgo(writer.latestPublishDate)}</span>
              {/if}
            </div>
          </a>
        </div>
      {/each}
    </div>
    <div class="d-flex justify-content-center">
      <Pagination currentPage={data.meta.page} totalPages={data.meta.totalPages} {buildUrl} />
    </div>
  {:else}
    <p class="text-muted">Belum ada penulis.</p>
  {/if}
</div>

<style>
  .writer-initial {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.25rem;
    color: #fff;
    background: #374151;
    border-radius: inherit;
  }
</style>
