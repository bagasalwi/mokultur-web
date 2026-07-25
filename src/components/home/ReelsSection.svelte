<script lang="ts">
  import type { IgProfile, Reel } from '$lib/api';

  export let reels: Reel[] = [];
  export let profile: IgProfile | null = null;
  export let title = 'Follow kita di Instagram';

  /** 22184 → "22,2 rb", 9155 → "9,2 rb", 309 → "309" */
  function compact(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} jt`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} rb`;
    return String(n);
  }

  /** 3600 → "3.600" */
  function grouped(n: number): string {
    return n.toLocaleString('id-ID');
  }

  function firstLine(caption: string | null): string {
    if (!caption) return '';
    return caption.split('\n')[0];
  }

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }

  $: igUrl = profile ? `https://www.instagram.com/${profile.username}/` : 'https://www.instagram.com/';
</script>

{#if reels.length > 0}
  <section class="section-md reels-section">
    <div class="container-xl">
      <div class="reels-header">
        <div class="reels-header__left">
          {#if profile?.avatar}
            <img
              src={profile.avatar}
              alt={profile.username}
              class="reels-header__avatar"
              loading="lazy"
              decoding="async"
              on:error={imgFallback}
            />
          {/if}
          <div class="reels-header__meta">
            <h3 class="reels-header__title fw-boldest mb-0">{title}</h3>
            {#if profile}
              <p class="reels-header__stats mb-0">
                <span class="reels-header__handle">
                  @{profile.username}
                  {#if profile.isVerified}
                    <i class="bi bi-patch-check-fill" title="Terverifikasi"></i>
                  {/if}
                </span>
                <span class="reels-header__dot">&middot;</span>
                {compact(profile.followers)} pengikut
                <span class="reels-header__dot">&middot;</span>
                {grouped(profile.totalPosts)} konten
              </p>
            {/if}
          </div>
        </div>
        <a
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="theme-btn theme-btn--sm reels-header__follow flex-shrink-0 ms-3"
        >
          <i class="bi bi-instagram"></i> Follow
        </a>
      </div>

      <div class="reels-grid">
        {#each reels as reel (reel.id)}
          <a
            href={reel.permalink}
            target="_blank"
            rel="noopener noreferrer"
            class="reel-card"
            aria-label={firstLine(reel.caption) || `Reel ${reel.shortcode}`}
          >
            <img
              src={reel.thumbnail ?? '/images/noimage.png'}
              alt={firstLine(reel.caption)}
              class="reel-card__img"
              loading="lazy"
              decoding="async"
              on:error={imgFallback}
            />
            <span class="reel-card__play"><i class="bi bi-play-circle-fill"></i></span>
            <div class="reel-card__overlay">
              {#if reel.caption}
                <p class="reel-card__caption">{firstLine(reel.caption)}</p>
              {/if}
              <span class="reel-card__stats">
                <i class="bi bi-heart-fill"></i> {compact(reel.likeCount)}
                {#if reel.commentCount > 0}
                  <i class="bi bi-chat-fill ms-2"></i> {compact(reel.commentCount)}
                {/if}
              </span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>
{/if}

<style>
  .reels-section {
    background-color: #fff;
  }

  .reels-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .reels-header__left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .reels-header__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    padding: 2px;
    background: linear-gradient(45deg, #f09433, #dc2743, #bc1888);
  }

  .reels-header__meta {
    min-width: 0;
  }

  .reels-header__title {
    font-size: 1.15rem;
    line-height: 1.2;
  }

  .reels-header__stats {
    font-size: 0.8rem;
    color: #6c757d;
    margin-top: 2px;
  }

  .reels-header__handle {
    font-weight: 600;
    color: #212529;
  }

  .reels-header__handle i {
    color: #3897f0;
    font-size: 0.75rem;
  }

  .reels-header__dot {
    margin: 0 0.15rem;
  }

  .reels-header__follow {
    white-space: nowrap;
  }

  .reels-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
  }

  .reel-card {
    position: relative;
    display: block;
    aspect-ratio: 9 / 16;
    border-radius: 10px;
    overflow: hidden;
    background-color: #eee;
    text-decoration: none;
  }

  .reel-card__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }

  .reel-card:hover .reel-card__img {
    transform: scale(1.05);
  }

  .reel-card__play {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    color: #fff;
    font-size: 1.1rem;
    line-height: 1;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  .reel-card__overlay {
    position: absolute;
    inset: auto 0 0 0;
    padding: 1.75rem 0.6rem 0.6rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
    color: #fff;
    pointer-events: none;
  }

  .reel-card__caption {
    font-size: 0.72rem;
    line-height: 1.3;
    margin: 0 0 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .reel-card__stats {
    font-size: 0.7rem;
    display: inline-flex;
    align-items: center;
    opacity: 0.9;
  }

  .reel-card__stats i {
    font-size: 0.65rem;
    margin-right: 0.15rem;
  }

  @media (max-width: 991px) {
    .reels-grid {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 0.6rem;
      padding-bottom: 0.5rem;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .reels-grid::-webkit-scrollbar {
      display: none;
    }

    .reel-card {
      flex: 0 0 42%;
      scroll-snap-align: start;
    }
  }

  @media (max-width: 575px) {
    .reel-card {
      flex-basis: 46%;
    }
  }
</style>
