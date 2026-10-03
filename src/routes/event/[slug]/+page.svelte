<script lang="ts">
  import type { PageData } from './$types';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';
  import { countdownLabel, formatDateRange, STATUS_LABELS } from '$lib/event';
  import ShareSheet from '$components/common/ShareSheet.svelte';
  import ArticleCard from '$components/common/ArticleCard.svelte';
  import { imgFallback } from '$lib/format';

  export let data: PageData;

  $: event = data.event;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl(`/event/${event.slug}`);
  $: pageTitle = buildPageTitle(event.name, siteName);
  $: place = [event.location, event.city].filter(Boolean).join(', ');
  $: dateRange = formatDateRange(event.startDate, event.endDate);
  $: countdown = countdownLabel(event.daysUntil, event.status);
  $: showTicket = event.status === 'upcoming' || event.status === 'ongoing';
  $: description =
    event.description?.trim().replace(/\s+/g, ' ').slice(0, 157) ??
    `${event.name} — ${dateRange}${place ? ` di ${place}` : ''}.`;

  // The rendered card rather than the raw poster, so a pasted link previews as
  // a designed asset. The API URL is what scrapers fetch; the download link
  // goes through the same-origin proxy so `download` is honoured.
  $: shareImageUrl = `${PUBLIC_API_URL}/api/events/${event.slug}/share.png`;
  $: cardDownloadUrl = `/event/${event.slug}/card.png`;

  $: jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    url: canonical,
    startDate: event.startTime ? `${event.startDate}T${event.startTime}:00+07:00` : event.startDate,
    endDate: event.endDateEffective,
    eventStatus:
      event.status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : event.status === 'postponed'
          ? 'https://schema.org/EventPostponed'
          : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: shareImageUrl,
    ...(event.description ? { description: event.description } : {}),
    ...(place
      ? {
          location: {
            '@type': 'Place',
            name: event.location ?? place,
            ...(event.city ? { address: { '@type': 'PostalAddress', addressLocality: event.city } } : {}),
          },
        }
      : {}),
    // Only while the offer is real: an InStock offer on a finished or cancelled
    // event is structured data that contradicts the page.
    ...(event.ticketUrl && showTicket
      ? { offers: { '@type': 'Offer', url: event.ticketUrl, availability: 'https://schema.org/InStock' } }
      : {}),
  };

