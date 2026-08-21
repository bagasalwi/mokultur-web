<script lang="ts">
  import type { AnimeCard } from '$lib/api';
  import { seasonLabel } from '$lib/anime';
  import Carousel from '$components/ui/Carousel.svelte';
  import SectionHead from '$components/ui/SectionHead.svelte';
  import AnimeSlide from '$components/anime/AnimeSlide.svelte';

  export let anime: AnimeCard[] = [];
  export let season: string | null = null;
  export let year: number | null = null;

  $: heading = season && year ? `${seasonLabel(season)} ${year}` : 'Season Ini';
</script>

<!-- No container or section padding of its own: the homepage places this in a
     two-column row beside the schedule and owns the spacing for both. -->
{#if anime.length > 0}
  <section>
    <SectionHead
      title="Yang Terbaik Musim Ini"
      sub="Anime yang perdana musim ini dengan skor tertinggi di MyAnimeList."
    />

    <!-- Heading and carousel are the section's only two children, which is
         what lets the homepage row line both columns up on a shared subgrid.
         The "Lihat Semua" link lives in the schedule heading opposite, so the
         row carries one call to action rather than one per column. -->
    <Carousel items={anime} label={`Yang terbaik ${heading}`} let:item>
      <AnimeSlide anime={item} eyebrow={`Yang Terbaik · ${heading}`} />
    </Carousel>
  </section>
{/if}
