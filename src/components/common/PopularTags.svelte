<script lang="ts">
  import type { Tag } from '$lib/api';
  import SideCard from '$components/sidebar/SideCard.svelte';

  export let tags: Tag[] = [];
  export let title = 'Topik populer';

  // The tags endpoint can repeat a slug (near-duplicate Spatie tags).
  $: unique = tags.filter((tag, i, list) => tag.slug && list.findIndex((t) => t.slug === tag.slug) === i);
</script>

{#if unique.length > 0}
  <SideCard {title} headingId="side-tags">
    <ul class="topics">
      {#each unique as tag (tag.slug)}
        <li><a href="/tag/{tag.slug}"><span aria-hidden="true">#</span>{tag.name.replace(/^#/, '')}</a></li>
      {/each}
    </ul>
  </SideCard>
{/if}

<style>
  .topics { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .topics a {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    min-height: 34px;
    padding: 0 0.8rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #fff;
    color: #1a1a1a;
    font-size: 0.8125rem;
    font-weight: 700;
    text-decoration: none;
    transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
  }
  .topics a span { color: #6b7280; font-weight: 600; }
  .topics a:hover { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .topics a:hover span { color: inherit; }
  .topics a:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
</style>
