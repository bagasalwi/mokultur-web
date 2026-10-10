<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import type { ArticleListItem } from '$lib/api';
  import { timeAgo, imgFallback } from '$lib/format';
  import SectionHead from '$components/ui/SectionHead.svelte';
  import NewsroomBlock from '$components/home/NewsroomBlock.svelte';

  export let articles: ArticleListItem[] = [];
  export let style: string = 'immersive';
  export let title = 'Teknologi';
  export let description = 'Berita dan ulasan seputar teknologi terkini.';
  export let categorySlug = 'tech';



  $: lead = articles[0] ?? null;
  $: supporting = articles.slice(1, 5);
  $: headingId = `home-section-${categorySlug}`;
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
          <a href="/category/{categorySlug}" class="theme-btn theme-btn--see-all theme-btn--sm flex-shrink-0 ms-3">
            Lihat Semua <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        <div class="article-scroll-grid">
          {#each articles as item}
            <a href="/article/{item.id}/{item.slug}" class="text-decoration-none">
              <div class="card border-0 card-hover h-100" style="border-radius: 10px; overflow: hidden;">
                <div class="px-2 pt-2">
                  <img
                    src={imgUrl(item.image, 480) ?? '/images/noimage.png'}
                    srcset={imgSrcset(item.image, 300)}
                    sizes="(max-width: 767px) 72vw, 25vw"
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
                  <small class="text-muted mt-auto" style="font-size: 0.7rem;">{#if item.format === 'photo-story'}Photo Story · {item.photoCount} foto · {/if}{timeAgo(item.publishDate)}</small>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    </section>

  {:else if style === 'newsroom'}
    <!-- Newsroom: a light news-desk block. Lead story beside a tight list of
         four, headed like every other homepage section. -->
    <section class="newsroom" aria-labelledby={headingId}>
      <div class="container-xl">
        <SectionHead {title} sub={description || null} {headingId}>
          <a slot="action" href="/category/{categorySlug}" class="theme-btn theme-btn--see-all theme-btn--sm flex-shrink-0">
            Lihat Semua <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </a>
        </SectionHead>

        <NewsroomBlock {articles} />
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
          <a href="/category/{categorySlug}" class="theme-btn theme-btn--see-all theme-btn--sm flex-shrink-0 ms-3">
            Lihat Semua <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        {#if lead}
          <div class="article-list-big__layout">
            <a href="/article/{lead.id}/{lead.slug}" class="article-list-big__lead text-decoration-none">
              <div class="article-list-big__lead-media">
                <img src={imgUrl(lead.image, 768) ?? '/images/noimage.png'} srcset={imgSrcset(lead.image, 560)} sizes="(max-width: 991px) 100vw, 560px" alt={lead.title} loading="lazy" decoding="async" on:error={imgFallback} />
              </div>
              <div class="article-list-big__lead-body">
                {#if lead.category}
                  <span class="badge badge-main">{lead.category.name}</span>
                {/if}
                <h4>{lead.title}</h4>
                {#if lead.description}
                  <p>{lead.description}</p>
                {/if}
                <small>{#if lead.format === 'photo-story'}Photo Story · {lead.photoCount} foto · {/if}{timeAgo(lead.publishDate)}</small>
              </div>
            </a>

            <div class="article-list-big__supporting">
              {#each supporting as item}
                <a href="/article/{item.id}/{item.slug}" class="article-list-big__item text-decoration-none">
                  <div class="article-list-big__item-media">
                    <img src={imgUrl(item.image, 320) ?? '/images/noimage.png'} srcset={imgSrcset(item.image, 180)} sizes="180px" alt={item.title} loading="lazy" decoding="async" on:error={imgFallback} />
                  </div>
                  <div class="article-list-big__item-body">
                    {#if item.category}
                      <span class="badge badge-main">{item.category.name}</span>
                    {/if}
                    <h6>{item.title}</h6>
                    <small>{#if item.format === 'photo-story'}Photo Story · {item.photoCount} foto · {/if}{timeAgo(item.publishDate)}</small>
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
          <a href="/category/{categorySlug}" class="theme-btn theme-btn--see-all theme-btn--on-dark theme-btn--sm flex-shrink-0 ms-3">
            Lihat Semua <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        {#if lead}
          <div class="article-list-big__layout">
            <a href="/article/{lead.id}/{lead.slug}" class="article-list-big__lead text-decoration-none">
              <div class="article-list-big__lead-media">
                <img src={imgUrl(lead.image, 768) ?? '/images/noimage.png'} srcset={imgSrcset(lead.image, 560)} sizes="(max-width: 991px) 100vw, 560px" alt={lead.title} loading="lazy" decoding="async" on:error={imgFallback} />
              </div>
              <div class="article-list-big__lead-body">
                {#if lead.category}
                  <span class="badge badge-main">{lead.category.name}</span>
                {/if}
                <h4>{lead.title}</h4>
                {#if lead.description}
                  <p>{lead.description}</p>
                {/if}
                <small>{#if lead.format === 'photo-story'}Photo Story · {lead.photoCount} foto · {/if}{timeAgo(lead.publishDate)}</small>
              </div>
            </a>

            <div class="article-list-big__supporting">
              {#each supporting as item}
                <a href="/article/{item.id}/{item.slug}" class="article-list-big__item text-decoration-none">
                  <div class="article-list-big__item-media">
                    <img src={imgUrl(item.image, 320) ?? '/images/noimage.png'} srcset={imgSrcset(item.image, 180)} sizes="180px" alt={item.title} loading="lazy" decoding="async" on:error={imgFallback} />
                  </div>
                  <div class="article-list-big__item-body">
                    {#if item.category}
                      <span class="badge badge-main">{item.category.name}</span>
                    {/if}
                    <h6>{item.title}</h6>
                    <small>{#if item.format === 'photo-story'}Photo Story · {item.photoCount} foto · {/if}{timeAgo(item.publishDate)}</small>
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

<style>
  .newsroom { padding: 2rem 0; }
  @media (max-width: 575px) { .newsroom { padding: 1.5rem 0; } }
</style>
