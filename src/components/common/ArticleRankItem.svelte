<script lang="ts">
  import type { ArticleListItem } from '$lib/api';

  export let article: ArticleListItem;
  export let rank: number;
</script>

<a href="/article/{article.id}/{article.slug}" class="popular-item text-decoration-none">
  <div class="popular-item__thumb">
    {#if article.image}
      <img src={article.image} alt={article.title} loading="lazy" decoding="async" />
    {:else}
      <div class="popular-item__thumb-placeholder">{rank}</div>
    {/if}
    <span class="popular-item__rank">{rank}</span>
  </div>
  <div class="popular-item__body">
    {#if article.category}
      <span class="popular-item__cat">{article.category.name}</span>
    {/if}
    <p class="popular-item__title">{article.title}</p>
  </div>
</a>
