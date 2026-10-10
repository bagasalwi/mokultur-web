<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';
  import { countdownLabel, directionsUrl, formatDateRange, instagramUrl, STATUS_LABELS, timeRange } from '$lib/event';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { imgFallback } from '$lib/format';
  import ShareSheet from '$components/common/ShareSheet.svelte';
  import ArticleCard from '$components/common/ArticleCard.svelte';
  import AddToCalendar from '$components/event/AddToCalendar.svelte';
  import EventAgendaRow from '$components/event/EventAgendaRow.svelte';

  export let data: PageData;

  $: event = data.event;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl(`/event/${event.slug}`);
  $: pageTitle = buildPageTitle(event.name, siteName);
  $: place = [event.location, event.city].filter(Boolean).join(', ');
  $: dateRange = formatDateRange(event.startDate, event.endDate);
  $: time = timeRange(event.startTime, event.endTime);
  $: countdown = countdownLabel(event.daysUntil, event.status);
  $: live = event.status === 'upcoming' || event.status === 'ongoing';
  $: showTicket = live && !!event.ticketUrl;
  $: directions = directionsUrl(event);
  $: igUrl = instagramUrl(event.organizerInstagram);
  $: paragraphs = (event.description ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  function clip(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
  }
  $: summary = (event.description ?? '').replace(/\s+/g, ' ').trim();
  $: description = summary
    ? clip(summary, 158)
    : `${event.name}: ${dateRange}${place ? ` di ${place}` : ''}. Info tiket dan lokasi di ${siteName}.`;

  // The rendered card rather than the raw poster, so a pasted link previews as
  // a designed asset. The download goes through the same-origin proxy.
  $: shareImageUrl = `${PUBLIC_API_URL}/api/events/${event.slug}/share.png`;
  $: cardDownloadUrl = `/event/${event.slug}/card.png`;

  /** "Rp75.000" → 75000, for offers.price; anything not a plain amount is left out. */
  $: priceAmount = (() => {
    const label = event.priceLabel?.toLowerCase() ?? '';
    if (/gratis|free/.test(label)) return 0;
    const digits = label.match(/rp\s*([\d.]+)/)?.[1]?.replace(/\./g, '');
    return digits ? Number(digits) : null;
  })();

  const at = (date: string, clock: string | null) => (clock ? `${date}T${clock}:00+07:00` : date);
  $: jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    url: canonical,
    startDate: at(event.startDate, event.startTime),
    endDate: at(event.endDateEffective, event.endTime),
    eventStatus:
      event.status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : event.status === 'postponed'
          ? 'https://schema.org/EventPostponed'
          : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: shareImageUrl,
    ...(summary ? { description: summary } : {}),
    ...(place
      ? {
          location: {
            '@type': 'Place',
            name: event.location ?? place,
            address: {
              '@type': 'PostalAddress',
              ...(event.address ? { streetAddress: event.address } : {}),
              ...(event.city ? { addressLocality: event.city } : {}),
              addressCountry: 'ID',
            },
          },
        }
      : {}),
    ...(event.organizer
      ? { organizer: { '@type': 'Organization', name: event.organizer, ...(igUrl ? { url: igUrl } : {}) } }
      : {}),
    // Only while the offer is real: an InStock offer on a finished or cancelled
    // event contradicts the page.
    ...(showTicket
      ? {
          offers: {
            '@type': 'Offer',
            url: event.ticketUrl,
            availability: 'https://schema.org/InStock',
            ...(priceAmount !== null ? { price: priceAmount, priceCurrency: 'IDR' } : {}),
          },
        }
      : {}),
  };

  /*
   * Phones get a ticket bar once the hero's own buttons scroll away. It reuses
   * the dashboard's bottom-bar body class so the chat button lifts clear.
   */
  let actions: HTMLElement;
  let barVisible = false;
  let observer: IntersectionObserver | null = null;
  onMount(() => {
    if (!showTicket || !actions) return;
    observer = new IntersectionObserver(([entry]) => {
      barVisible = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    });
    observer.observe(actions);
  });
  $: if (typeof document !== 'undefined') document.body.classList.toggle('has-bottom-nav', barVisible);
  onDestroy(() => {
    observer?.disconnect();
    if (typeof document !== 'undefined') document.body.classList.remove('has-bottom-nav');
  });
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

