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

  /** Three per card, so nine entries become three flip-through cards. */
  $: groups = Array.from({ length: Math.ceil(shown.length / 3) }, (_, i) => shown.slice(i * 3, i * 3 + 3));
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
      <div class="airing-card">
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

  /* One card holds three schedule rows. A fixed min-height keeps every card
     the same size so the flip does not jump when a group has shorter titles. */
  .airing-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-height: 348px;
    padding: 0.75rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.85rem;
    background: var(--bs-body-bg, #fff);
  }
</style>
