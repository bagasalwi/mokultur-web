<script lang="ts">
  import type { CurhatanItem } from '$lib/api';

  export let curhatan: CurhatanItem[] = [];
  export let siteName = 'Mokultur';

  let activeIdx = 0;

  function startRotator() {
    if (curhatan.length < 2) return;
    setInterval(() => {
      activeIdx = (activeIdx + 1) % curhatan.length;
    }, 4500);
  }

  import { onMount } from 'svelte';
  onMount(startRotator);

  $: excerpt = (text: string) => text.length > 110 ? text.substring(0, 110) + '…' : text;
</script>

<aside class="curhat-promo" aria-label="Curhatan">
  <div class="curhat-promo__inner">
    <div class="curhat-promo__head">
      <span class="badge badge-main">Curhatan</span>
      <span class="curhat-promo__pulse" aria-hidden="true"></span>
    </div>

    <h6 class="curhat-promo__title">Lagi pengen cerita?</h6>
    <p class="curhat-promo__desc">Cerita jujurmu, dibaca komunitas {siteName}.</p>

    {#if curhatan.length > 0}
      <div class="curhat-promo__preview">
        {#each curhatan as item, i}
          <blockquote class="curhat-promo__quote" class:is-active={i === activeIdx}>
            <span class="curhat-promo__quote-mark" aria-hidden="true">&ldquo;</span>
            <p>{excerpt(item.curhatan)}</p>
            <cite>— {item.curhatanDari}</cite>
          </blockquote>
        {/each}
      </div>
    {/if}

    <div class="curhat-promo__chips">
      <span><i class="bi bi-incognito"></i> Anonim</span>
      <span><i class="bi bi-shield-check"></i> Aman</span>
      <span><i class="bi bi-chat-heart"></i> Komunitas</span>
    </div>

    <div class="curhat-promo__actions">
      <a href="/curhatan#submitCurhat" class="theme-btn theme-btn--primary curhat-promo__cta">
        <i class="bi bi-pencil"></i> Tulis sekarang
      </a>
      <a href="/curhatan" class="theme-btn theme-btn--ghost curhat-promo__cta-ghost">
        Lihat semua <i class="bi bi-arrow-right"></i>
      </a>
    </div>
  </div>
</aside>
