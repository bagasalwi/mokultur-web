<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import { timeAgo, imgFallback } from '$lib/format';
  import type { ArticleListItem } from '$lib/api';

  /**
   * The homepage's news feed: one row per story, thumbnail beside headline,
   * the way a news desk lists what just happened. Denser than a card grid on
   * purpose — this is the section readers scan, not browse.
   */
  export let articles: ArticleListItem[] = [];
  /** Off where every row is in the same category (the category page). */
  export let showCategory = true;
  /** Off on an author's own page, where every row has the same byline. */
  export let showAuthor = true;
  /**
   * Rows from this index on show only on desktop (≥992px). The homepage uses
   * it so the feed runs as long as the sidebar beside it; on phones the
   * sidebar stacks below and the extra rows would only lengthen the page.
   */
  export let desktopOnlyFrom: number | null = null;

  const href = (a: ArticleListItem) => `/article/${a.id}/${a.slug}`;
</script>

<ul class="latest-list">
  {#each articles as a, i (a.id)}
    <li class:latest-list__desktop={desktopOnlyFrom !== null && i >= desktopOnlyFrom}>
      <a class="latest-row" href={href(a)}>
        <span class="latest-row__thumb">
          <img src={imgUrl(a.image, 480) ?? '/images/noimage.png'} srcset={imgSrcset(a.image, 240)} sizes="(max-width: 575px) 112px, 240px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
        </span>
        <span class="latest-row__body">
          <h3 class="latest-row__title">{a.title}</h3>
          {#if a.description}<span class="latest-row__desc">{a.description}</span>{/if}
          <span class="latest-row__meta">
            {#if showCategory && a.category}<span class="latest-row__cat">{a.category.name}</span>{/if}
            <time datetime={a.publishDate ?? ''}>{timeAgo(a.publishDate)}</time>
            {#if a.format === 'photo-story'}<span>Photo Story · {a.photoCount ?? 0} foto</span>{/if}
            {#if showAuthor && a.author?.name}<span class="latest-row__author">{a.author.name}</span>{/if}
          </span>
        </span>
      </a>
    </li>
  {/each}
</ul>

<style>
  .latest-list { list-style: none; margin: 0; padding: 0; }
  .latest-list li + li { border-top: 1px solid #ececec; }
  @media (max-width: 991.98px) { .latest-list__desktop { display: none; } }

  .latest-row {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    padding: 1rem 0;
    color: inherit;
    text-decoration: none;
  }
  .latest-list li:first-child .latest-row { padding-top: 0; }

  .latest-row__thumb {
    flex: 0 0 240px;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 10px;
    background: #f0f0f0;
  }
  .latest-row__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .latest-row__body { display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }

  .latest-row__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.32;
    letter-spacing: -0.01em;
    color: #1a1a1a;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 160ms ease;
  }

  .latest-row__desc {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .latest-row__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.75rem;
    color: #6b7280;
    font-size: 0.75rem;
  }
  .latest-row__cat {
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.6875rem;
    padding: 0.125rem 0.4rem;
    border-radius: 4px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-badge-text, #111);
  }
  .latest-row__author::before { content: 'oleh '; }

  .latest-row:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 4px; border-radius: 10px; }

  @media (hover: hover) {
    .latest-row:hover .latest-row__title { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; text-decoration-color: var(--site-primary, #f1ff32); }
    .latest-row:hover .latest-row__thumb img { transform: scale(1.04); }
  }
  @media (prefers-reduced-motion: reduce) { .latest-row__thumb img { transition: none; } }

  @media (max-width: 991px) {
    .latest-row__thumb { flex-basis: 200px; }
  }
  @media (max-width: 575px) {
    .latest-row { gap: 0.875rem; padding: 0.875rem 0; }
    .latest-row__thumb { flex-basis: 112px; aspect-ratio: 4 / 3; border-radius: 8px; }
    .latest-row__title { font-size: 0.9375rem; -webkit-line-clamp: 3; line-clamp: 3; }
    .latest-row__desc,
    .latest-row__author { display: none; }
  }
</style>
