<script lang="ts">
  import { onMount } from 'svelte';
  import type { EventItem } from '$lib/api';
  import { googleCalendarUrl } from '$lib/event';
  import { absoluteUrl } from '$lib/seo';

  /**
   * "Tambah ke kalender": Google Calendar in a new tab, or an .ics download for
   * Apple Calendar / Outlook. A <details> menu, so it works without JS; with JS
   * it also closes on an outside click or Escape.
   */
  export let event: EventItem & { endDateEffective?: string; address?: string | null };
  /** 'solid' on light surfaces, 'on-dark' over the dark spotlight. */
  export let tone: 'solid' | 'on-dark' = 'solid';
  /** Icon-only trigger for tight agenda rows. */
  export let compact = false;

  let menu: HTMLDetailsElement;
  $: pageUrl = absoluteUrl(`/event/${event.slug}`);
  $: google = googleCalendarUrl(event, pageUrl);
  $: ics = `/event/${event.slug}/calendar.ics`;

  onMount(() => {
    const close = (e: Event) => {
      if (!menu?.open) return;
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menu.contains(e.target as Node)) menu.open = false;
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  });
</script>

{#if google}
  <details class="atc" class:atc--dark={tone === 'on-dark'} bind:this={menu}>
    <summary
      class="theme-btn theme-btn--see-all theme-btn--sm"
      class:theme-btn--on-dark={tone === 'on-dark'}
      class:atc__icon-only={compact}
      aria-label={compact ? `Tambah ${event.name} ke kalender` : undefined}
    >
      <i class="bi bi-calendar-plus" aria-hidden="true"></i>{#if !compact}<span>Tambah ke kalender</span>{/if}
    </summary>
    <div class="atc__menu">
      <a href={google} target="_blank" rel="noopener"><i class="bi bi-google" aria-hidden="true"></i> Google Calendar</a>
      <a href={ics} download><i class="bi bi-calendar-event" aria-hidden="true"></i> Apple / Outlook (.ics)</a>
    </div>
  </details>
{/if}

<style>
  .atc { position: relative; display: inline-block; }
  .atc summary { list-style: none; cursor: pointer; gap: 0.4rem; }
  .atc summary::-webkit-details-marker { display: none; }
  .atc__icon-only { width: 40px; min-width: 40px; padding: 0 !important; justify-content: center; }
  .atc__menu {
    position: absolute;
    z-index: 30;
    top: calc(100% + 6px);
    left: 0;
    display: grid;
    min-width: 220px;
    padding: 0.35rem;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 16px 40px rgba(10, 10, 10, 0.16);
  }
  .atc__menu a {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 40px;
    padding: 0 0.75rem;
    border-radius: 10px;
    color: #1a1a1a;
    font-size: 0.875rem;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }
  .atc__menu a:hover,
  .atc__menu a:focus-visible { background: #f3f4f6; outline: none; }
  .atc__menu a:focus-visible { box-shadow: inset 0 0 0 2px var(--site-dark, #111); }
</style>
