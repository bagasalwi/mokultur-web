<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { ArticleListItem } from '$lib/api';
  import { timeAgo, imgFallback } from '$lib/format';

  /**
   * News-desk block: one lead story beside a tight list of four. Shared by the
   * homepage "Newsroom" sections and the category page.
   */
  export let articles: ArticleListItem[] = [];
  /** Off where every story is in the same category (the category page). */
  export let showCategory = true;

  $: lead = articles[0] ?? null;
  $: supporting = articles.slice(1, 5);
</script>

{#if lead}
  <div class="newsroom__grid" class:newsroom__grid--solo={!supporting.length}>
    <a href="/article/{lead.id}/{lead.slug}" class="newsroom__lead">
      <span class="newsroom__lead-media">
        <img src={imgUrl(lead.image, 768) ?? '/images/noimage.png'} srcset={imgSrcset(lead.image, 640)} sizes="(max-width: 991px) 100vw, 640px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
      </span>
      <span class="newsroom__lead-body">
        {#if showCategory && lead.category}<span class="newsroom__cat">{lead.category.name}</span>{/if}
        <h3 class="newsroom__lead-title">{lead.title}</h3>
        {#if lead.description}<span class="newsroom__desc">{lead.description}</span>{/if}
        <span class="newsroom__meta">{#if lead.format === 'photo-story'}Photo Story · {lead.photoCount} foto · {/if}{timeAgo(lead.publishDate)}</span>
      </span>
    </a>

    {#if supporting.length}
      <ul class="newsroom__list">
        {#each supporting as item (item.id)}
          <li>
            <a href="/article/{item.id}/{item.slug}" class="newsroom__row">
              <span class="newsroom__thumb">
                <img src={imgUrl(item.image, 320) ?? '/images/noimage.png'} srcset={imgSrcset(item.image, 136)} sizes="(max-width: 575px) 112px, 136px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
              </span>
              <span class="newsroom__row-body">
                {#if showCategory && item.category}<span class="newsroom__cat">{item.category.name}</span>{/if}
                <h3 class="newsroom__row-title">{item.title}</h3>
                <span class="newsroom__meta">{#if item.format === 'photo-story'}Photo Story · {item.photoCount} foto · {/if}{timeAgo(item.publishDate)}</span>
              </span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .newsroom__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 2rem;
    align-items: start;
  }
  .newsroom__grid--solo { grid-template-columns: minmax(0, 1fr); max-width: 760px; }

  .newsroom__grid a { color: inherit; text-decoration: none; }
  .newsroom__grid a:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 4px; border-radius: 12px; }

  .newsroom__lead { display: block; }
  .newsroom__lead-media,
  .newsroom__thumb {
    display: block;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f0f0f0;
  }
  .newsroom__lead-media { border-radius: 14px; }
  .newsroom__lead-media img,
  .newsroom__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .newsroom__lead-body { display: flex; flex-direction: column; gap: 0.4rem; padding-top: 1rem; }

  .newsroom__cat {
    align-self: flex-start;
    padding: 0.125rem 0.4rem;
    border-radius: 4px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-badge-text, #111);
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .newsroom__lead-title {
    margin: 0;
    font-size: clamp(1.25rem, 1.8vw, 1.5rem);
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: #1a1a1a;
    text-wrap: balance;
  }
  .newsroom__desc {
    color: #555;
    font-size: 0.9375rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .newsroom__meta { color: #6b7280; font-size: 0.75rem; }

  .newsroom__list { list-style: none; margin: 0; padding: 0; }
  .newsroom__list li + li { border-top: 1px solid #ececec; }
  .newsroom__row { display: flex; align-items: flex-start; gap: 1rem; padding: 0.875rem 0; }
  .newsroom__list li:first-child .newsroom__row { padding-top: 0; }
  .newsroom__list li:last-child .newsroom__row { padding-bottom: 0; }
  .newsroom__thumb { flex: 0 0 136px; border-radius: 8px; }
  .newsroom__row-body { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
  .newsroom__row-title {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1.35;
    color: #1a1a1a;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (hover: hover) {
    .newsroom__lead:hover img,
    .newsroom__row:hover img { transform: scale(1.04); }
    .newsroom__lead:hover .newsroom__lead-title,
    .newsroom__row:hover .newsroom__row-title {
      text-decoration: underline;
      text-decoration-color: var(--site-primary, #f1ff32);
      text-decoration-thickness: 2px;
      text-underline-offset: 3px;
    }
  }
  @media (prefers-reduced-motion: reduce) { .newsroom__grid img { transition: none; } }

  @media (max-width: 991px) {
    .newsroom__grid { grid-template-columns: 1fr; gap: 1.5rem; }
  }
  @media (max-width: 575px) {
    .newsroom__thumb { flex-basis: 112px; aspect-ratio: 4 / 3; }
    .newsroom__row { gap: 0.75rem; }
  }
</style>
