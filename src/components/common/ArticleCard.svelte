<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import { timeAgo, imgFallback } from '$lib/format';
  /**
   * The article card the homepage rows use.
   *
   * Extracted from EventSection rather than copied: the event detail page now
   * shows the same card, and two hand-maintained copies of this markup would
   * drift apart the first time either one is touched.
   *
   * Fields are passed individually because the two call sites hold different
   * shapes — the homepage has an ArticleListItem with a nested `category`, the
   * event API returns the category name flat.
   */
  export let id: number;
  export let slug: string;
  export let title: string;
  export let image: string | null = null;
  export let publishDate: string | null = null;
  export let categoryName: string | null = null;



  // The card is ~300px at its widest (4-up inside a 1200px container).
  $: srcset = imgSrcset(image, 300);
</script>

<a href="/article/{id}/{slug}" class="text-decoration-none">
  <div class="card border-0 card-hover h-100" style="border-radius: 10px; overflow: hidden;">
    <div class="px-2 pt-2">
      <img
        src={imgUrl(image, 480) ?? '/images/noimage.png'}
        {srcset}
        sizes="(max-width: 767px) 72vw, (max-width: 991px) 50vw, 25vw"
        alt={title}
        class="img-article-2 w-100"
        loading="lazy"
        decoding="async"
        style="border-radius: 8px; object-fit: cover;"
        on:error={imgFallback}
      />
    </div>
    <div class="p-2 pt-2 pb-3 d-flex flex-column flex-grow-1">
      {#if categoryName}
        <span class="badge badge-main mb-1 align-self-start" style="font-size: 0.65rem;">
          {categoryName}
        </span>
      {/if}
      <h6 class="article-title text-dark mb-1 lh-sm">{title}</h6>
      <small class="text-muted mt-auto" style="font-size: 0.7rem;">{timeAgo(publishDate)}</small>
    </div>
  </div>
</a>
