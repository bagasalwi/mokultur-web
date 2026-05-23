<script lang="ts">
  import type { PageData } from './$types';
  import { PUBLIC_API_URL } from '$env/static/public';
  import CurhatCard from '$components/curhatan/CurhatCard.svelte';

  export let data: PageData;

  $: c = data.curhatan;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: slug = c.curhatan.substring(0, 60).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+$/, '');
  $: canonicalUrl = `${PUBLIC_API_URL}/curhat-${c.id}/${slug}`;
  $: metaDesc = c.curhatan.substring(0, 157) + (c.curhatan.length > 157 ? '…' : '');

  let likes = data.curhatan.like ?? 0;
  let voted = false;
  let laporOpen = false;
  let laporSelected: number | null = null;
  let laporLoading = false;
  let laporDone = false;

  async function handleUpvote() {
    if (voted) return;
    voted = true;
    likes += 1;
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/curhatan/${c.id}/upvote`, { method: 'POST' });
      const json = await res.json();
      likes = json.likes ?? likes;
    } catch {
      likes -= 1;
      voted = false;
    }
  }

  async function handleLapor() {
    if (!laporSelected || laporLoading) return;
    laporLoading = true;
    try {
      await fetch(`${PUBLIC_API_URL}/api/curhatan/${c.id}/lapor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laporan: laporSelected }),
      });
      laporDone = true;
    } catch {
      // fail silently
    } finally {
      laporLoading = false;
    }
  }

  const laporOptions = [
    { id: 1, label: 'Kekerasan / Ancaman' },
    { id: 2, label: 'Doxxing / Info Pribadi' },
    { id: 3, label: 'Ujaran Kebencian' },
  ];

  function formatDate(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }
</script>

<svelte:head>
  <title>Curhatan {c.curhatanDari} — {siteName}</title>
  <meta name="description" content={metaDesc} />
  <link rel="canonical" href={canonicalUrl} />
  {#if c.gambar}
    <meta property="og:image" content={c.gambar} />
    <meta name="twitter:image" content={c.gambar} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<section class="section-md container-xl">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10 col-xl-9">

      <div class="mb-3">
        <a href="/curhatan" class="curhat-backlink">
          <i class="bi bi-arrow-left"></i> Balik ke Curhatan
        </a>
      </div>

      <article class="home-collab-card curhat-detail-hero">
        {#if c.gambar}
          <figure class="curhat-detail-hero__media">
            <img src={c.gambar} loading="lazy" alt={c.curhatan.substring(0, 60)} />
          </figure>
        {/if}

        <span class="curhat-detail-hero__quote" aria-hidden="true">&ldquo;</span>
        <p class="curhat-detail-hero__text">{c.curhatan}</p>

        <div class="home-collab-card__chips mt-3">
          {#if c.userId}
            <span class="curhat-detail-hero__meta-chip">
              <i class="bi bi-patch-check-fill"></i> {c.curhatanDari}
            </span>
          {:else}
            <span class="curhat-detail-hero__meta-chip">
              <i class="bi bi-incognito"></i> {c.curhatanDari}
            </span>
          {/if}
          <span class="curhat-detail-hero__meta-chip">
            <i class="bi bi-eye-fill"></i> {c.view.toLocaleString('id-ID')} dilihat
          </span>
          <span class="curhat-detail-hero__meta-chip">
            <i class="bi bi-clock"></i> {formatDate(c.createdAt)}
          </span>
        </div>

        <div class="curhat-detail-hero__actions">
          <button class="theme-btn theme-btn--primary" class:active={voted} on:click={handleUpvote}>
            <span>{likes}</span> <i class="bi bi-heart-fill"></i> Suka
          </button>
          <button
            class="theme-btn theme-btn--ghost"
            on:click={() => laporOpen = true}
          >
            <i class="bi bi-flag"></i> Lapor
          </button>
        </div>
      </article>

    </div>
  </div>

  <!-- Related -->
  {#if data.related.length > 0}
    <div class="mt-5">
      <h2 class="h4 fw-boldest mb-3">Curhatan lain</h2>
      <div class="row g-3 mt-1">
        {#each data.related as item}
          <div class="col-6 col-md-4 col-lg-3">
            <CurhatCard {item} excerptLimit={160} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<!-- Lapor Modal -->
{#if laporOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);" on:click|self={() => laporOpen = false}>
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content curhat-modal">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">Laporkan Curhatan</h5>
          <button type="button" class="btn-close" on:click={() => laporOpen = false}></button>
        </div>
        <div class="modal-body curhat-modal__body">
          {#if laporDone}
            <div class="text-center py-3">
              <i class="bi bi-check-circle-fill text-success display-5 mb-2 d-block"></i>
              <p class="fw-semibold mb-0">Laporan berhasil dikirim. Terima kasih!</p>
            </div>
          {:else}
            <p class="text-muted small mb-3">Pilih alasan pelaporan:</p>
            <div class="d-flex flex-column gap-2 mb-3">
              {#each laporOptions as opt}
                <button
                  class="lapor-list text-start btn btn-outline-secondary"
                  class:active={laporSelected === opt.id}
                  on:click={() => laporSelected = opt.id}
                >
                  {opt.label}
                </button>
              {/each}
            </div>
            <button
              class="theme-btn theme-btn--primary w-100"
              disabled={!laporSelected || laporLoading}
              on:click={handleLapor}
            >
              {laporLoading ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
