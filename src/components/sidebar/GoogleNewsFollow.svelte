<script lang="ts">
  import type { SiteSettings } from '$lib/api';
  import SideCard from './SideCard.svelte';

  /**
   * "Follow on Google News". The publication URL comes from Site Settings
   * (google_news_url); until it is set, the button opens a Google News search
   * for the site so it is never a dead end.
   */
  export let settings: SiteSettings | null = null;
  /** 'card' for sidebars; 'inline' is the slim row at the end of an article. */
  export let variant: 'card' | 'inline' = 'card';

  const FALLBACK = 'https://news.google.com/search?q=mokultur&hl=id&gl=ID&ceid=ID:id';
  $: siteName = settings?.site_name ?? 'Mokultur';
  $: href = settings?.google_news_url || FALLBACK;
</script>

{#if variant === 'card'}
  <SideCard title="Ikuti {siteName} di Google News" headingId="side-gnews" lead="Berita kami langsung muncul di feed Google News kamu, tanpa perlu mencari.">
    <a class="gnews-btn" {href} target="_blank" rel="noopener">
      <i class="bi bi-newspaper" aria-hidden="true"></i>
      <span>Ikuti di Google News</span>
      <i class="bi bi-box-arrow-up-right gnews-btn__ext" aria-hidden="true"></i>
    </a>
  </SideCard>
{:else}
  <aside class="gnews-inline" aria-label="Ikuti di Google News">
    <span class="gnews-inline__icon" aria-hidden="true"><i class="bi bi-newspaper"></i></span>
    <p>Suka liputan seperti ini? <strong>Ikuti {siteName} di Google News</strong> supaya berita terbaru muncul di feed-mu.</p>
    <a class="gnews-btn gnews-btn--sm" {href} target="_blank" rel="noopener">Ikuti <i class="bi bi-box-arrow-up-right gnews-btn__ext" aria-hidden="true"></i></a>
  </aside>
{/if}

<style>
  .gnews-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0 1.1rem;
    border-radius: 999px;
    background: var(--site-dark, #111);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 800;
    text-decoration: none;
    transition: background-color 160ms ease, color 160ms ease;
  }
  .gnews-btn:hover { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .gnews-btn:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .gnews-btn__ext { font-size: 0.75rem; opacity: 0.7; }
  .gnews-btn--sm { flex: none; min-height: 38px; padding: 0 1rem; font-size: 0.8125rem; }

  .gnews-inline {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin: 2rem 0 0;
    padding: 0.85rem 1rem;
    border: 1px solid #ececec;
    border-radius: 16px;
    background: #fff;
  }
  .gnews-inline__icon { display: grid; place-items: center; flex: 0 0 40px; width: 40px; height: 40px; border-radius: 12px; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); font-size: 1.05rem; }
  .gnews-inline p { flex: 1; min-width: 0; margin: 0; color: #374151; font-size: 0.875rem; line-height: 1.5; }
  .gnews-inline strong { color: #111; }
  @media (max-width: 575px) {
    .gnews-inline { flex-wrap: wrap; }
    .gnews-inline p { flex-basis: calc(100% - 56px); }
    .gnews-inline .gnews-btn--sm { flex: 1 1 100%; }
  }
</style>
