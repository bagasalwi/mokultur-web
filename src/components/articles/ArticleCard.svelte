<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { ArticleListItem } from '$lib/api';
  import { timeAgo, imgFallback } from '$lib/format';

  export let article: ArticleListItem;
  export let variant: 'vertical' | 'horizontal' | 'minimal' | 'compact'
    | 'magazine' | 'compact-news' | 'feature-tile' | 'borderless-feed' = 'vertical';

  function formatDate(d: string | null): string {
    if (!d) return '';
    const [year, month, day] = d.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }


  $: href = `/article/${article.id}/${article.slug}`;
  $: meta = `${article.format === 'photo-story' ? `Photo Story · ${article.photoCount ?? 0} foto · ` : ''}${timeAgo(article.publishDate)}`;

</script>

{#if variant === 'horizontal'}
  <article class="article-card article-card--horizontal">
    <a {href} class="article-card-link text-decoration-none d-flex w-100 h-100">
      {#if article.image}
        <div class="article-card--horizontal__img">
          <img src={imgUrl(article.image, 320)} srcset={imgSrcset(article.image, 160)} sizes="160px" alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
        </div>
      {/if}
      <div class="article-card--horizontal__body">
        {#if article.category}
          <span class="badge badge-main" style="font-size:0.65rem">{article.category.name}</span>
        {/if}
        <h6 class="article-card--horizontal__title">{article.title}</h6>
        <small class="text-muted">{meta}</small>
      </div>
    </a>
  </article>

{:else if variant === 'minimal'}
  <article class="article-card-minimal mb-3">
    <a {href} class="text-decoration-none d-flex align-items-start gap-2">
      {#if article.category}
        <span class="badge badge-main flex-shrink-0">{article.category.name}</span>
      {/if}
      <span class="small fw-semibold text-dark lh-sm article-card-minimal__title">{article.title}</span>
      {#if article.format === 'photo-story'}<small class="text-muted">Photo Story · {article.photoCount} foto</small>{/if}
    </a>
  </article>

{:else if variant === 'compact'}
  <article class="d-flex gap-2 mb-3">
    {#if article.image}
      <a {href} class="flex-shrink-0">
        <img src={imgUrl(article.image, 160)} srcset={imgSrcset(article.image, 64)} sizes="64px" alt={article.title} loading="lazy" decoding="async"
          style="width:64px; height:48px; object-fit:cover; border-radius:6px;" on:error={imgFallback} />
      </a>
    {/if}
    <div class="min-w-0">
      <a {href} class="text-decoration-none">
        <p class="mb-1 small fw-semibold text-dark lh-sm line-clamp-2">{article.title}</p>
      </a>
      <small class="text-muted">{meta}</small>
    </div>
  </article>

{:else if variant === 'magazine'}
  <article class="article-card--magazine">
    <a {href} class="text-decoration-none d-block">
      <div class="article-card--magazine__img">
        <img src={imgUrl(article.image, 480) ?? '/images/noimage.png'} srcset={imgSrcset(article.image, 300)} sizes="(max-width: 767px) 72vw, (max-width: 991px) 50vw, 25vw" alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
        <div class="article-card--magazine__overlay">
          {#if article.category}
            <span class="badge badge-main mb-1" style="font-size:0.6rem">{article.category.name}</span>
          {/if}
          <div class="article-card--magazine__title">{article.title}</div>
          <span class="article-card--magazine__meta">{meta}</span>
        </div>
      </div>
    </a>
  </article>

{:else if variant === 'compact-news'}
  <a {href} class="article-card-compact-news text-decoration-none d-block">
    {#if article.category}
      <span class="article-card-compact-news__category">{article.category.name}</span>
    {/if}
    <h6>{article.title}</h6>
    <time datetime={article.publishDate ?? ''}>{meta}</time>
  </a>

{:else if variant === 'feature-tile'}
  <a {href} class="article-card-feature-tile text-decoration-none d-block">
    <img src={imgUrl(article.image, 480) ?? '/images/noimage.png'} srcset={imgSrcset(article.image, 300)} sizes="(max-width: 767px) 72vw, (max-width: 991px) 50vw, 25vw" alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
    <div class="article-card-feature-tile__body">
      {#if article.category}
        <span class="badge badge-main">{article.category.name}</span>
      {/if}
      <h6>{article.title}</h6>
      <time datetime={article.publishDate ?? ''}>{meta}</time>
    </div>
  </a>

{:else if variant === 'borderless-feed'}
  <a {href} class="article-card-borderless-feed text-decoration-none d-block">
    <img src={imgUrl(article.image, 480) ?? '/images/noimage.png'} srcset={imgSrcset(article.image, 300)} sizes="(max-width: 767px) 72vw, (max-width: 991px) 50vw, 25vw" alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
    <div>
      {#if article.category}
        <span>{article.category.name}</span>
      {/if}
      <h6>{article.title}</h6>
      <time datetime={article.publishDate ?? ''}>{meta}</time>
    </div>
  </a>

{:else}
  <!-- Default: vertical card -->
  <article class="article-card article-card--vertical card-hover h-100">
    <a {href} class="article-card-link vcard__link text-decoration-none h-100">
      <div class="vcard__media">
        {#if article.image}
          <img src={imgUrl(article.image, 480)} srcset={imgSrcset(article.image, 300)} sizes="(max-width: 767px) 48vw, (max-width: 991px) 50vw, 25vw" alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
        {/if}
      </div>
      <div class="vcard__body">
        {#if article.category || (article.isReview && article.reviewScore)}
          <div class="vcard__badges">
            {#if article.category}
              <span class="badge badge-main">{article.category.name}</span>
            {/if}
            {#if article.isReview && article.reviewScore}
              <span class="badge badge-main"><i class="bi bi-star-fill" aria-hidden="true"></i> {article.reviewScore}</span>
            {/if}
          </div>
        {/if}
        <h3 class="vcard__title">{article.title}</h3>
        {#if article.description}
          <p class="vcard__desc">{article.description}</p>
        {/if}
        <small class="vcard__meta">{meta}</small>
      </div>
    </a>
  </article>
{/if}

<style>
  .badge-main { max-width: 100%; white-space: normal; text-align: left; line-height: 1.3; }
  .article-card-minimal a { flex-wrap: wrap; }
  .article-card-minimal__title { flex: 1 1 180px; min-width: 0; overflow-wrap: anywhere; }
  .article-card-minimal small { flex-basis: 100%; }
  .article-card--horizontal__body small { overflow-wrap: anywhere; }
  /* Vertical card: sized by its own width, not the viewport, so the same card
     reads right in a 3-up desktop grid and a 2-up phone grid. */
  .article-card--vertical {
    container-type: inline-size;
    overflow: hidden;
  }
  .vcard__link { display: flex; flex-direction: column; }
  .vcard__media {
    aspect-ratio: 3 / 2;
    background: #f0f0f0;
    overflow: hidden;
  }
  .vcard__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .vcard__body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0.875rem 1rem 1rem;
  }
  .vcard__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }
  .vcard__title {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: #1a1a1a;
    margin: 0 0 0.375rem;
    text-wrap: pretty;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .vcard__desc {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 0 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .vcard__meta {
    color: #6b7280;
    font-size: 0.75rem;
    margin-top: auto;
  }

  /* Narrow card (2-up on phones): tighter frame, smaller title, no excerpt. */
  @container (max-width: 220px) {
    .vcard__media { aspect-ratio: 4 / 3; }
    .vcard__body { padding: 0.625rem 0.75rem 0.75rem; }
    .vcard__badges { margin-bottom: 0.375rem; }
    .vcard__badges .badge-main {
      font-size: 0.6875rem;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
    }
    .vcard__title {
      font-size: 0.875rem;
      line-height: 1.32;
      margin-bottom: 0.5rem;
      -webkit-line-clamp: 4;
      line-clamp: 4;
    }
    .vcard__desc { display: none; }
  }

  /* Phones: text sits flush with the photo edges; the photo keeps all four
     corners so the card still reads as one unit without a frame. */
  @media (max-width: 767px) {
    .article-card--vertical { border-radius: 0; overflow: visible; }
    .article-card--vertical:active { box-shadow: none; }
    .vcard__media { border-radius: 12px; }
    .vcard__body { padding-inline: 0; }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
