<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { Writer } from '$lib/api';
  import { imgFallback } from '$lib/format';

  export let writers: Writer[] = [];

</script>

{#if writers.length > 0}
  <div class="home-writer-card mb-4">
    <h6 class="fw-bold mb-3">Penulis</h6>
    <div class="home-writer-card__list">
      {#each writers as w}
        <a href="/@{w.username ?? w.id}" class="home-writer-card__item text-decoration-none">
          <div class="home-writer-card__avatar">
            <img src={imgUrl(w.img, 160) ?? '/images/noimage.png'}
              srcset={imgSrcset(w.img, 72)}
              sizes="72px" alt={w.name} loading="lazy" decoding="async" on:error={imgFallback} />
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
