<script lang="ts">
  import type { PageData } from './$types';
  import type { TalentTier } from '$lib/api';
  import { absoluteUrl, buildPageTitle } from '$lib/seo';
  import { TIER_LABELS } from '$lib/talent';
  import TalentHero from '$components/talent/TalentHero.svelte';
  import TalentCard from '$components/talent/TalentCard.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl('/talent');

  const description = 'Kreator/Talent yang sudah bekerja sama dengan Mokultur, Yuk di cek profil mereka!';

  type Filter = TalentTier | 'all';

  let filter: Filter = 'all';

  // Only offer a chip for a tier somebody actually has, so the row never shows
  // a filter that returns nothing.
  $: tiers = (['verified', 'partner', 'general'] as TalentTier[]).filter((tier) =>
    data.talents.some((t) => t.talentTier === tier),
  );
  $: shown = filter === 'all' ? data.talents : data.talents.filter((t) => t.talentTier === filter);
</script>

<svelte:head>
  <title>{buildPageTitle('Talent', siteName)}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={buildPageTitle('Talent', siteName)} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
</svelte:head>

<TalentHero featured={data.featured} stats={data.stats} {description} />

<div class="container-xl pb-5 talent-body">
  {#if data.talents.length}
    {#if tiers.length > 1}
      <div class="talent-filters" role="group" aria-label="Saring talent">
        <button
          type="button"
          class="talent-chip"
          class:talent-chip--active={filter === 'all'}
          on:click={() => (filter = 'all')}
        >
          Semua <span class="talent-chip__count">{data.talents.length}</span>
        </button>
        {#each tiers as tier (tier)}
          <button
            type="button"
            class="talent-chip"
            class:talent-chip--active={filter === tier}
            on:click={() => (filter = tier)}
          >
            {TIER_LABELS[tier]}
            <span class="talent-chip__count">{data.talents.filter((t) => t.talentTier === tier).length}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="section-head">
      <h2 class="section-head__title">Semua Talent</h2>
      <p class="section-head__sub">{shown.length} dari {data.talents.length} talent.</p>
    </div>

    <div class="talent-grid">
      {#each shown as talent (talent.slug)}
        <TalentCard {talent} />
      {/each}
    </div>
  {:else}
    <p class="text-muted">Belum ada talent yang ditampilkan.</p>
  {/if}
</div>

<style>
  .talent-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .talent-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 999px;
    background: transparent;
    font-size: 0.85rem;
    font-weight: 800;
    color: inherit;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .talent-chip:hover {
    border-color: var(--site-primary, #f1ff32);
  }

  .talent-chip--active {
    background: var(--site-dark, #0a0a0a);
    border-color: var(--site-dark, #0a0a0a);
    color: var(--site-primary, #f1ff32);
  }

  .talent-chip__count {
    font-size: 0.72rem;
    opacity: 0.65;
  }

  .section-head {
    margin-bottom: 1rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--site-primary, #f1ff32);
  }

  .section-head__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .section-head__sub {
    margin: 0.15rem 0 0;
    font-size: 0.85rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  /* auto-fill rather than a fixed count: with only one or two talents a rigid
     4-column grid left a card stranded beside three empty tracks. */
  /* Fixed tracks rather than auto-fill: with auto-fill a single talent sat at
     205px on the far left of an otherwise empty row. Four across matches the
     event and article grids, so cards are the same size across the site. */
  .talent-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.25rem;
  }

  @media (max-width: 991.98px) {
    .talent-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 767.98px) {
    .talent-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
  }
</style>