<div class="ev container-xl">
  <nav class="ev-crumbs" aria-label="Breadcrumb">
    <a href="/event">Jadwal Event</a><i class="bi bi-chevron-right" aria-hidden="true"></i><span aria-current="page">{event.name}</span>
  </nav>

  <header class="ev-hero">
    <div class="ev-hero__poster">
      {#if event.poster}
        <img src={imgUrl(event.poster, 1080) ?? event.poster} srcset={imgSrcset(event.poster, 420)} sizes="(max-width: 767px) 100vw, 420px" alt="Poster {event.name}" fetchpriority="high" on:error={imgFallback} />
      {:else}
        <i class="bi bi-calendar-event" aria-hidden="true"></i>
      {/if}
    </div>

    <div class="ev-hero__body">
      <div class="ev-hero__tags">
        <span class="ev-tag ev-tag--{event.status}">{STATUS_LABELS[event.status]}</span>
        {#if countdown && event.status === 'upcoming'}<span class="ev-tag ev-tag--count">{countdown}</span>{/if}
      </div>
      <h1 class="ev-hero__title">{event.name}</h1>

      <dl class="ev-facts">
        <div>
          <dt><i class="bi bi-calendar3" aria-hidden="true"></i> Tanggal</dt>
          <dd>{dateRange}</dd>
        </div>
        {#if time}
          <div>
            <dt><i class="bi bi-clock" aria-hidden="true"></i> Waktu</dt>
            <dd>{time}</dd>
          </div>
        {/if}
        {#if place}
          <div>
            <dt><i class="bi bi-geo-alt" aria-hidden="true"></i> Lokasi</dt>
            <dd>
              {place}
              {#if event.address}<span class="ev-facts__sub">{event.address}</span>{/if}
            </dd>
          </div>
        {/if}
        {#if event.priceLabel}
          <div>
            <dt><i class="bi bi-ticket-perforated" aria-hidden="true"></i> Harga</dt>
            <dd>{event.priceLabel}</dd>
          </div>
        {/if}
        {#if event.organizer}
          <div>
            <dt><i class="bi bi-people" aria-hidden="true"></i> Penyelenggara</dt>
            <dd>
              {event.organizer}
              {#if igUrl}<a class="ev-facts__ig" href={igUrl} target="_blank" rel="noopener"><i class="bi bi-instagram" aria-hidden="true"></i> @{event.organizerInstagram}</a>{/if}
            </dd>
          </div>
        {/if}
      </dl>

      <div class="ev-actions" bind:this={actions}>
        {#if showTicket}
          <a class="theme-btn theme-btn--primary" href={event.ticketUrl} target="_blank" rel="noopener nofollow">
            <i class="bi bi-ticket-perforated" aria-hidden="true"></i> Beli Tiket
          </a>
        {/if}
        {#if live}<AddToCalendar {event} />{/if}
        {#if directions}
          <a class="theme-btn theme-btn--see-all theme-btn--sm" href={directions} target="_blank" rel="noopener">
            <i class="bi bi-sign-turn-right" aria-hidden="true"></i> Petunjuk arah
          </a>
        {/if}
        <ShareSheet url={canonical} title={event.name} triggerClass="theme-btn theme-btn--see-all theme-btn--sm">
          <a slot="extra" class="sheet__download" href={cardDownloadUrl}>
            <i class="bi bi-download"></i>
            <span>Unduh kartu event <small>1200 × 630</small></span>
          </a>
        </ShareSheet>
      </div>
      {#if !live}
        <p class="ev-note">
          {event.status === 'done' ? 'Event ini sudah selesai.' : event.status === 'postponed' ? 'Event ini ditunda. Tanggal baru akan diumumkan penyelenggara.' : 'Event ini dibatalkan.'}
          <a href="/event">Lihat jadwal event lain</a>
        </p>
      {/if}
    </div>
  </header>

  <div class="ev-grid">
    <div class="ev-main">
      {#if paragraphs.length}
        <section class="ev-section" aria-labelledby="ev-about">
          <h2 id="ev-about">Tentang event</h2>
          <div class="ev-about">
            {#each paragraphs as paragraph}<p>{paragraph}</p>{/each}
          </div>
        </section>
      {/if}

      {#if event.articles.length}
        <section class="ev-section" aria-labelledby="ev-coverage">
          <h2 id="ev-coverage">Liputan terkait</h2>
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
        </section>
      {/if}
    </div>

    <aside class="ev-aside">
      {#if data.others.length}
        <section aria-labelledby="ev-others">
          <h2 id="ev-others">Event lain yang akan datang</h2>
          {#each data.others as other (other.slug)}
            <EventAgendaRow event={other} />
          {/each}
          <a class="ev-aside__more" href="/event">Semua jadwal <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
        </section>
      {/if}
      <section class="ev-pitch">
        <h2>Punya event?</h2>
        <p>Kirim detailnya ke kami untuk masuk jadwal dan dibicarakan liputannya.</p>
        <a class="theme-btn theme-btn--primary theme-btn--sm" href="/contact?type=event">Daftarkan event</a>
      </section>
    </aside>
  </div>
</div>

{#if showTicket}
  <div class="ev-bar" class:is-visible={barVisible} aria-hidden={!barVisible} inert={!barVisible}>
    <div class="ev-bar__text">
      <strong>{event.name}</strong>
      <span>{dateRange}{event.priceLabel ? ` · ${event.priceLabel}` : ''}</span>
    </div>
    <a class="theme-btn theme-btn--primary theme-btn--sm" href={event.ticketUrl} target="_blank" rel="noopener nofollow">Beli Tiket</a>
  </div>
{/if}

<style>
  .ev { padding-top: 1.5rem; padding-bottom: 4rem; }

  .ev-crumbs { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1.25rem; font-size: 0.8125rem; color: #6b7280; min-width: 0; }
  .ev-crumbs a { color: #4b5563; text-decoration: none; flex-shrink: 0; }
  .ev-crumbs a:hover { color: #1a1a1a; text-decoration: underline; }
  .ev-crumbs i { font-size: 0.65rem; }
  .ev-crumbs span { color: #1a1a1a; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .ev-hero { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: 2.5rem; align-items: start; }
  .ev-hero__poster {
    display: grid;
    place-items: center;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    border-radius: 20px;
    background: #f0f0f0;
    color: #9ca3af;
    font-size: 2.5rem;
    box-shadow: 0 16px 40px rgba(10, 10, 10, 0.12);
  }
  .ev-hero__poster img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }

  .ev-hero__body { min-width: 0; padding-top: 0.25rem; }
  .ev-hero__tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
  .ev-tag { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.02em; background: #f3f4f6; color: #1a1a1a; }
  .ev-tag--upcoming { background: var(--site-dark, #111); color: #fff; }
  .ev-tag--ongoing { background: #16a34a; color: #fff; }
  .ev-tag--cancelled,
  .ev-tag--postponed { background: #fee2e2; color: #991b1b; }
  .ev-tag--count { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .ev-hero__title { margin: 0; font-size: clamp(1.875rem, 4vw, 3rem); font-weight: 900; letter-spacing: -0.035em; line-height: 1.05; text-wrap: balance; }

  .ev-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 1.5rem; margin: 1.75rem 0; padding: 1.25rem 0; border-top: 1px solid #ececec; border-bottom: 1px solid #ececec; }
  .ev-facts div { min-width: 0; }
  .ev-facts dt { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem; font-size: 0.75rem; font-weight: 700; color: #6b7280; }
  .ev-facts dt i { color: #9ca3af; }
  .ev-facts dd { margin: 0; font-size: 0.9375rem; font-weight: 700; color: #1a1a1a; line-height: 1.4; overflow-wrap: anywhere; }
  .ev-facts__sub { display: block; margin-top: 0.15rem; font-weight: 400; font-size: 0.8125rem; color: #6b7280; }
  .ev-facts__ig { display: inline-flex; align-items: center; gap: 0.3rem; margin-left: 0.4rem; font-weight: 600; font-size: 0.8125rem; color: #4b5563; }

  .ev-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
  .ev-actions > .theme-btn--primary { box-shadow: none; }
  .ev-note { margin: 1rem 0 0; padding: 0.75rem 1rem; border-radius: 12px; background: #f6f7f9; font-size: 0.875rem; color: #4b5563; }
  .ev-note a { margin-left: 0.25rem; color: #1a1a1a; font-weight: 700; }

  .ev-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 360px); gap: 3rem; align-items: start; margin-top: 3rem; }
  .ev-section + .ev-section { margin-top: 2.5rem; }
  .ev-section h2,
  .ev-aside h2 { margin: 0 0 1rem; font-size: 1.375rem; font-weight: 800; letter-spacing: -0.02em; }
  .ev-about { max-width: 68ch; }
  .ev-about p { margin: 0 0 1rem; font-size: 1.0625rem; line-height: 1.75; color: #1f2937; }

  .ev-aside { position: sticky; top: 80px; display: grid; gap: 1.5rem; }
  .ev-aside h2 { font-size: 1.0625rem; margin-bottom: 0.25rem; }
  .ev-aside__more { display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 0.75rem; font-size: 0.8125rem; font-weight: 700; color: #1a1a1a; text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .ev-aside :global(.row-ev) { grid-template-columns: 56px minmax(0, 1fr); gap: 0.85rem; }
  .ev-aside :global(.row-ev__poster),
  .ev-aside :global(.row-ev__actions) { display: none; }
  .ev-aside :global(.row-ev__name) { font-size: 0.9375rem; }

  .ev-pitch {
    padding: 1.25rem;
    border-radius: 18px;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 65%, transparent), transparent 45%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a), #101827 55%, #1f2937);
  }
  .ev-pitch h2 { margin: 0; color: #fff; }
  .ev-pitch p { margin: 0.35rem 0 0.9rem; font-size: 0.8125rem; color: rgba(255, 255, 255, 0.75); }
  .ev-pitch .theme-btn { box-shadow: none; }

  .ev a:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .ev-pitch :is(a):focus-visible { outline-color: #fff; }

  .ev-bar {
    position: fixed;
    z-index: 1025;
    left: 0;
    right: 0;
    bottom: 0;
    display: none;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem calc(0.65rem + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -8px 24px rgba(10, 10, 10, 0.08);
    transform: translateY(100%);
    transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .ev-bar.is-visible { transform: none; }
  .ev-bar__text { display: grid; min-width: 0; flex: 1; }
  .ev-bar__text strong { font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ev-bar__text span { font-size: 0.75rem; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ev-bar .theme-btn { box-shadow: none; flex-shrink: 0; }

  @media (max-width: 991px) {
    .ev-grid { grid-template-columns: minmax(0, 1fr); gap: 2.5rem; }
    .ev-aside { position: static; }
  }
  @media (max-width: 767px) {
    .ev-hero { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
    .ev-hero__poster { max-width: 360px; width: 100%; margin: 0 auto; }
    .ev-facts { grid-template-columns: minmax(0, 1fr); }
    .ev-bar { display: flex; }
  }
  @media (prefers-reduced-motion: reduce) { .ev-bar { transition: none; } }
</style>
