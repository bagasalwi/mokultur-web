<script lang="ts">
  import type { ArticleListItem } from '$lib/api';

  export let articles: ArticleListItem[] = [];
  export let style: string = 'immersive';
  export let title = 'Teknologi';
  export let description = 'Berita dan ulasan seputar teknologi terkini.';
  export let categorySlug = 'tech';

  function timeAgo(d: string | null): string {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    return `${Math.floor(days / 30)} bulan lalu`;
  }

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }

  $: lead = articles[0] ?? null;
  $: supporting = articles.slice(1, 5);
</script>

{#if articles.length > 0}
  {#if style === 'standard'}
    <section class="section-md article-list-big article-list-big--standard" style="background-color: #fafafa;">
      <div class="container-xl">
        <div class="article-list-big__header d-flex align-items-end justify-content-between mb-3">
          <div>
            <h3 class="article-list-big__title fw-boldest mb-1">{title}</h3>
            {#if description}
              <p class="article-list-big__description text-muted small mb-0">{description}</p>
            {/if}
          </div>
          <a href="/category/{categorySlug}" class="theme-btn theme-btn--ghost theme-btn--sm flex-shrink-0 ms-3">
            Lihat Semua <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        <div class="article-scroll-grid">
          {#each articles as item}
            <a href="/article/{item.id}/{item.slug}" class="text-decoration-none">
              <div class="card border-0 card-hover h-100" style="border-radius: 10px; overflow: hidden;">
                <div class="px-2 pt-2">
                  <img
                    src={item.image ?? '/images/noimage.png'}
                    alt={item.title}
                    class="img-article-2 w-100"
                    loading="lazy"
                    decoding="async"
                    style="border-radius: 8px; object-fit: cover;"
                    on:error={imgFallback}
                  />
                </div>
                <div class="p-2 pt-2 pb-3 d-flex flex-column flex-grow-1">
                  {#if item.category}
                    <span class="badge badge-main mb-1 align-self-start" style="font-size: 0.65rem;">
                      {item.category.name}
                    </span>
                  {/if}
                  <h6 class="article-title text-dark mb-1 lh-sm">{item.title}</h6>
                  <small class="text-muted mt-auto" style="font-size: 0.7rem;">{timeAgo(item.publishDate)}</small>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    </section>

  {:else if style === 'magazine'}
    <section class="section-md article-list-big article-list-big--magazine">
      <div class="container-xl">
        <div class="article-list-big__header d-flex align-items-end justify-content-between mb-4">
          <div>
            <span class="article-list-big__eyebrow"><i class="bi bi-cpu me-1"></i>{title}</span>
            {#if description}
              <p class="article-list-big__description text-muted small mb-0">{description}</p>
            {/if}
          </div>
          <a href="/category/{categorySlug}" class="theme-btn theme-btn--ghost theme-btn--sm flex-shrink-0 ms-3">
            Lihat Semua <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        {#if lead}
          <div class="article-list-big__layout">
            <a href="/article/{lead.id}/{lead.slug}" class="article-list-big__lead text-decoration-none">
              <div class="article-list-big__lead-media">
                <img src={lead.image ?? '/images/noimage.png'} alt={lead.title} loading="lazy" decoding="async" on:error={imgFallback} />
              </div>
              <div class="article-list-big__lead-body">
                {#if lead.category}
                  <span class="badge badge-main">{lead.category.name}</span>
                {/if}
                <h4>{lead.title}</h4>
                {#if lead.description}
                  <p>{lead.description}</p>
                {/if}
                <small>{timeAgo(lead.publishDate)}</small>
              </div>
            </a>

            <div class="article-list-big__supporting">
              {#each supporting as item}
                <a href="/article/{item.id}/{item.slug}" class="article-list-big__item text-decoration-none">
                  <div class="article-list-big__item-media">
                    <img src={item.image ?? '/images/noimage.png'} alt={item.title} loading="lazy" decoding="async" on:error={imgFallback} />
                  </div>
                  <div class="article-list-big__item-body">
                    {#if item.category}
                      <span class="badge badge-main">{item.category.name}</span>
                    {/if}
                    <h6>{item.title}</h6>
                    <small>{timeAgo(item.publishDate)}</small>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else}
    <!-- immersive (default) -->
    <section class="section-md article-list-big article-list-big--immersive">
      <div class="container-xl">
        <div class="article-list-big__header d-flex align-items-end justify-content-between mb-4">
          <div>
            <span class="article-list-big__eyebrow"><i class="bi bi-cpu me-1"></i>{title}</span>
            {#if description}
              <p class="article-list-big__description small mb-0">{description}</p>
            {/if}
          </div>
          <a href="/category/{categorySlug}" class="theme-btn theme-btn--ghost theme-btn--sm flex-shrink-0 ms-3">
            Lihat Semua <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        {#if lead}
          <div class="article-list-big__layout">
            <a href="/article/{lead.id}/{lead.slug}" class="article-list-big__lead text-decoration-none">
              <div class="article-list-big__lead-media">
                <img src={lead.image ?? '/images/noimage.png'} alt={lead.title} loading="lazy" decoding="async" on:error={imgFallback} />
              </div>
              <div class="article-list-big__lead-body">
                {#if lead.category}
                  <span class="badge badge-main">{lead.category.name}</span>
                {/if}
                <h4>{lead.title}</h4>
                {#if lead.description}
                  <p>{lead.description}</p>
                {/if}
                <small>{timeAgo(lead.publishDate)}</small>
              </div>
            </a>

            <div class="article-list-big__supporting">
              {#each supporting as item}
                <a href="/article/{item.id}/{item.slug}" class="article-list-big__item text-decoration-none">
                  <div class="article-list-big__item-media">
                    <img src={item.image ?? '/images/noimage.png'} alt={item.title} loading="lazy" decoding="async" on:error={imgFallback} />
                  </div>
                  <div class="article-list-big__item-body">
                    {#if item.category}
                      <span class="badge badge-main">{item.category.name}</span>
                    {/if}
                    <h6>{item.title}</h6>
                    <small>{timeAgo(item.publishDate)}</small>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>
  {/if}
{/if}
