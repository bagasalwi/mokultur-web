<script lang="ts">
  import type { TalentReel } from '$lib/api';

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
  </div>

  {#if reel.title}
    <p class="reel__title">{reel.title}</p>
  {/if}
</a>

<style>
  .reel {
    display: block;
    /* The rail sizes cards from this, not from a track: flex-basis auto plus
       a cap keeps every reel the same width whether there are two or twelve. */
    width: 210px;
    max-width: 210px;
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

  .reel__title {
    /* Was 0.82rem/700 — caption-sized. Reads as a title now, in the same
       family as .article-title on the rest of the site. */
    margin: 0.55rem 0 0;
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1.3;
    color: #0a0a0a;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
