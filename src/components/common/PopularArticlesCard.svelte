<script lang="ts" context="module">
  import type { ArticleListItem, PopularRange } from '$lib/api';

  export type PopularTab = { key: PopularRange; label: string; articles: ArticleListItem[] };

  /** Tab labels in reading order; "all" only appears as a fallback list. */
  export const RANGE_LABELS: Record<PopularRange, string> = {
    today: 'Hari ini',
    week: 'Minggu ini',
    month: 'Bulan ini',
    all: 'Sepanjang masa',
  };
</script>

<script lang="ts">
  import SideCard from '$components/sidebar/SideCard.svelte';
  import ArticleRankItem from '$components/common/ArticleRankItem.svelte';

  export let title = 'Artikel Populer';
  export let headingId = 'side-popular';
  /** One list per time range. Empty ranges drop out; with one left, no tabs. */
  export let ranges: PopularTab[] = [];
  /** Older single-list callers. */
  export let articles: ArticleListItem[] = [];
  export let initial: PopularRange = 'week';
  /** Optional "see all" link, for pages that have a popular listing. */
  export let moreHref: string | null = null;
  /** Category pages hide the per-row category, which would repeat the card title. */
  export let showCategory = true;

  $: tabs = (ranges.length ? ranges : [{ key: initial, label: RANGE_LABELS[initial], articles }]).filter(
    (tab) => tab.articles.length > 0,
  );

  let chosen: PopularRange | null = null;
  $: active = tabs.find((tab) => tab.key === chosen) ?? tabs.find((tab) => tab.key === initial) ?? tabs[0];

  let tabEls: HTMLButtonElement[] = [];

  /** Arrow keys move between tabs, Home/End jump to the ends (WAI-ARIA tabs pattern). */
  function onKeydown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    let next = -1;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next < 0) return;
    event.preventDefault();
    chosen = tabs[next].key;
    tabEls[next]?.focus();
  }
</script>

{#if active}
  <SideCard {title} {headingId}>
    {#if tabs.length > 1}
      <div class="pop-tabs" role="tablist" aria-label="Rentang waktu {title}">
        {#each tabs as tab, index (tab.key)}
          <button
            type="button"
            role="tab"
            id="{headingId}-tab-{tab.key}"
            class="pop-tab"
            aria-selected={tab.key === active.key}
            aria-controls="{headingId}-panel"
            tabindex={tab.key === active.key ? 0 : -1}
            bind:this={tabEls[index]}
            on:click={() => (chosen = tab.key)}
            on:keydown={(event) => onKeydown(event, index)}
          >{tab.label}</button>
        {/each}
      </div>
    {/if}

    <ol
      class="pop-list"
      id="{headingId}-panel"
      role={tabs.length > 1 ? 'tabpanel' : undefined}
      aria-labelledby={tabs.length > 1 ? `${headingId}-tab-${active.key}` : undefined}
    >
      {#each active.articles as article, i (article.id)}
        <li>
          <ArticleRankItem {article} rank={i + 1} featured={i === 0} {showCategory} />
        </li>
      {/each}
    </ol>

    {#if moreHref}
      <a class="pop-more" href={moreHref}>Lihat semua <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
    {/if}
  </SideCard>
{/if}

<style>
  .pop-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 0.9rem;
  }

  .pop-tab {
    min-height: 44px;
    padding: 0 0.9rem;
    border: 1px solid #e5e5e5;
    border-radius: 999px;
    background: #fff;
    color: #111;
    font-size: 0.8125rem;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
  }

  .pop-tab:hover {
    border-color: var(--site-dark, #111);
  }

  .pop-tab[aria-selected='true'] {
    border-color: var(--site-primary, #f1ff32);
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
  }

  .pop-tab:focus-visible {
    outline: 3px solid var(--site-dark, #111);
    outline-offset: 2px;
  }

  .pop-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pop-more {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    margin-top: 0.4rem;
    color: #111;
    font-size: 0.8125rem;
    font-weight: 700;
    text-decoration-color: var(--site-primary, #f1ff32);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  .pop-more:focus-visible {
    outline: 3px solid var(--site-dark, #111);
    outline-offset: 2px;
  }
</style>
