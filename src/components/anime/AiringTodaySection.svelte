<script lang="ts">
  import type { AnimeCard as AnimeCardType } from '$lib/api';
  import AiringCard from './AiringCard.svelte';
  import Carousel from '$components/ui/Carousel.svelte';
  import SectionHead from '$components/ui/SectionHead.svelte';

  export let anime: AnimeCardType[] = [];
  export let limit = 9;

  const DAY_LABEL: Record<string, string> = {
    Sundays: 'Minggu',
    Mondays: 'Senin',
    Tuesdays: 'Selasa',
    Wednesdays: 'Rabu',
    Thursdays: 'Kamis',
    Fridays: 'Jumat',
    Saturdays: 'Sabtu',
  };

  /** English plural from MAL, e.g. "Thursdays". */
  export let day: string | null = null;

  $: dayLabel = day ? (DAY_LABEL[day] ?? day) : null;
  $: shown = anime.slice(0, limit);

  /**
   * Rows per card is a prop, and the card sizes itself from it.
   *
   * It used to be three rows against a hardcoded 348px min-height — change one
   * and the other silently stopped matching. Now the height is derived, so this
   * section fits wherever it is dropped: four rows beside the season carousel,
   * fewer in a narrower slot.
   */
  export let perCard = 4;

  $: groups = Array.from({ length: Math.ceil(shown.length / perCard) }, (_, i) =>
    shown.slice(i * perCard, i * perCard + perCard)
  );
</script>

<!-- Hidden entirely when nothing airs today, rather than leaving a heading with
     an empty grid under it. Broadcast data only covers part of the cache, so an
     empty day is a normal outcome, not an error. -->
{#if shown.length}
  <section class="airing">
    <!-- Forwarded rather than hard-coded: the homepage puts its "Lihat Semua"
         link here, while /anime renders this section with nothing in the slot
         because it is already the page that link points at. -->
    <SectionHead title={`Tayang Hari Ini${dayLabel ? ` · ${dayLabel}` : ''}`} sub="Jadwal WIB.">
      <slot name="action" slot="action" />
    </SectionHead>

    <!-- Slower than the default: on the homepage this sits next to the season
         carousel, and two panels flipping in unison is a lot of movement. -->
    <Carousel items={groups} label="Jadwal tayang hari ini" interval={7000} let:item>
      <div class="airing-card" style={`--airing-rows: ${perCard}`}>
        {#each item as entry (entry.malId)}
          <AiringCard anime={entry} />
        {/each}
      </div>
    </Carousel>
  </section>
{/if}

<style>
  .airing {
    margin-bottom: 2rem;
  }

  /* Height comes from the row count rather than a magic number, so every card
     in the carousel still matches even when a group has shorter titles — and it
     keeps matching if perCard changes. */
  .airing-card {
    --airing-row-height: 4.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-height: calc(var(--airing-rows, 4) * var(--airing-row-height) + 1rem);
    padding: 0.5rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.85rem;
    background: var(--bs-body-bg, #fff);
  }
</style>
