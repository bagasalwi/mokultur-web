<script lang="ts">
  import type { PageData } from './$types';
  import type { CurhatanItem } from '$lib/api';
  import { PUBLIC_API_URL } from '$env/static/public';
  import CurhatCard from '$components/curhatan/CurhatCard.svelte';
  import CurhatForm from '$components/curhatan/CurhatForm.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';

  let items: CurhatanItem[] = data.curhatan;
  let meta = data.meta;
  let loadingMore = false;

  $: if (data.curhatan) {
    items = data.curhatan;
    meta = data.meta;
  }

  function handleSubmitted(e: CustomEvent<CurhatanItem>) {
    items = [e.detail, ...items];
  }

  async function loadMore() {
    if (!meta.hasMore || meta.nextCursor == null || loadingMore) return;
    loadingMore = true;
    try {
      const q = new URLSearchParams();
      q.set('cursor', String(meta.nextCursor));
      if (data.filter) q.set('filter', data.filter);
      const res = await fetch(`${PUBLIC_API_URL}/api/curhatan?${q}`);
      const json = await res.json();
      items = [...items, ...json.data];
      meta = json.meta;
    } catch {
      // fail silently
    } finally {
      loadingMore = false;
    }
  }

  const filterLabels: Record<string, string> = {
    daily: 'Paling disukai hari ini',
    weekly: 'Paling disukai minggu ini',
  };
</script>

<svelte:head>
  <title>Curhatan {siteName} — Cerita Jujur Komunitas</title>
  <meta name="description" content="Kumpulan cerita jujur dari komunitas {siteName}. Baca, upvote, dan bagikan ceritamu sendiri." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="/curhatan" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Curhatan {siteName} — Cerita Jujur Komunitas" />
  <meta property="og:description" content="Kumpulan cerita jujur dari komunitas {siteName}. Baca, upvote, dan bagikan ceritamu sendiri." />
  <meta property="og:url" content="/curhatan" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Curhatan {siteName} — Cerita Jujur Komunitas" />
  <meta name="twitter:description" content="Kumpulan cerita jujur dari komunitas {siteName}. Baca, upvote, dan bagikan ceritamu sendiri." />
</svelte:head>

<section class="section-md container-xl">
  <!-- Submit Hero -->
  <div id="submitCurhat" class="home-collab-card mb-4">
    <div class="row g-3 align-items-center">
      <div class="col-12 col-lg-5">
        <span class="badge badge-main mb-2">Curhatan {siteName}</span>
        <h1 class="home-collab-card__title text-white mb-1">Mau cerita apa hari ini?</h1>
        <p class="home-collab-card__description mb-3">
          Cerita jujurmu tentang apapun — anonim atau tidak. Dibaca, didengar, dan disukai komunitas.
        </p>
        <div class="home-collab-card__chips">
          <span><i class="bi bi-incognito"></i> Boleh anonim</span>
          <span><i class="bi bi-shield-check"></i> Aman</span>
          <span><i class="bi bi-chat-heart"></i> Dibaca komunitas</span>
        </div>
      </div>
      <div class="col-12 col-lg-7">
        <div class="home-collab-card__panel">
          <CurhatForm {siteName} user={data.user ?? null} on:submitted={handleSubmitted} />
        </div>
      </div>
    </div>
  </div>

  <!-- Filter Bar -->
  <div class="curhat-filter-bar mb-3">
    <div class="curhat-filter-bar__tabs">
      <a href="/curhatan" class="curhat-filter-pill" class:curhat-filter-pill--active={!data.filter}>
        Terbaru
      </a>
      <a href="/curhatan?filter=daily" class="curhat-filter-pill" class:curhat-filter-pill--active={data.filter === 'daily'}>
        <i class="bi bi-heart-fill"></i> Paling disukai hari ini
      </a>
      <a href="/curhatan?filter=weekly" class="curhat-filter-pill" class:curhat-filter-pill--active={data.filter === 'weekly'}>
        <i class="bi bi-heart-fill"></i> Paling disukai minggu ini
      </a>
    </div>
    <span class="curhat-filter-bar__count">{meta.total.toLocaleString('id-ID')} curhatan</span>
  </div>

  <!-- Masonry Grid -->
  {#if items.length > 0}
    <div class="curhat-masonry">
      {#each items as item (item.id)}
        <div class="curhat-masonry__item">
          <CurhatCard {item} excerptLimit={240} />
        </div>
      {/each}
    </div>
  {:else}
    <div class="curhat-empty">
      <i class="bi bi-chat-dots curhat-empty__icon"></i>
      <h5 class="curhat-empty__title mb-1">Sepi nih..</h5>
      <p class="curhat-empty__description mb-0">
        {#if data.filter}
          Belum ada yang masuk filter "{filterLabels[data.filter] ?? data.filter}".
        {:else}
          Jadi yang pertama nulis di sini?
        {/if}
      </p>
    </div>
  {/if}

  <!-- Load More -->
  {#if meta.hasMore && meta.nextCursor != null}
    <div class="curhat-load-more-wrap">
      <button type="button" class="theme-btn theme-btn--dark" on:click={loadMore} disabled={loadingMore}>
        {#if loadingMore}
          <i class="bi bi-hourglass-split"></i> Memuat...
        {:else}
          <span class="curhat-load-more__label">Muat lebih banyak</span>
          <i class="bi bi-arrow-down"></i>
        {/if}
      </button>
    </div>
  {/if}
</section>
