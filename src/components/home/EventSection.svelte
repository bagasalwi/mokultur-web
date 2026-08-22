<script lang="ts">
  import type { ArticleListItem } from '$lib/api';
  import ArticleCard from '$components/common/ArticleCard.svelte';

  export let articles: ArticleListItem[] = [];
  export let title = 'Event & Press Release';
  export let description = 'Kumpulan beragam artikel dari event-event yang ada di indonesia!';
  export let categorySlug = 'event';
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
          <ArticleCard
            id={item.id}
            slug={item.slug}
            title={item.title}
            image={item.image}
            publishDate={item.publishDate}
            categoryName={item.category?.name ?? null}
          />
        {/each}
      </div>
    </div>
  </section>
{/if}
