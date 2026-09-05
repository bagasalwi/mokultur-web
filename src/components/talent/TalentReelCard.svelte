<script lang="ts">
  import type { TalentReel } from '$lib/api';
  import { formatCount } from '$lib/talent';

  export let reel: TalentReel;
</script>

<a class="reel" href={reel.url} target="_blank" rel="noopener">
  <div class="reel__thumb">
    {#if reel.thumbnail}
      <img src={reel.thumbnail} alt={reel.title ?? 'Reels kolaborasi'} loading="lazy" decoding="async" />
    {:else}
      <!-- Instagram only exposes an account's twelve most recent posts, so older
           collabs may never get a mirrored frame. Branded rather than a grey
           box: the link is still worth following. -->
      <span class="reel__placeholder">
        <i class="bi bi-instagram"></i>
        <span class="reel__placeholder-text">Lihat di Instagram</span>
      </span>
    {/if}

    {#if reel.viewCount > 0}
      <span class="reel__views"><i class="bi bi-play-fill"></i> {formatCount(reel.viewCount)}</span>
    {/if}
  </div>

  {#if reel.title}
    <p class="reel__title">{reel.title}</p>
  {/if}
</a>

<style>
  .reel {
    display: block;
    /* The grid gives a lone or sparse set of reels the whole row via
       auto-fit; without a cap here a single reel would stretch edge to edge
       at a 9:16 ratio and tower over everything else on the page. */
    max-width: 190px;
    text-decoration: none;
    color: inherit;
  }

  .reel__thumb {
    position: relative;
    /* Reels are shot vertical; anything else would letterbox. */
    aspect-ratio: 9 / 16;
    border-radius: 0.75rem;
    overflow: hidden;
    background: #e9ecef;
  }

  .reel__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.25s ease;
  }

  .reel:hover .reel__thumb img {
    transform: scale(1.04);
  }

  .reel__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
    padding: 0.75rem;
    background: linear-gradient(150deg, #833ab4 0%, #e1306c 55%, #f77737 100%);
    color: #fff;
    font-size: 1.6rem;
    text-align: center;
  }

  .reel__placeholder-text {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .reel__views {
    position: absolute;
    left: 0.5rem;
    bottom: 0.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .reel__title {
    margin: 0.5rem 0 0;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
