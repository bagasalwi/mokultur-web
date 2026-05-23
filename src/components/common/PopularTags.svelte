<script lang="ts">
  import type { Tag } from '$lib/api';
  export let tags: Tag[] = [];
</script>

{#if tags.length > 0}
  <div class="popular-tags">
    <h6 class="fw-bold text-uppercase small mb-3" style="letter-spacing: 0.05em; color: var(--site-text-secondary, #6b7280);">
      Tag Populer
    </h6>
    <div class="d-flex flex-wrap gap-2">
      {#each tags as tag}
        <a href="/tag/{tag.slug}" class="badge badge-main text-decoration-none">{tag.name}</a>
      {/each}
    </div>
  </div>
{/if}
