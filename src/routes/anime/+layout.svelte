<script lang="ts">
  /**
   * The anime pages are aggregated MyAnimeList data — thin, duplicated from an
   * upstream everyone already ranks for, and they earned effectively no search
   * traffic. They were 642 of the 1,448 URLs in the sitemap, so Google spent
   * close to half its crawl budget here instead of on articles.
   *
   * "follow" rather than "nofollow": the pages link out to articles that do
   * deserve indexing, and there is no reason to strand those.
   *
   * This has to stay crawlable to work. Do NOT add "Disallow: /anime" to
   * robots.txt until Search Console reports these pages gone — blocking the
   * crawl first would leave Google unable to read this tag, freezing the pages
   * in the index as "indexed, though blocked by robots.txt" with no way back.
   */
</script>

<svelte:head>
  <meta name="robots" content="noindex, follow" />
</svelte:head>

<slot />