</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={shareImageUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={shareImageUrl} />
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(
    buildBreadcrumb([
      { name: 'Jadwal Event', path: '/event' },
      { name: event.name, path: `/event/${event.slug}` },
    ])
  )}<\/script>`}
</svelte:head>

<section class="section-md container-xl">
  <!-- The dark gradient hero this app opens its pages with (see /contact and
       /event), so the poster and the facts read as one designed block instead
       of floating on bare white. -->
  <div class="event-hero mb-4">
    <div class="row g-4 g-lg-5 align-items-center">
      <div class="col-12 col-sm-5 col-lg-4">
        <div class="event-poster">
          {#if event.poster}
            <img src={event.poster} alt={event.name} on:error={imgFallback} />
          {:else}
            <div class="event-poster__placeholder" aria-hidden="true">
              <i class="bi bi-calendar-event"></i>
            </div>
          {/if}
        </div>
      </div>

      <div class="col-12 col-sm-7 col-lg-8">
        <nav aria-label="breadcrumb" class="mb-3">
          <ol class="breadcrumb small mb-0 article-hero-breadcrumb">
            <li class="breadcrumb-item">
              <a href="/" class="text-white-50 text-decoration-none">Home</a>
            </li>
            <li class="breadcrumb-item">
              <a href="/event" class="text-white-50 text-decoration-none">Jadwal Event</a>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              <span class="event-crumb-current">{event.name}</span>
            </li>
          </ol>
        </nav>

        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span class="badge badge-main">{STATUS_LABELS[event.status]}</span>
          {#if countdown}<span class="event-countdown">{countdown}</span>{/if}
        </div>

        <h1 class="event-title">{event.name}</h1>

        <ul class="event-facts">
          <li><i class="bi bi-calendar3"></i> <span>{dateRange}</span></li>
          {#if event.startTime}
            <li><i class="bi bi-clock"></i> <span>Mulai {event.startTime} WIB</span></li>
          {/if}
          {#if place}
            <li><i class="bi bi-geo-alt"></i> <span>{place}</span></li>
          {/if}
        </ul>

        <div class="d-flex flex-wrap gap-2">
          <!-- No point selling a ticket to something already over or called off. -->
          {#if event.ticketUrl && showTicket}
            <a
              class="theme-btn theme-btn--primary"
              href={event.ticketUrl}
              target="_blank"
              rel="noopener nofollow"
            >
              <i class="bi bi-ticket-perforated me-2"></i>Beli Tiket
            </a>
          {/if}
          <ShareSheet url={canonical} title={event.name}>
            <a slot="extra" class="sheet__download" href={cardDownloadUrl}>
              <i class="bi bi-download"></i>
              <span>Unduh kartu event <small>1200 × 630</small></span>
            </a>
          </ShareSheet>
        </div>
      </div>
    </div>
  </div>

  {#if event.description}
    <div class="card border-0 event-panel mb-4">
      <div class="card-body p-4">
        <h2 class="event-panel__title h6 fw-bold mb-3">Tentang Event</h2>
        <div class="event-description">
          {#each event.description.split(/\n{2,}/) as paragraph}
            <p>{paragraph}</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if event.articles.length}
    <h2 class="event-articles-head">Liputan Terkait</h2>
    <!-- Same card as the homepage rows, via the shared component. -->
    <div class="article-scroll-grid">
      {#each event.articles as article (article.id)}
        <ArticleCard
          id={article.id}
          slug={article.slug}
          title={article.title}
          image={article.image}
          publishDate={article.publishDate}
          format={article.format}
          photoCount={article.photoCount ?? 0}
          categoryName={article.catName}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  /*
   * The capsule's filled chip marks the page you are on, not Home.
   *
   * The shared .article-hero-breadcrumb puts it on :first-child, which reads as
   * though Home were the current location. Overridden here rather than in
   * custom.scss so the article hero keeps the look it already ships with.
   * The chip sits on an inner span so the "/" separator stays outside the pill.
   */
  .article-hero-breadcrumb .breadcrumb-item:first-child a {
    padding: 0;
    border-radius: 0;
    background: none;
    color: rgb(255 255 255 / 72%) !important;
  }

  .article-hero-breadcrumb .breadcrumb-item:first-child a:hover {
    color: #fff !important;
  }

  .event-crumb-current {
    display: inline-block;
    max-width: min(52vw, 18rem);
    padding: 0.38rem 0.65rem;
    border-radius: 999px;
    background: rgb(255 255 255 / 14%);
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }

  .event-hero {
    border-radius: 28px;
    padding: 2rem;
    color: #fff;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--site-accent-glow, #f1ff32) 75%, transparent),
        transparent 22%
      ),
      linear-gradient(135deg, #0a0a0a 0%, #111827 48%, #1f2937 100%);
    box-shadow: 0 24px 80px rgb(10 10 10 / 15%);
  }

  .event-poster {
    border-radius: 16px;
    overflow: hidden;
    background: #14171c;
    aspect-ratio: 3 / 4;
    box-shadow: 0 12px 32px rgb(0 0 0 / 35%);
  }

  .event-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .event-poster__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 3rem;
    color: rgb(255 255 255 / 20%);
  }

  .event-title {
    font-size: clamp(1.6rem, 3vw, 2.6rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #fff;
    margin: 0 0 1.25rem;
  }

  .event-countdown {
    font-size: 0.85rem;
    font-weight: 700;
    color: rgb(255 255 255 / 66%);
  }

  .event-facts {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    display: grid;
    gap: 0.5rem;
  }

  .event-facts li {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: 0.95rem;
    color: rgb(255 255 255 / 86%);
  }

  .event-facts i {
    color: var(--site-primary, #f1ff32);
    flex: none;
  }

  .event-panel {
    border-radius: 16px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  }

  .event-panel__title {
    padding-left: 0.65rem;
    border-left: 4px solid var(--site-primary, #f1ff32);
  }

  .event-description p {
    margin-bottom: 1rem;
    line-height: 1.75;
    white-space: pre-line;
  }

  .event-description p:last-child {
    margin-bottom: 0;
  }

  .sheet__download {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--bs-border-color, #dee2e6);
    margin-bottom: 0.5rem;
  }

  .sheet__download:hover {
    background: var(--bs-tertiary-bg, #f8f9fa);
  }

  .sheet__download small {
    display: block;
    color: var(--bs-secondary-color, #6c757d);
  }

  .event-articles-head {
    margin: 0 0 1.25rem;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    padding-left: 0.75rem;
    border-left: 4px solid var(--site-primary, #f1ff32);
  }

  @media (max-width: 767.98px) {
    .event-hero {
      border-radius: 20px;
      padding: 1.5rem;
    }

    /* Full-bleed poster on a phone: at 5/12 of a 390px screen it was a stamp. */
    .event-poster {
      max-width: 260px;
      margin-inline: auto;
    }
  }
</style>
