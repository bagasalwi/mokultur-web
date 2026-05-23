<script lang="ts">
  import type { CurhatanItem } from '$lib/api';
  import { upvoteCurhatan } from '$lib/api';

  export let item: CurhatanItem;
  export let excerptLimit = 240;
  export let showUpvote = true;

  let likes = item.like;
  let voted = false;

  $: slug = item.curhatan.substring(0, 60).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+$/, '');
  $: excerpt = item.curhatan.length > excerptLimit ? item.curhatan.substring(0, excerptLimit) + '…' : item.curhatan;
  $: firstChar = item.curhatanDari ? item.curhatanDari[0].toUpperCase() : '?';

  async function handleUpvote(e: Event) {
    e.preventDefault();
    if (voted) return;
    voted = true;
    likes += 1;
    try {
      const res = await upvoteCurhatan(item.id);
      likes = res.likes;
    } catch {
      likes -= 1;
      voted = false;
    }
  }
</script>

<a href="/curhat-{item.id}/{slug}" class="curhat-card-link d-block text-decoration-none">
  <article class="curhat-card" style="--curhat-card-bg: {item.cardColor};">
    {#if item.gambar}
      <div class="curhat-card__media">
        <img src={item.gambar} alt={excerpt.substring(0, 60)} loading="lazy" decoding="async" />
      </div>
    {/if}

    <div class="curhat-card__body">
      <span class="curhat-card__eyebrow">
        {#if item.userId}
          <i class="bi bi-patch-check-fill"></i> Punya akun
        {:else}
          <i class="bi bi-incognito"></i> Anonim
        {/if}
      </span>

      <p class="curhat-card__text">{excerpt}</p>

      <div class="curhat-card__footer">
        {#if item.userId}
          <span class="curhat-author curhat-author--verified">
            <span class="curhat-author__avatar"><i class="bi bi-patch-check-fill" style="font-size: 0.6rem;"></i></span>
            <span class="curhat-author__name">{item.curhatanDari}</span>
          </span>
        {:else}
          <span class="curhat-author">
            <span class="curhat-author__avatar">{firstChar}</span>
            <span class="curhat-author__name">{item.curhatanDari}</span>
          </span>
        {/if}

        {#if showUpvote}
          <button class="curhat-action-btn" class:active={voted} on:click={handleUpvote} aria-label="Suka">
            <i class="bi bi-heart-fill"></i>
            <span class="curhat-action-btn__label">{likes}</span>
          </button>
        {/if}
      </div>
    </div>
  </article>
</a>
