<script lang="ts">
  import type { PageData } from './$types';
  import ArticleCard from '$components/articles/ArticleCard.svelte';
  import PopularTags from '$components/common/PopularTags.svelte';
  import Hero from '$components/hero/Hero.svelte';
  import EventSection from '$components/home/EventSection.svelte';
  import EventScheduleSection from '$components/event/EventScheduleSection.svelte';
  import ReelsSection from '$components/home/ReelsSection.svelte';
  import AnimeSeasonSection from '$components/home/AnimeSeasonSection.svelte';
  import AiringTodaySection from '$components/anime/AiringTodaySection.svelte';
  import TastePromoCard from '$components/anime/TastePromoCard.svelte';
  import MokuThreadsPromo from '$components/home/MokuThreadsPromo.svelte';
  import { LOUNGE_ENABLED } from '$lib/features';
  import { absoluteUrl } from '$lib/seo';
  import SocialFollowCard from '$components/sidebar/SocialFollowCard.svelte';
  import GoogleNewsFollow from '$components/sidebar/GoogleNewsFollow.svelte';
  import NewsletterSignup from '$components/sidebar/NewsletterSignup.svelte';
  import PopularArticlesCard, { RANGE_LABELS } from '$components/common/PopularArticlesCard.svelte';
  import WritersCard from '$components/home/WritersCard.svelte';
  import TechSection from '$components/home/TechSection.svelte';
  import AdBanner from '$components/common/AdBanner.svelte';
  import CurhatCard from '$components/curhatan/CurhatCard.svelte';
  import ReaderSection from '$components/home/ReaderSection.svelte';
  import LatestList from '$components/home/LatestList.svelte';
  import SectionHead from '$components/ui/SectionHead.svelte';
  import AnimePosterRail from '$components/home/AnimePosterRail.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';

  type CardStyle = 'vertical' | 'horizontal' | 'magazine' | 'minimal' | 'compact-news' | 'feature-tile' | 'borderless-feed';
  $: cardStyle = (data.settings?.card_style ?? 'vertical') as CardStyle;

  // Both chosen in the dashboard (Settings → Layout). The fallbacks are the
  // homepage as it was before either option existed.
  $: newsFirst = (data.settings?.home_layout ?? 'classic') === 'news-first';
  $: newsList = (data.settings?.latest_section_style ?? 'card-grid') === 'news-list';
  $: animeStyle = data.settings?.anime_section_style ?? 'trio';

  const colMap: Record<string, string> = {
    vertical: 'col-6 col-sm-6 col-md-6 col-lg-4',
    horizontal: 'col-12 col-md-6',
    magazine: 'col-6 col-md-4',
    minimal: 'col-12',
    'compact-news': 'col-12',
    'feature-tile': 'col-12 col-md-6 col-lg-4',
    'borderless-feed': 'col-12 col-md-6',
  };

  // Every story appears once on the page. The hero takes the newest few (how
  // many depends on its variant), Terbaru lists the rest of the latest batch,
  // and every later section skips anything already shown above it.
  const HERO_COUNT: Record<string, number> = { ticker: 6, 'spotlight-stack': 6, masthead: 4 };
  $: heroType = data.settings?.hero_type ?? 'cinematic';
  $: heroIds = new Set(data.headlines.slice(0, HERO_COUNT[heroType] ?? 5).map((a) => a.id));
  $: latestList = data.latest.filter((a) => !heroIds.has(a.id)).slice(0, newsList ? 10 : 9);
  $: shownIds = new Set([...heroIds, ...latestList.map((a) => a.id)]);
  // Signed-in readers get their feed; guests get slightly older stories they
  // may have missed, which also keeps the pick row distinct from Terbaru.
  $: pickSource = data.personalFeed?.data?.length ? data.personalFeed.data : data.moreArticles;
  $: picks = pickSource.filter((a) => !shownIds.has(a.id)).slice(0, 4);
  $: pickIds = new Set(picks.map((a) => a.id));
  $: unseen = (list: typeof data.latest) => list.filter((a) => !shownIds.has(a.id) && !pickIds.has(a.id));
  $: techList = unseen(data.techArticles).slice(0, 5);
  $: eventList = unseen(data.eventArticles).slice(0, 8);
  $: sectionIds = new Set([...techList, ...eventList].map((a) => a.id));
  $: moreCandidates = unseen(data.moreArticles).filter((a) => !sectionIds.has(a.id)).slice(0, 12);
  // Whole rows only: the grid is four across on desktop.
  $: moreGrid = moreCandidates.length > 4 ? moreCandidates.slice(0, moreCandidates.length - (moreCandidates.length % 4)) : moreCandidates;
  $: pickInterests = data.personalFeed
    ? data.personalFeed.availableInterests.filter((i) => data.personalFeed?.interests.includes(i.id)).map((i) => i.label)
    : [];

  // Each anime block hides itself when it has nothing to show — an empty
  // schedule is a normal day, not an error — so the row sizes its columns to
  // however many actually render.
  $: showQuiz = data.settings?.quiz_enabled !== false;
  $: animeCols = [data.seasonAnime.length > 0, data.airingToday.length > 0, showQuiz].filter(Boolean).length;

  $: homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} - Artikel Terbaru`,
    itemListElement: data.latest.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/article/${a.id}/${a.slug}`),
      name: a.title,
    })),
  };

  // Homepage meta comes from the SEO settings group; the old hardcoded copy is
  // the fallback for a site that has never filled those fields in.
  $: metaTitle = data.settings?.meta_title || `${siteName} - Berita, Review & Budaya Pop Indonesia`;
  $: metaDescription =
    data.settings?.meta_description ||
    `Berita, ulasan, dan liputan event seputar anime, manga, cosplay, game, teknologi, dan film. ${siteName} — media kultur interaktifnya Indonesia sejak 2021.`;
  $: metaKeywords = data.settings?.meta_keywords || null;
  $: shareImage = data.headlines[0]?.image || data.settings?.og_image || null;
