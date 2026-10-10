<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import { compactNumber, imgFallback, timeAgo } from '$lib/format';
  import type { ArticleListItem } from '$lib/api';

  export let article: ArticleListItem;
  export let rank: number;
  /** The #1 slot of a ranking: full-width photo, the number set on it. */
  export let featured = false;
  /**
   * Off for lists that are not a ranking (the article page's "Rekomendasi"
   * and "Baca selanjutnya" come from related-by-tag, not views), so they get
   * the same row without numbers that would imply an order.
   */
  export let ranked = true;
  /** Off inside a single-category list, where every row would say the same thing. */
  export let showCategory = true;

  $: href = `/article/${article.id}/${article.slug}`;
  $: views = typeof article.viewCount === 'number' && article.viewCount > 0 ? `${compactNumber(article.viewCount)} dibaca` : '';
  $: when = timeAgo(article.publishDate);
  $: isoDate = article.publishDate ? article.publishDate.replace(' ', 'T') : undefined;
</script>

<a {href} class="rank" class:rank--featured={featured && article.image} class:rank--plain={!ranked}>
  {#if featured && article.image}
    <span class="rank__photo">
      <img
        src={imgUrl(article.image, 480) ?? article.image}
        srcset={imgSrcset(article.image, 360)}
        sizes="(min-width: 992px) 360px, 100vw"
        alt=""
        loading="lazy"
        decoding="async"
        on:error={imgFallback}
      />
      {#if ranked}<span class="rank__no rank__no--on-photo" aria-hidden="true">{rank}</span>{/if}
    </span>
  {:else if ranked}
    <span class="rank__no" aria-hidden="true">{rank}</span>
  {/if}

  <span class="rank__body">
    {#if showCategory && article.category}<span class="rank__cat">{article.category.name}</span>{/if}
    <span class="rank__title">
      {#if ranked}<span class="visually-hidden">Peringkat {rank}: </span>{/if}{article.title}
    </span>
    {#if views || when}
      <span class="rank__meta">
        {#if views}<span>{views}</span>{/if}
        {#if when}<time datetime={isoDate}>{when}</time>{/if}
      </span>
    {/if}
  </span>

  {#if !(featured && article.image)}
    <span class="rank__thumb">
      {#if article.image}
        <img
          src={imgUrl(article.image, 160) ?? article.image}
          srcset={imgSrcset(article.image, 64)}
          sizes="64px"
          alt=""
          loading="lazy"
          decoding="async"
          on:error={imgFallback}
        />
      {/if}
    </span>
  {/if}
</a>

<style>
  /* Row: big rank number, the headline, a small thumbnail on the right. */
  .rank {
    display: grid;
    grid-template-columns: 2.25rem minmax(0, 1fr) 64px;
    align-items: center;
    gap: 0.75rem;
    min-height: 64px;
    padding: 0.7rem 0;
    border-bottom: 1px solid #f0f0f0;
    color: inherit;
    text-decoration: none;
  }

  :global(li:last-child) > .rank,
  .rank:last-child {
    border-bottom: 0;
  }

  .rank--plain {
    grid-template-columns: minmax(0, 1fr) 64px;
  }

  .rank:focus-visible {
    outline: 3px solid var(--site-dark, #111);
    outline-offset: 3px;
    border-radius: 8px;
  }

  .rank__no {
    align-self: start;
    color: var(--site-dark, #0a0a0a);
    font-size: 2.25rem;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .rank__body {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .rank__cat {
    color: #6b7280;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .rank__title {
    display: -webkit-box;
    overflow: hidden;
    color: #111;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.35;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    text-decoration-color: var(--site-primary, #f1ff32);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  .rank__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.5rem;
    color: #6b7280;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }

  .rank__meta > * + *::before {
    content: '·';
    margin-right: 0.5rem;
  }

  .rank__thumb {
    display: block;
    width: 64px;
    height: 48px;
    overflow: hidden;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--site-dark, #0a0a0a), #333);
  }

  .rank__thumb img,
  .rank__photo img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 200ms ease;
  }

  /* #1: the photo leads, the number sits on it in the site accent. */
  .rank--featured {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.65rem;
    padding-top: 0;
  }

  .rank__photo {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 12px;
    background: var(--site-dark, #0a0a0a);
  }

  .rank__no--on-photo {
    position: absolute;
    left: 0;
    bottom: 0;
    min-width: 3rem;
    padding: 0.3rem 0.65rem 0.25rem;
    border-top-right-radius: 12px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
    font-size: 2.5rem;
    line-height: 1;
  }

  .rank--featured .rank__title {
    font-size: 1rem;
    font-weight: 800;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .rank--featured .rank__cat {
    width: fit-content;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-badge-text, #111);
  }

  @media (hover: hover) {
    .rank:hover .rank__title {
      text-decoration-line: underline;
    }

    .rank:hover img {
      transform: scale(1.04);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rank__thumb img,
    .rank__photo img {
      transition: none;
    }

    .rank:hover img {
      transform: none;
    }
  }
</style>
