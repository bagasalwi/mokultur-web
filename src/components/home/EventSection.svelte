<script lang="ts">
  import type { ArticleListItem } from '$lib/api';

  export let articles: ArticleListItem[] = [];
  export let title = 'Event & Press Release';
  export let description = 'Kumpulan beragam artikel dari event-event yang ada di indonesia!';
  export let categorySlug = 'event';

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
</script>

{#if articles.length > 0}
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
{/if}