</script>

<svelte:head>
  <title>{metaTitle}</title>
  <meta name="description" content={metaDescription} />
  {#if metaKeywords}
    <meta name="keywords" content={metaKeywords} />
  {/if}
  <link rel="canonical" href={absoluteUrl('/')} />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={metaTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={absoluteUrl('/')} />
  {#if shareImage}
    <meta property="og:image" content={shareImage} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={metaTitle} />
  <meta name="twitter:description" content={metaDescription} />
  {#if shareImage}
    <meta name="twitter:image" content={shareImage} />
  {/if}
  {@html `<script type="application/ld+json">${JSON.stringify(homeSchema)}<\/script>`}
</svelte:head>

<div class="home-page">
  <!--
    The homepage is a feed, not a single subject, so the h1 names the publication
    rather than any one story. Hidden visually because the logo already carries
    this role for sighted users, but it gives crawlers and screen readers the
    top-level heading the page was missing entirely.
  -->
  <h1 class="visually-hidden">{siteName} — Berita, Review &amp; Budaya Pop Indonesia: Anime, Manga, Cosplay, Game, Teknologi, dan Film</h1>

  <div class="container-xl">
    <AdBanner ad={data.adTop} adSlot="ad_0" />
  </div>

  <Hero articles={data.headlines} type={heroType} />

  <div class="container-xl">
    <AdBanner ad={data.adMid} adSlot="ad_1" />
  </div>

  {#snippet latestSection()}
    <section class="container-xl home-latest">
      <div class="row g-4 g-xl-5">
        <div class="col-lg-8">
          <SectionHead title="Terbaru" headingId="home-latest-heading">
            <a slot="action" href="/index-article" class="theme-btn theme-btn--see-all theme-btn--sm">Lihat Semua <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
          </SectionHead>
          {#if newsList}
            <LatestList articles={latestList} />
          {:else}
            <div class="row g-4">
              {#each latestList as article (article.id)}
                <div class="{colMap[cardStyle] ?? 'col-6 col-sm-6 col-md-6 col-lg-4'}">
                  <ArticleCard {article} variant={cardStyle} />
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <div class="sticky-top home-latest__aside">
            <PopularArticlesCard
              headingId="home-popular"
              ranges={(['today', 'week', 'month'] as const).map((key) => ({ key, label: RANGE_LABELS[key], articles: data.popular[key] }))}
              initial="week"
            />
            <SocialFollowCard socials={data.socials} {siteName} />
            <GoogleNewsFollow settings={data.settings} />
            <NewsletterSignup source="home" />
            <WritersCard writers={data.writers} />
            <PopularTags tags={data.popularTags} />
            <AdBanner ad={data.adSidebar} adSlot="ad_2" size="sidebar" />
          </div>
        </div>
      </div>
    </section>
  {/snippet}

  {#snippet pressSection()}
    <EventSection
      title="Liputan & Press Release"
      articles={eventList}
      style={data.settings?.event_section_style ?? 'standard'}
    />
  {/snippet}

  {#snippet loungeSection()}
    {#if LOUNGE_ENABLED}
      <MokuThreadsPromo {siteName} threads={data.trendingThreads} />
    {/if}
  {/snippet}

  {#snippet techSection()}
    <TechSection
      articles={techList}
      style={data.settings?.tech_section_style ?? 'immersive'}
    />

    <div class="container-xl">
      <AdBanner ad={data.adBottom} adSlot="ad_3" />
    </div>
  {/snippet}

  {#snippet curhatSection()}
    {#if data.settings?.curhat_enabled && data.homeCurhatan.length > 0}
      <section class="container-xl py-4" aria-labelledby="home-curhat-heading">
        <div class="curhat-band">
          <div class="curhat-band__intro">
            <h2 id="home-curhat-heading">Lagi pengen cerita?</h2>
            <p>Cerita jujurmu tentang apa pun, boleh anonim. Dibaca, didengar, dan disukai komunitas {siteName}.</p>
            <ul class="curhat-band__chips">
              <li><i class="bi bi-incognito" aria-hidden="true"></i> Boleh anonim</li>
              <li><i class="bi bi-shield-check" aria-hidden="true"></i> Aman</li>
              <li><i class="bi bi-chat-heart" aria-hidden="true"></i> Dibaca komunitas</li>
            </ul>
            <div class="curhat-band__actions">
              <a href="/curhatan#submitCurhat" class="theme-btn theme-btn--primary"><i class="bi bi-pencil" aria-hidden="true"></i> Tulis curhatan</a>
              <a href="/curhatan" class="theme-btn theme-btn--see-all theme-btn--on-dark theme-btn--sm">Lihat semua <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
            </div>
          </div>
          <div class="curhat-band__wall">
            <div class="curhat-masonry curhat-masonry--preview">
              {#each data.homeCurhatan as item (item.id)}
                <div class="curhat-masonry__item">
                  <CurhatCard {item} excerptLimit={160} />
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>
    {/if}
  {/snippet}

  <!-- Section order follows the dashboard's "Tata letak beranda":
       news-first puts Terbaru right under the hero and Liputan & Press
       Release above the anime block; classic keeps the original order. -->
  {#if newsFirst}
    {@render latestSection()}
    <ReaderSection articles={picks} interests={pickInterests} loggedIn={!!data.user} {siteName} />
    {@render loungeSection()}
    {@render pressSection()}
  {:else}
    {@render loungeSection()}
    <ReaderSection articles={picks} interests={pickInterests} loggedIn={!!data.user} {siteName} />
  {/if}

  {#if data.settings?.anime_enabled !== false && animeCols > 0 && animeStyle === 'poster-rail'}
    <AnimePosterRail
      season={data.seasonAnime}
      seasonName={data.animeSeason}
      year={data.animeSeasonYear}
      airing={data.airingToday}
      day={data.airingDay}
      {showQuiz}
    />
  {:else if data.settings?.anime_enabled !== false && animeCols > 0}
  <section class="section-md py-4">
    <div class="container-xl">
      <div class="home-anime-row home-anime-row--cols-{animeCols}">
        <AnimeSeasonSection anime={data.seasonAnime} season={data.animeSeason} year={data.animeSeasonYear} />
        <AiringTodaySection anime={data.airingToday} day={data.airingDay} perCard={3}>
          <a slot="action" href="/anime" class="theme-btn theme-btn--see-all theme-btn--sm flex-shrink-0">
            Lihat Semua <i class="bi bi-arrow-right"></i>
          </a>
        </AiringTodaySection>

        <!-- Third column of the row, headed like its neighbours so all three
             cards start on the same line: someone browsing seasonal listings
             is exactly who the quiz is for. -->
        {#if showQuiz}
          <div class="home-anime-row__promo">
            <SectionHead title="Kuis Anime" sub="Cari tahu anime yang cocok untukmu." />
            <TastePromoCard />
          </div>
        {/if}
      </div>
    </div>
  </section>
  {/if}

  {#if data.settings?.event_enabled !== false}
    <EventScheduleSection events={data.upcomingEvents} />
  {/if}

  {#if !newsFirst}
    {@render pressSection()}
  {/if}

  <ReelsSection reels={data.reels} profile={data.igProfile} />

  {#if newsFirst}
    {@render techSection()}
    {@render curhatSection()}
  {:else}
    {@render curhatSection()}
    {@render latestSection()}
    {@render techSection()}
  {/if}

  {#if moreGrid.length > 0}
    <section class="container-xl pt-4 pb-5">
      <SectionHead title="Artikel Lainnya" headingId="home-more-heading" />
      <div class="row g-4">
        {#each moreGrid as article (article.id)}
          <div class="col-6 col-md-4 col-lg-3">
            <ArticleCard {article} variant={cardStyle} />
          </div>
        {/each}
      </div>
      <div class="text-center mt-4">
        <a href="/index-article" class="theme-btn theme-btn--see-all theme-btn--solid">Lihat Semua Artikel <i class="bi bi-arrow-right"></i></a>
      </div>
    </section>
  {/if}
</div>

<style>
  /* Curhatan: the same house dark panel as the sidebar contact card. */
  .curhat-band {
    display: grid;
    grid-template-columns: minmax(260px, 4fr) minmax(0, 8fr);
    gap: 1.75rem;
    align-items: center;
    padding: 1.75rem;
    border-radius: 24px;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 65%, transparent), transparent 45%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a), #101827 55%, #1f2937);
  }
  .curhat-band__intro h2 { margin: 0; color: #fff; font-size: clamp(1.5rem, 2.6vw, 2rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; }
  .curhat-band__intro p { max-width: 42ch; margin: 0.6rem 0 0; color: rgba(255, 255, 255, 0.78); font-size: 0.9375rem; line-height: 1.55; }
  .curhat-band__chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 1rem 0 0; padding: 0; list-style: none; }
  .curhat-band__chips li { display: inline-flex; align-items: center; gap: 0.35rem; min-height: 30px; padding: 0 0.7rem; border-radius: 999px; background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.88); font-size: 0.75rem; font-weight: 700; }
  .curhat-band__chips i { color: var(--site-primary, #f1ff32); }
  .curhat-band__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 1.25rem; }
  .curhat-band__wall { min-width: 0; }
  .curhat-band a:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  @media (max-width: 991px) {
    .curhat-band { grid-template-columns: minmax(0, 1fr); padding: 1.5rem 1.25rem; border-radius: 20px; }
  }

  /* Stacked on phones. From md the anime row lines its blocks up on a shared
     subgrid: each block hands its heading and its card to the row, so every
     card starts at the same y even when one heading wraps. */
  .home-anime-row {
    display: grid;
    gap: 1.5rem;
  }

  .home-anime-row__promo :global(.taste-promo) {
    height: 100%;
  }

  @media (min-width: 768px) {
    .home-anime-row--cols-2,
    .home-anime-row--cols-3 {
      /* minmax(0, …): without the zero minimum a long anime title widens its
         own column and breaks the row. */
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: auto 1fr;
      gap: 0 1.5rem;
    }

    .home-anime-row--cols-2 > :global(*),
    .home-anime-row--cols-3 > :global(*) {
      display: grid;
      grid-row: span 2;
      grid-template-rows: subgrid;
    }

    /* One card height across the row: each carousel fills its cell and its
       active slide fills the carousel, dots staying underneath. */
    .home-anime-row :global(.airing) {
      margin-bottom: 0;
    }

    .home-anime-row :global(.carousel) {
      display: flex;
      flex-direction: column;
    }

    .home-anime-row :global(.carousel__viewport) {
      flex: 1;
    }

    .home-anime-row :global(.carousel__slide > *) {
      height: 100%;
    }

    /* The carousels' dots sit under their cards; leaving the same strip under
       the quiz card lines all three bottoms up. */
    .home-anime-row__promo :global(.taste-promo) {
      height: auto;
      margin-bottom: 1.25rem;
    }
  }

  /* Tablet: two columns, the quiz closes the row at full width. */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .home-anime-row--cols-3 > .home-anime-row__promo {
      grid-column: 1 / -1;
      grid-row: auto;
      display: block;
      margin-top: 1.5rem;
    }

    .home-anime-row--cols-3 > .home-anime-row__promo :global(.taste-promo) {
      margin-bottom: 0;
    }
  }

  /* Desktop: all three side by side, one height. */
  @media (min-width: 992px) {
    .home-anime-row--cols-3 {
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 0.8fr);
    }
  }
</style>
