<script lang="ts">
  import { PUBLIC_API_URL } from '$env/static/public';
  import { page } from '$app/stores';
  import type { AdItem } from '$lib/api';

  export let ad: AdItem | null = null;
  export let adSlot: string = '';
  export let size: 'banner' | 'sidebar' = 'banner';

  $: clickUrl = ad ? `${PUBLIC_API_URL}/api/ads/${ad.id}/click` : '#';
  $: isPreview = $page.url.searchParams.get('preview_ads') === 'true';
</script>

{#if ad}
  <div class="ad-banner">
    <a href={clickUrl} target="_blank" rel="noopener sponsored nofollow">
      <picture>
        {#if ad.imageMobile}
          <source media="(max-width: 767px)" srcset={ad.imageMobile} />
        {/if}
        <img src={ad.image} alt={ad.title} loading="lazy" decoding="async" />
      </picture>
    </a>
  </div>
{:else if isPreview}
  <div class="ad-placeholder ad-placeholder--{size}">
    <span class="ad-placeholder__label">AD SLOT</span>
    <span class="ad-placeholder__slot">{adSlot || (size === 'sidebar' ? '300 × 250' : '728 × 90')}</span>
    <span class="ad-placeholder__size">{size === 'sidebar' ? '300 × 250 px' : '728 × 90 px'}</span>
  </div>
{/if}
