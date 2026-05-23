<script lang="ts">
  import type { ArticleListItem } from '$lib/api';

  export let article: ArticleListItem;
  export let variant: 'vertical' | 'horizontal' | 'minimal' | 'compact'
    | 'magazine' | 'compact-news' | 'feature-tile' | 'borderless-feed' = 'vertical';

  function formatDate(d: string | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function timeAgo(d: string | null): string {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
    return formatDate(d);
  }

  $: href = `/article/${article.id}/${article.slug}`;

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }
</script>

{#if variant === 'horizontal'}
  <article class="article-card article-card--horizontal">
    <a {href} class="article-card-link text-decoration-none d-flex w-100 h-100">
      {#if article.image}
        <div class="article-card--horizontal__img">
          <img src={article.image} alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
        </div>
      {/if}
      <div class="article-card--horizontal__body">
        {#if article.category}
          <span class="badge badge-main" style="font-size:0.65rem">{article.category.name}</span>
        {/if}
        <h6 class="article-card--horizontal__title">{article.title}</h6>
        <small class="text-muted">{timeAgo(article.publishDate)}</small>
      </div>
    </a>
  </article>

{:else if variant === 'minimal'}
  <article class="mb-3">
    <a {href} class="text-decoration-none d-flex align-items-start gap-2">
      {#if article.category}
        <span class="badge badge-main flex-shrink-0">{article.category.name}</span>
      {/if}
      <span class="small fw-semibold text-dark lh-sm">{article.title}</span>
    </a>
  </article>

{:else if variant === 'compact'}
  <article class="d-flex gap-2 mb-3">
    {#if article.image}
      <a {href} class="flex-shrink-0">
        <img src={article.image} alt={article.title} loading="lazy" decoding="async"
          style="width:64px; height:48px; object-fit:cover; border-radius:6px;" on:error={imgFallback} />
      </a>
    {/if}
    <div class="min-w-0">
      <a {href} class="text-decoration-none">
        <p class="mb-1 small fw-semibold text-dark lh-sm line-clamp-2">{article.title}</p>
      </a>
      <small class="text-muted">{timeAgo(article.publishDate)}</small>
    </div>
  </article>

{:else if variant === 'magazine'}
  <article class="article-card--magazine">
    <a {href} class="text-decoration-none d-block">
      <div class="article-card--magazine__img">
        <img src={article.image ?? '/images/noimage.png'} alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
        <div class="article-card--magazine__overlay">
          {#if article.category}
            <span class="badge badge-main mb-1" style="font-size:0.6rem">{article.category.name}</span>
          {/if}
          <div class="article-card--magazine__title">{article.title}</div>
          <span class="article-card--magazine__meta">{timeAgo(article.publishDate)}</span>
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
    <time datetime={article.publishDate ?? ''}>{timeAgo(article.publishDate)}</time>
  </a>

{:else if variant === 'feature-tile'}
  <a {href} class="article-card-feature-tile text-decoration-none d-block">
    <img src={article.image ?? '/images/noimage.png'} alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
    <div class="article-card-feature-tile__body">
      {#if article.category}
        <span class="badge badge-main">{article.category.name}</span>
      {/if}
      <h6>{article.title}</h6>
      <time datetime={article.publishDate ?? ''}>{timeAgo(article.publishDate)}</time>
    </div>
  </a>

{:else if variant === 'borderless-feed'}
  <a {href} class="article-card-borderless-feed text-decoration-none d-block">
    <img src={article.image ?? '/images/noimage.png'} alt={article.title} loading="lazy" decoding="async" on:error={imgFallback} />
    <div>
      {#if article.category}
        <span>{article.category.name}</span>
      {/if}
      <h6>{article.title}</h6>
      <time datetime={article.publishDate ?? ''}>{timeAgo(article.publishDate)}</time>
    </div>
  </a>

{:else}
  <!-- Default: vertical card -->
  <article class="article-card card-hover h-100">
    <a {href} class="article-card-link text-decoration-none d-block h-100">
      {#if article.image}
        <div class="overflow-hidden" style="height: 160px; border-radius: 8px 8px 0 0;">
          <img src={article.image} alt={article.title} loading="lazy" decoding="async"
            class="w-100 h-100" style="object-fit:cover; transition: transform 0.3s ease;" on:error={imgFallback} />
        </div>
      {:else}
        <div style="height:160px; background: #f0f0f0; border-radius: 8px 8px 0 0;"></div>
      {/if}
      <div class="p-3">
        {#if article.category}
          <span class="badge badge-main mb-2">{article.category.name}</span>
        {/if}
        {#if article.isReview && article.reviewScore}
          <span class="badge bg-warning text-dark mb-2 ms-1">★ {article.reviewScore}</span>
        {/if}
        <h5 class="fw-bold mb-2 lh-sm" style="font-size: 1rem;">{article.title}</h5>
        {#if article.description}
          <p class="text-muted small mb-2 line-clamp-2">{article.description}</p>
        {/if}
        <div class="d-flex align-items-center justify-content-between mt-auto">
          <small class="text-muted">{timeAgo(article.publishDate)}</small>
          {#if article.viewCount}
            <small class="text-muted"><i class="bi bi-eye me-1"></i>{article.viewCount.toLocaleString('id-ID')}</small>
          {/if}
        </div>
      </div>
    </a>
  </article>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
