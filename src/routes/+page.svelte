<script lang="ts">
  import type { PageData } from './$types';
  import ArticleCard from '$components/articles/ArticleCard.svelte';
  import PopularTags from '$components/common/PopularTags.svelte';
  import HeroCinematic from '$components/hero/HeroCinematic.svelte';
  import EventSection from '$components/home/EventSection.svelte';
  import SocialMediaCard from '$components/common/SocialMediaCard.svelte';
  import PopularArticlesCard from '$components/common/PopularArticlesCard.svelte';
  import WritersCard from '$components/home/WritersCard.svelte';
  import TechSection from '$components/home/TechSection.svelte';
  import AdBanner from '$components/common/AdBanner.svelte';
  import CurhatCard from '$components/curhatan/CurhatCard.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';

  type CardStyle = 'vertical' | 'horizontal' | 'magazine' | 'minimal' | 'compact-news' | 'feature-tile' | 'borderless-feed';
  $: cardStyle = (data.settings?.card_style ?? 'vertical') as CardStyle;

  const colMap: Record<string, string> = {
    vertical: 'col-6 col-sm-6 col-md-6 col-lg-4',
    horizontal: 'col-12 col-md-6',
    magazine: 'col-6 col-md-4',
    minimal: 'col-12',
    'compact-news': 'col-12',
    'feature-tile': 'col-12 col-md-6 col-lg-4',
    'borderless-feed': 'col-12 col-md-6',
  };

  $: homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} - Artikel Terbaru`,
    itemListElement: data.latest.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `/article/${a.id}/${a.slug}`,
      name: a.title,
    })),
  };
</script>

<svelte:head>
  <title>{siteName} - Berita, Review &amp; Budaya Pop Indonesia</title>
  <meta name="description" content="Berita, ulasan, dan wawasan budaya pop terkini dari {siteName}." />
  <link rel="canonical" href="/" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{siteName} - Berita, Review & Budaya Pop Indonesia" />
  <meta property="og:description" content="Berita, ulasan, dan wawasan budaya pop terkini dari {siteName}." />
  <meta property="og:url" content="/" />
  {#if data.headlines[0]?.image}
    <meta property="og:image" content={data.headlines[0].image} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{siteName} - Berita, Review & Budaya Pop Indonesia" />
  <meta name="twitter:description" content="Berita, ulasan, dan wawasan budaya pop terkini dari {siteName}." />
  {#if data.headlines[0]?.image}
    <meta name="twitter:image" content={data.headlines[0].image} />
  {/if}
  {@html `<script type="application/ld+json">${JSON.stringify(homeSchema)}<\/script>`}
  {#if data.headlines[0]?.image}
    <link rel="preload" as="image" href={data.headlines[0].image} fetchpriority="high" />
  {/if}
</svelte:head>

<div class="home-page">
  <div class="container-xl">
    <AdBanner ad={data.adTop} adSlot="ad_0" />
  </div>

  <HeroCinematic articles={data.headlines} />

  <div class="container-xl">
    <AdBanner ad={data.adMid} adSlot="ad_1" />
  </div>

  <EventSection articles={data.eventArticles} />

  {#if data.settings?.curhat_enabled && data.homeCurhatan.length > 0}
    <section class="container-xl py-4">
      <div class="home-collab-card mb-2">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-lg-4">
            <span class="badge badge-main mb-2">Curhatan {siteName}</span>
            <h2 class="home-collab-card__title text-white mb-1">Lagi pengen cerita?</h2>
            <p class="home-collab-card__description mb-3">Cerita jujurmu tentang apapun — anonim atau tidak. Dibaca, didengar, dan disukai komunitas.</p>
            <div class="home-collab-card__chips mb-3">
              <span><i class="bi bi-incognito"></i> Boleh anonim</span>
              <span><i class="bi bi-shield-check"></i> Aman</span>
              <span><i class="bi bi-chat-heart"></i> Dibaca komunitas</span>
            </div>
            <a href="/curhatan" class="theme-btn theme-btn--primary">Lihat Semua Curhatan <i class="bi bi-arrow-right"></i></a>
          </div>
          <div class="col-12 col-lg-8">
            <div class="curhat-masonry curhat-masonry--preview">
              {#each data.homeCurhatan as item (item.id)}
                <div class="curhat-masonry__item">
                  <CurhatCard {item} excerptLimit={160} />
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- Latest Articles -->
  <section class="container-xl pt-4 pb-5 pb-lg-4">
    <div class="row">
      <div class="col-lg-8">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h2 class="fw-bold mb-0 h4">Terbaru</h2>
          <a href="/index-article" class="theme-btn theme-btn--ghost theme-btn--sm">Lihat Semua <i class="bi bi-arrow-right"></i></a>
        </div>
        <div class="row g-4">
          {#each data.latest as article}
            <div class="{colMap[cardStyle] ?? 'col-6 col-sm-6 col-md-6 col-lg-4'}">
              <ArticleCard {article} variant={cardStyle} />
            </div>
          {/each}
        </div>
      </div>

      <!-- Sidebar -->
      <div class="col-lg-4">
        <div class="sticky-top" style="top: 80px;">
          <SocialMediaCard socials={data.socials} />
          <PopularArticlesCard articles={data.popularArticles} />
          <WritersCard writers={data.writers} />
          <PopularTags tags={data.popularTags} />
          <AdBanner ad={data.adSidebar} adSlot="ad_2" size="sidebar" />
        </div>
      </div>
    </div>
  </section>

  <TechSection
    articles={data.techArticles}
    style={data.settings?.tech_section_style ?? 'immersive'}
  />

  <div class="container-xl">
    <AdBanner ad={data.adBottom} adSlot="ad_3" />
  </div>

  {#if data.moreArticles.length > 0}
    <section class="container-xl pt-5 pb-5">
      <div class="row g-4">
        {#each data.moreArticles as article}
          <div class="col-6 col-md-4 col-lg-3">
            <ArticleCard {article} variant={cardStyle} />
          </div>
        {/each}
      </div>
      <div class="text-center mt-4">
        <a href="/index-article" class="theme-btn theme-btn--dark">Lihat Semua Artikel <i class="bi bi-arrow-right"></i></a>
      </div>
    </section>
  {/if}
</div>
