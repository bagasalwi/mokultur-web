<script lang="ts">
  import type { TalentListItem, TalentStats } from '$lib/api';
  import { formatCount } from '$lib/talent';
  import Carousel from '$components/ui/Carousel.svelte';
  import TalentSpotlight from './TalentSpotlight.svelte';

  export let featured: TalentListItem[] = [];
  export let stats: TalentStats;
  export let description: string;
  /**
   * Below this many talents the spotlight would just restate the grid sitting
   * right beneath it, so the hero stays as a plain title band instead.
   */
  export let minForSpotlight = 3;

  $: showSpotlight = featured.length > 0 && stats.talentCount >= minForSpotlight;

  $: statItems = [
    { value: String(stats.talentCount), label: 'Talent' },
    { value: formatCount(stats.totalFollowers), label: 'Total Reach' },
    { value: String(stats.totalReels), label: 'Reels Kolaborasi' },
  ].filter((s) => s.value !== '0');
</script>

<section class="talent-hero">
  <div class="container-xl">
    <p class="talent-hero__eyebrow">Talent Mokultur</p>
    <h1 class="talent-hero__title">Talent</h1>
    <p class="talent-hero__desc">{description}</p>

    {#if statItems.length}
      <dl class="talent-hero__stats">
        {#each statItems as stat (stat.label)}
          <div class="talent-hero__stat">
            <dt>{stat.value}</dt>
            <dd>{stat.label}</dd>
          </div>
        {/each}
      </dl>
    {/if}

    {#if showSpotlight}
      <div class="talent-hero__spotlight">
        <Carousel items={featured} label="Talent unggulan" let:item>
          <TalentSpotlight talent={item} />
        </Carousel>
      </div>
    {/if}
  </div>
</section>

<style>
  /* Same accent recipe as .hero-masthead: an accent-tinted glow anchored to
     the top-left corner over a faint diagonal sheen. */
  .talent-hero {
    position: relative;
    padding: clamp(2rem, 5vw, 3.5rem) 0 clamp(1.5rem, 4vw, 2.5rem);
    margin-bottom: 2rem;
    background:
      radial-gradient(
        circle at top left,
        color-mix(in srgb, var(--site-accent-glow, #f1ff32) 22%, transparent),
        transparent 34%
      ),
      linear-gradient(135deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02)),
      var(--site-dark, #0a0a0a);
    color: #fff;
  }

  /* Hairline edge, matching the masthead card's border without boxing in a
     section that runs the full width of the page. */
  .talent-hero::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
  }

  .talent-hero__eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--site-primary, #f1ff32);
  }

  .talent-hero__title {
    /* Bootstrap targets h1-h6 directly, so the inherited white would lose to
       any theme that sets --bs-heading-color. */
    color: #fff;
    margin: 0;
    font-size: clamp(2rem, 6vw, 3.4rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .talent-hero__desc {
    max-width: 60ch;
    margin: 0.75rem 0 0;
    color: rgba(255, 255, 255, 0.72);
  }

  .talent-hero__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1.75rem;
    margin: 1.5rem 0 0;
  }

  .talent-hero__stat dt {
    font-size: clamp(1.3rem, 3vw, 1.9rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    color: var(--site-primary, #f1ff32);
  }

  .talent-hero__stat dd {
    margin: 0;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }

  .talent-hero__spotlight {
    margin-top: clamp(1.5rem, 4vw, 2.25rem);
  }
</style>
