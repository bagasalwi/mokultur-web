<script lang="ts">
  import type { TalentListItem } from '$lib/api';
  import { formatCount } from '$lib/talent';
  import TalentBadges from './TalentBadges.svelte';

  export let talent: TalentListItem;
</script>

<a class="talent-card" href="/talent/{talent.slug}" style={`--talent-color: ${talent.themeColor}`}>
  <div class="talent-card__avatar">
    <img src={talent.avatar} alt={talent.alias} loading="lazy" decoding="async" />
  </div>

  <h2 class="talent-card__name">{talent.alias}</h2>

  {#if talent.tagline}
    <p class="talent-card__tagline">{talent.tagline}</p>
  {/if}

  <div class="talent-card__badges">
    <!-- Tier only. At this column width a second pill wraps to its own line and
         leaves the card ragged; reach is already implied by the count below. -->
    <TalentBadges badges={talent.badges} max={1} size="sm" />
  </div>

  <p class="talent-card__meta">
    {#if talent.instagramUsername}
      <span class="talent-card__handle"><i class="bi bi-instagram"></i> @{talent.instagramUsername}</span>
    {/if}
    {#if talent.igFollowers > 0}
      <span class="talent-card__followers">{formatCount(talent.igFollowers)}</span>
    {/if}
  </p>
</a>

<style>
  .talent-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1rem 1.25rem;
    text-align: center;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.9rem;
    background: var(--bs-body-bg, #fff);
    transition:
      border-color 0.15s ease,
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .talent-card:hover {
    border-color: var(--talent-color, var(--site-primary, #f1ff32));
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.09);
  }

  .talent-card__avatar {
    width: 108px;
    height: 108px;
    margin-bottom: 0.85rem;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--talent-color, var(--site-primary, #f1ff32));
  }

  .talent-card__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .talent-card__name {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .talent-card__tagline {
    margin: 0.3rem 0 0;
    font-size: 0.83rem;
    line-height: 1.35;
    color: var(--bs-secondary-color, #6c757d);
    /* Two lines keeps every card in a row the same height. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .talent-card__badges {
    display: flex;
    justify-content: center;
    margin-top: 0.7rem;
  }

  .talent-card__meta {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
    /* Pushed to the bottom so the follower count lines up across the row even
       when taglines differ in length. */
    margin: auto 0 0;
    padding-top: 0.7rem;
    font-size: 0.78rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  .talent-card__followers {
    font-weight: 800;
    color: var(--bs-body-color, #212529);
  }
</style>
