<script lang="ts">
  import type { TalentBadge } from '$lib/api';

  export let badges: TalentBadge[] = [];
  /** Cards show two; the detail page shows the lot. */
  export let max: number | null = null;
  export let size: 'sm' | 'md' = 'md';
  /**
   * Which background the pills sit on. The accent and muted tones cannot be
   * made legible on both a white card and the dark hero with one set of
   * colours, so the caller states where it is rendering.
   */
  export let surface: 'light' | 'dark' = 'light';

  $: shown = max === null ? badges : badges.slice(0, max);
</script>

{#if shown.length}
  <ul class="badges" class:badges--sm={size === 'sm'} class:badges--dark={surface === 'dark'}>
    {#each shown as badge (badge.id)}
      <li class="badge-pill badge-pill--{badge.tone}">
        <i class="bi {badge.icon}" aria-hidden="true"></i>
        <span>{badge.label}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .badge-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.28rem 0.65rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .badges--sm .badge-pill {
    padding: 0.2rem 0.5rem;
    font-size: 0.66rem;
  }

  .badge-pill i {
    font-size: 0.85em;
  }

  /* Bright fill, dark text — the one pairing that holds up on any surface. */
  .badge-pill--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #000);
  }

  .badge-pill--accent {
    background: var(--site-dark, #0a0a0a);
    color: var(--site-primary, #f1ff32);
  }

  .badge-pill--muted {
    background: rgba(128, 128, 128, 0.16);
    color: var(--bs-secondary-color, #6c757d);
  }

  /* On the dark hero the inverted accent would vanish into the backdrop and
     the muted grey would fall below readable contrast. */
  .badges--dark .badge-pill--accent {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
  }

  .badges--dark .badge-pill--muted {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.78);
  }
</style>
