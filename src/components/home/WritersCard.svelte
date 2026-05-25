<script lang="ts">
  import type { Writer } from '$lib/api';

  export let writers: Writer[] = [];

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }
</script>

{#if writers.length > 0}
  <div class="home-writer-card mb-4">
    <h6 class="fw-bold mb-3">Penulis</h6>
    <div class="home-writer-card__list">
      {#each writers as w}
        <a href="/author/{w.username}" class="home-writer-card__item text-decoration-none">
          <div class="home-writer-card__avatar">
            <img src={w.img ?? '/images/noimage.png'} alt={w.name} loading="lazy" decoding="async" on:error={imgFallback} />
          </div>
          <div class="flex-grow-1 min-w-0">
            <strong class="d-block text-truncate text-dark">{w.name}</strong>
            <span class="home-writer-card__handle">@{w.username}</span>
          </div>
          <div class="text-end flex-shrink-0">
            <strong class="d-block text-dark">{w.totalArticles.toLocaleString('id-ID')}</strong>
            <span class="home-writer-card__meta">artikel</span>
          </div>
        </a>
      {/each}
    </div>
    <a href="/author" class="theme-btn theme-btn--dark theme-btn--sm w-100 mt-3 d-flex justify-content-center">
      Lihat Penulis Lainnya <i class="bi bi-arrow-right ms-1"></i>
    </a>
  </div>
{/if}
