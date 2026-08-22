<script lang="ts">
  import type { EventItem } from '$lib/api';
  import SectionHead from '$components/ui/SectionHead.svelte';
  import EventCard from './EventCard.svelte';

  export let events: EventItem[] = [];
  export let title = 'Event Mendatang';
  export let sub: string | null = 'Jadwal acara yang sedang dan akan berlangsung';
  export let limit = 4;

  $: shown = events.slice(0, limit);
</script>

<!-- Self-hiding when empty, like every other homepage section: a bare heading
     over nothing reads as a broken page. -->
{#if shown.length > 0}
  <section class="section-md">
    <div class="container-xl">
      <SectionHead {title} {sub}>
        <a slot="action" class="event-section__more" href="/event">
          Lihat Semua <i class="bi bi-arrow-right"></i>
        </a>
      </SectionHead>

      <div class="event-section__grid">
        {#each shown as event (event.slug)}
          <EventCard {event} />
        {/each}
      </div>
    </div>
  </section>
{/if}

<style>
  /* Four across, matching /event and the homepage article rows, so a card is
     the same size wherever a reader meets it. */
  .event-section__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .event-section__more {
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    color: inherit;
    white-space: nowrap;
  }

  .event-section__more:hover {
    color: var(--site-primary, #55ad9b);
  }

  @media (max-width: 991.98px) {
    .event-section__grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 767.98px) {
    .event-section__grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
  }
</style>
