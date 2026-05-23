<script lang="ts">
  import type { ArticleListItem } from '$lib/api';
  import ArticleRankItem from '$components/common/ArticleRankItem.svelte';

  export let articles: ArticleListItem[] = [];
</script>

{#if articles.length > 0}
  <div class="mb-4">
    <div class="line-heading mb-3">
      <h3 class="fw-bold h5 mb-0">
        <span>Artikel Populer</span>
      </h3>
    </div>
    <div class="d-flex flex-column">
      {#each articles as article, i}
        <ArticleRankItem {article} rank={i + 1} />
      {/each}
    </div>
  </div>
{/if}
