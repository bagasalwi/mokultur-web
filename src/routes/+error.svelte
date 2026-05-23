<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} - {$page.error?.message ?? 'Error'}</title>
</svelte:head>

<div class="container-xl py-5 text-center" style="min-height: 60vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
  <h1 class="display-1 fw-boldest mb-2" style="color: var(--site-primary, #f1ff32);">{$page.status}</h1>
  <h2 class="h4 fw-bold mb-3">{$page.error?.message ?? 'Terjadi kesalahan'}</h2>
  {#if $page.status === 404}
    <p class="text-muted mb-4">Halaman yang kamu cari tidak ditemukan.</p>
  {:else}
    <p class="text-muted mb-4">Terjadi kesalahan pada server. Coba lagi nanti.</p>
  {/if}
  <a href="/" class="theme-btn theme-btn--dark"><i class="bi bi-house me-2"></i>Kembali ke Beranda</a>
</div>
