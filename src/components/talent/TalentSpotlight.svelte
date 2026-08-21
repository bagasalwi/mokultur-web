<script lang="ts">
  import type { TalentListItem } from '$lib/api';
  import { formatCount } from '$lib/talent';
  import TalentBadges from './TalentBadges.svelte';

  export let talent: TalentListItem;
</script>

<article class="spotlight" style={`--talent-color: ${talent.themeColor}`}>
  <!-- Decorative: the same portrait appears sharp beside it, so alt text here
       would only repeat the name to a screen reader. -->
  <img class="spotlight__backdrop" src={talent.avatar} alt="" aria-hidden="true" />
  <div class="spotlight__scrim"></div>

  <div class="spotlight__inner">
    <div class="spotlight__portrait">
      <img src={talent.avatar} alt={talent.alias} loading="lazy" decoding="async" />
    </div>

    <div class="spotlight__body">
      <TalentBadges badges={talent.badges} max={2} surface="dark" />

      <h3 class="spotlight__name">
        <a href="/talent/{talent.slug}">{talent.alias}</a>
      </h3>

      {#if talent.tagline}
        <p class="spotlight__tagline">{talent.tagline}</p>
      {/if}

      <p class="spotlight__meta">
        {#if talent.instagramUsername}
          <span><i class="bi bi-instagram"></i> @{talent.instagramUsername}</span>
        {/if}
        {#if talent.igFollowers > 0}
          <span><strong>{formatCount(talent.igFollowers)}</strong> followers</span>
        {/if}
        {#if talent.collabCount > 0}
          <span><strong>{talent.collabCount}</strong> reels</span>
        {/if}
      </p>

      <a class="theme-btn theme-btn--primary theme-btn--sm" href="/talent/{talent.slug}">
        Lihat Profil <i class="bi bi-arrow-right"></i>
      </a>
    </div>

    {#if talent.igFollowers > 0}
      <div class="spotlight__reach">
        <span class="spotlight__reach-value">{formatCount(talent.igFollowers)}</span>
        <span class="spotlight__reach-label">Followers</span>
      </div>
    {/if}
  </div>
</article>

<style>
  .spotlight {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    background: #14181d;
    color: #fff;
    isolation: isolate;
  }

  .spotlight__backdrop {
    position: absolute;
    inset: 0;
    z-index: -2;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(30px) saturate(1.3);
    transform: scale(1.25);
  }

  .spotlight__scrim {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.68) 55%, rgba(0, 0, 0, 0.5) 100%),
      linear-gradient(0deg, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.15));
  }

  .spotlight__inner {
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 2rem);
    padding: clamp(1.1rem, 3vw, 2rem);
    min-height: 260px;
  }

  .spotlight__portrait {
    flex: 0 0 auto;
    width: clamp(96px, 13vw, 150px);
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--talent-color, var(--site-primary, #f1ff32));
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  }

  .spotlight__portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .spotlight__body {
    flex: 1 1 auto;
    min-width: 0;
  }

  .spotlight__name {
    /* Stated outright rather than inherited: Bootstrap matches h1-h6 directly,
       so a theme with a real --bs-heading-color beats the inherited white. */
    color: #fff;
    margin: 0.6rem 0 0;
    font-size: clamp(1.4rem, 3.4vw, 2.2rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .spotlight__name :global(a) {
    color: #fff;
    text-decoration: none;
  }

  .spotlight__name :global(a:hover) {
    color: var(--site-primary, #f1ff32);
  }

  .spotlight__tagline {
    margin: 0.35rem 0 0;
    font-size: 0.92rem;
    color: rgba(255, 255, 255, 0.75);
  }

  .spotlight__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin: 0.75rem 0 1rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.72);
  }

  /* Anchors the right-hand side, which otherwise reads as an empty half. */
  .spotlight__reach {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-left: 1rem;
  }

  .spotlight__reach-value {
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    color: var(--site-primary, #f1ff32);
  }

  .spotlight__reach-label {
    margin-top: 0.2rem;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }

  .spotlight__meta strong {
    color: #fff;
  }

  @media (max-width: 767.98px) {
    /* The big follower figure is already in the meta line on narrow screens. */
    .spotlight__reach {
      display: none;
    }
  }

  @media (max-width: 575.98px) {
    .spotlight__inner {
      min-height: 0;
      gap: 0.85rem;
      align-items: flex-start;
    }
  }
</style>
