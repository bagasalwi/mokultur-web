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

<section class="section-md container-xl">
  <div class="talent-hero">
    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-7">
        <p class="talent-hero__eyebrow">Talent Mokultur</p>
        <h1 class="talent-hero__title">Talent</h1>
        <p class="talent-hero__desc">{description}</p>
      </div>

      {#if statItems.length}
        <div class="col-12 col-lg-5">
          <dl class="talent-hero__stats">
            {#each statItems as stat (stat.label)}
              <div class="talent-hero__stat">
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            {/each}
          </dl>
        </div>
      {/if}
    </div>

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
  /*
   * The rounded gradient panel every other landing page in this app opens with
   * — /contact, /event and /media-partner all use it. This one ran full-bleed
   * to the browser edges with a hairline bottom rule, which read as a different
   * site, and left the right half of a very wide black band empty.
   */
  .talent-hero {
    position: relative;
    border-radius: 28px;
    padding: 2rem;
    color: #fff;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--site-accent-glow, #f1ff32) 75%, transparent),
        transparent 22%
      ),
      linear-gradient(135deg, #0a0a0a 0%, #111827 48%, #1f2937 100%);
    box-shadow: 0 24px 80px rgb(10 10 10 / 15%);
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

  /* Tiles rather than a bare row of numbers, matching the media-partner hero,
     and they give the previously empty right column something to hold. */
  .talent-hero__stats {
    display: grid;
    /* Narrow enough that all three stats stay on one row even at 390px —
       at 120px the third dropped to a line of its own and stood taller than
       the pair above it. */
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    gap: 0.6rem;
    margin: 0;
  }

  .talent-hero__stat {
    padding: 0.8rem 0.75rem;
    border-radius: 16px;
    background: rgb(255 255 255 / 6%);
    border: 1px solid rgb(255 255 255 / 12%);
  }

  .talent-hero__stat dt {
    font-size: clamp(1.3rem, 2.5vw, 1.8rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: var(--site-primary, #f1ff32);
  }

  .talent-hero__stat dd {
    margin: 0.15rem 0 0;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 60%);
  }

  @media (max-width: 767.98px) {
    .talent-hero {
      border-radius: 20px;
      padding: 1.5rem;
    }
  }

  .talent-hero__spotlight {
    margin-top: clamp(1.5rem, 4vw, 2.25rem);
  }
</style>
