<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { absoluteUrl, buildPageTitle, buildBreadcrumb } from '$lib/seo';
  import { PUBLIC_API_URL } from '$env/static/public';
  import type { TalentWork } from '$lib/api';
  import { collabLink, formatCount } from '$lib/talent';
  import ShareButtons from '$components/common/ShareButtons.svelte';
  import TalentBadges from '$components/talent/TalentBadges.svelte';
  import TalentReelCard from '$components/talent/TalentReelCard.svelte';

  export let data: PageData;

  $: talent = data.talent;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl(`/talent/${talent.slug}`);
  $: pageTitle = buildPageTitle(talent.alias, siteName);
  $: description = talent.tagline ?? talent.bioShort ?? `Profil ${talent.alias} di ${siteName}.`;
  $: collabUrl = collabLink(talent.contact?.url ?? null, talent.alias);
  // A short bio that just repeats the alias carries no information — it reads
  // as a stray fragment sitting between the name and the CTA row rather than a
  // bio. Anything else the talent actually wrote still renders.
  $: bioShort =
    talent.bioShort && talent.bioShort.trim().toLowerCase() !== talent.alias.trim().toLowerCase()
      ? talent.bioShort
      : null;
  $: shareImageUrl = `${PUBLIC_API_URL}/api/talents/${encodeURIComponent(talent.slug)}/share.png`;
  // Downloaded from this origin so the `download` attribute is honoured; the
  // API URL is still what social scrapers get for og:image.
  $: cardDownloadUrl = `/talent/${encodeURIComponent(talent.slug)}/card.png`;

  // The hero image is a portrait, so it doubles as the blurred backdrop. The
  // avatar is the fallback: blurred hard enough, a square still reads as
  // atmosphere rather than a stretched photo.
  $: backdrop = talent.heroImage ?? talent.avatar;
  function formatPrice(price: number | null, currency: string): string {
    if (price === null) return 'Hubungi kami';

    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      // Guards against a non-ISO currency typed into the dashboard.
      return `${currency} ${price.toLocaleString('id-ID')}`;
    }
  }

  function formatDate(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Reels rail ────────────────────────────────────────────────────────────
  let reelsRail: HTMLDivElement | undefined;
  let reelsOverflowing = false;

  function measureReels() {
    // Buttons only earn their place when there is something to scroll to.
    reelsOverflowing = !!reelsRail && reelsRail.scrollWidth > reelsRail.clientWidth + 4;
  }

  function slideReels(direction: 1 | -1) {
    if (!reelsRail) return;
    // Roughly one viewport of cards, so a click never leaves a card half-shown.
    const step = Math.max(reelsRail.clientWidth * 0.8, 220);
    reelsRail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  onMount(() => {
    measureReels();
    const observer = new ResizeObserver(measureReels);
    if (reelsRail) observer.observe(reelsRail);
    return () => observer.disconnect();
  });

  // ── Gallery lightbox ──────────────────────────────────────────────────────
  let lightboxIndex: number | null = null;
  $: lightboxImage = lightboxIndex === null ? null : talent.gallery[lightboxIndex] ?? null;

  // Same scroll lock the article lightbox uses. Guarded on `document` so SSR,
  // which renders this module too, does not touch a browser global.
  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = lightboxImage ? 'hidden' : '';
  }

  onMount(() => () => {
    // A client-side navigation away while the lightbox is open would otherwise
    // leave the page unscrollable.
    document.body.style.overflow = '';
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content={canonical} />
  <!-- The rendered share card rather than the raw photo: it carries the name,
       badges and stats, so a pasted link previews as a designed asset. -->
  <meta property="og:image" content={shareImageUrl} />
  <meta property="og:image:width" content="1080" />
  <meta property="og:image:height" content="1350" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={shareImageUrl} />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: talent.alias,
    url: canonical,
    image: talent.avatar,
    ...(talent.bioShort ? { description: talent.bioShort } : {}),
    ...(talent.socialLinks.length ? { sameAs: talent.socialLinks.map((s) => s.url) } : {}),
  })}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(
    buildBreadcrumb([
      { name: 'Talent', path: '/talent' },
      { name: talent.alias, path: `/talent/${talent.slug}` },
    ])
  )}<\/script>`}
</svelte:head>

<svelte:window
  on:keydown={(event) => {
    // Captured once: TypeScript cannot narrow a mutable outer binding inside a
    // closure, and the arithmetic below needs it to be a number.
    const current = lightboxIndex;
    if (current === null) return;
    if (event.key === 'Escape') lightboxIndex = null;
    if (event.key === 'ArrowRight') lightboxIndex = (current + 1) % talent.gallery.length;
    if (event.key === 'ArrowLeft') lightboxIndex = (current - 1 + talent.gallery.length) % talent.gallery.length;
  }}
/>

<section
  class="section-top container-xl creator-profile-page talent-profile"
  style={`--talent-color: ${talent.themeColor}`}
>
  <div class="creator-profile-hero card border-0 overflow-hidden mb-4">
    {#if backdrop}
      <!-- Decorative: the same portrait appears sharp in the avatar beside it. -->
      <img class="talent-backdrop" src={backdrop} alt="" aria-hidden="true" />
      <div class="talent-backdrop__veil"></div>
    {/if}
    <div class="creator-profile-hero__glow"></div>

    <div class="card-body p-4 p-lg-5 position-relative">
      <div class="row g-4 align-items-center">
        <div class="col-12 col-lg-8">
          <div class="d-flex flex-column flex-sm-row align-items-sm-center gap-4">
            <div class="creator-profile-avatar">
              <img src={talent.avatar} alt={talent.alias} />
            </div>

            <div class="creator-profile-copy">
              <div class="mb-2"><TalentBadges badges={talent.badges} surface="dark" /></div>
              <h1 class="creator-profile-title mb-1">{talent.alias}</h1>
              {#if talent.instagram}
                <p class="creator-profile-handle mb-2">@{talent.instagram.username}</p>
              {/if}
              {#if talent.tagline}
                <p class="creator-profile-description mb-0">{talent.tagline}</p>
              {/if}
            </div>
          </div>

          {#if bioShort}
            <p class="creator-profile-description talent-bio mt-4 mb-0">{bioShort}</p>
          {/if}

          <div class="d-flex flex-wrap align-items-center gap-2 mt-4">
            {#if collabUrl}
              <a class="theme-btn theme-btn--primary theme-btn--sm" href={collabUrl} target="_blank" rel="noopener">
                <i class="bi bi-whatsapp"></i>
                {talent.contact?.label ?? `Ajak ${talent.alias} Kolaborasi`}
              </a>
            {/if}
            <a
              class="theme-btn theme-btn--ghost theme-btn--sm"
              href={cardDownloadUrl}
              download={`mokultur-talent-${talent.slug}.png`}
            >
              <i class="bi bi-download"></i> Unduh Kartu
            </a>
            <ShareButtons url={canonical} title={`${talent.alias} — ${siteName}`} compact />
          </div>
        </div>

        <div class="col-12 col-lg-4">
          <div class="creator-profile-highlight">
            <span class="creator-profile-highlight__label badge badge-main">Featured</span>
            <div class="creator-profile-highlight__value">
              {formatCount(talent.instagram?.followers ?? 0)}
            </div>
            <p class="creator-profile-highlight__meta mb-0">Followers di Instagram.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-4 align-items-start">
    <div class="col-12 col-lg-8">
      <div class="d-grid gap-4">
        {#if talent.collabReels.length}
          <section class="creator-profile-section card border-0">
            <div class="card-body p-4">
              <!-- Renamed from "Latest Work" / "Talent's Latest Work": that read
                   as a near-duplicate of the Portfolio section's "Latest Works"
                   directly below it, for what is actually the Instagram reels.
                   "Kolaborasi" echoes the "3 Kolaborasi" badge already in the
                   hero, so the vocabulary agrees across the page. -->
              <div class="d-flex align-items-start justify-content-between gap-3 mb-4">
                <div>
                  <p class="creator-profile-section__eyebrow badge badge-main mb-1">Kolaborasi</p>
                  <h2 class="creator-profile-section__title mb-0">Latest Reels</h2>
                </div>
                <!-- A mouse cannot swipe, so desktop gets buttons. Hidden when the
                     row fits and on touch, where the swipe is the better gesture. -->
                <div class="reels-nav" class:reels-nav--shown={reelsOverflowing}>
                  <button type="button" class="reels-nav__btn" on:click={() => slideReels(-1)} aria-label="Geser ke kiri">
                    <i class="bi bi-chevron-left" aria-hidden="true"></i>
                  </button>
                  <button type="button" class="reels-nav__btn" on:click={() => slideReels(1)} aria-label="Geser ke kanan">
                    <i class="bi bi-chevron-right" aria-hidden="true"></i>
                  </button>
                </div>
              </div>

              <div class="reels-rail" bind:this={reelsRail}>
                {#each talent.collabReels as reel (reel.url)}
                  <TalentReelCard {reel} />
                {/each}
              </div>
            </div>
          </section>
        {/if}

        {#if talent.works.length}
          <section class="creator-profile-section card border-0">
            <div class="card-body p-4">
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Portfolio</p>
              <h2 class="creator-profile-section__title mb-4">Latest Works</h2>

              <!-- The whole tile is the link, not just the title text: a thumbnail
                   and description that look clickable but aren't is the more
                   common failure than the reverse. `{#snippet}` keeps the linked
                   and unlinked markup identical rather than maintained twice. -->
              {#snippet workCardBody(work: TalentWork)}
                {#if work.thumbnail}
                  <img class="work-card__thumb" src={work.thumbnail} alt={work.title} loading="lazy" />
                {/if}
                <div class="work-card__body">
                  <h3 class="work-card__title">{work.title}</h3>
                  <p class="work-card__meta">
                    {[work.client, work.type, formatDate(work.publishedAt)].filter(Boolean).join(' · ')}
                  </p>
                  {#if work.description}<p class="work-card__desc">{work.description}</p>{/if}
                </div>
                {#if work.url}
                  <span class="work-card__out" aria-hidden="true"><i class="bi bi-box-arrow-up-right"></i></span>
                {/if}
              {/snippet}

              <div class="works-grid">
                {#each talent.works as work (work.slug)}
                  {#if work.url}
                    <a class="work-card" href={work.url} target="_blank" rel="noopener">
                      {@render workCardBody(work)}
                    </a>
                  {:else}
                    <article class="work-card">
                      {@render workCardBody(work)}
                    </article>
                  {/if}
                {/each}
              </div>
            </div>
          </section>
        {/if}

        {#if talent.gallery.length}
          <section class="creator-profile-section card border-0">
            <div class="card-body p-4">
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Galeri</p>
              <h2 class="creator-profile-section__title mb-4">Potret {talent.alias}</h2>

              <!-- Editorial rather than a uniform contact sheet: the first frame
                   takes a 2×2 tile and the rest fill around it, so four photos
                   read as a composition instead of a row of thumbnails. -->
              <div class="gallery-grid">
                {#each talent.gallery as img, i (img.slug)}
                  <button
                    type="button"
                    class="gallery-tile"
                    class:gallery-tile--lead={i === 0}
                    on:click={() => (lightboxIndex = i)}
                  >
                    <img src={img.url} alt={img.caption} loading="lazy" decoding="async" />
                    <span class="gallery-tile__veil"></span>
                    <span class="gallery-tile__caption">
                      {img.caption}
                      {#if img.year}<span class="gallery-tile__year">{img.year}</span>{/if}
                    </span>
                    <span class="gallery-tile__zoom" aria-hidden="true"><i class="bi bi-arrows-angle-expand"></i></span>
                  </button>
                {/each}
              </div>
            </div>
          </section>
        {/if}
      </div>
    </div>

    <div class="col-12 col-lg-4">
      <div class="creator-sidebar d-grid gap-3">
        {#if talent.achievements.length}
          <div class="creator-sidebar-card card border-0">
            <div class="card-body p-4">
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Achievement Board</p>
              <h2 class="creator-profile-section__title h5 mb-3">Pencapaian</h2>

              <div class="creator-achievements d-grid gap-2">
                {#each talent.achievements as a (a.slug)}
                  <div class="creator-achievement">
                    <div class="creator-achievement__icon"><i class="bi bi-trophy-fill"></i></div>
                    <div>
                      <strong class="d-block">{a.title}</strong>
                      <!-- `??` let an empty-string description slip past, and a
                           year of 0 (an unset value in the dashboard, not a real
                           achievement year) would have rendered as the literal
                           text "0". Both are falsy, so `||` catches them, and the
                           line is skipped entirely rather than left blank. -->
                      {#if a.description || a.year}
                        <span class="small text-muted">{a.description || a.year}</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        {#if talent.rates.length}
          <div class="creator-sidebar-card card border-0">
            <div class="card-body p-4">
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Rate Card</p>
              <h2 class="creator-profile-section__title h5 mb-3">Kerja Sama</h2>

              <ul class="rate-list">
                {#each talent.rates as rate (rate.label)}
                  <li class="rate-list__item">
                    <div class="d-flex justify-content-between gap-2">
                      <span class="fw-semibold">{rate.label}</span>
                      <strong class="text-nowrap">{formatPrice(rate.price, rate.currency)}</strong>
                    </div>
                    {#if rate.unit || rate.notes}
                      <div class="small text-muted">{[rate.unit, rate.notes].filter(Boolean).join(' · ')}</div>
                    {/if}
                  </li>
                {/each}
              </ul>

              {#if collabUrl}
                <a
                  class="theme-btn theme-btn--dark theme-btn--sm w-100 mt-3"
                  href={collabUrl}
                  target="_blank"
                  rel="noopener"
                >
                  <i class="bi bi-whatsapp"></i> Tanya Ketersediaan
                </a>
              {/if}
            </div>
          </div>
        {/if}

        {#if talent.socialLinks.length}
          <div class="creator-sidebar-card card border-0">
            <div class="card-body p-4">
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Social</p>
              <h2 class="creator-profile-section__title h5 mb-3">Ikuti {talent.alias}</h2>

              <div class="d-grid gap-2">
                {#each talent.socialLinks as link (link.url)}
                  <a href={link.url} target="_blank" rel="noopener" class="social-link social-link--{link.platform}">
                    <span class="social-link__icon"><i class="bi {link.icon}" aria-hidden="true"></i></span>
                    <span class="social-link__text">
                      <span class="social-link__platform">{link.platformLabel}</span>
                      <span class="social-link__handle">{link.label}</span>
                    </span>
                    <i class="bi bi-box-arrow-up-right social-link__out" aria-hidden="true"></i>
                  </a>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        {#if talent.schedule.length}
          <div class="creator-sidebar-card card border-0">
            <div class="card-body p-4">
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Jadwal</p>
              <h2 class="creator-profile-section__title h5 mb-3">Agenda Terdekat</h2>

              <ul class="rate-list">
                {#each talent.schedule as evt (evt.slug)}
                  <li class="rate-list__item">
                    <span class="fw-semibold d-block">{evt.eventName}</span>
                    <span class="small text-muted">
                      {[formatDate(evt.date), evt.status, evt.location].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<!--
  Reuses the global .fb-lightbox styling the article body already ships, so both
  lightboxes look identical. The article's own is driven by DOM data attributes
  and delegation from .bodyArticle; this page has reactive data instead, so it
  drives the same markup from state rather than reaching into that mechanism.
-->
{#if lightboxImage}
  <!-- Backdrop click is a convenience on top of Escape, which the window
       handler above already provides — so keyboard users are not relying on
       this element. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fb-lightbox active"
    role="dialog"
    aria-modal="true"
    aria-label={lightboxImage.caption}
    on:click={(event) => {
      if (event.target === event.currentTarget) lightboxIndex = null;
    }}
    tabindex="-1"
  >
    <button class="fb-lightbox-close" type="button" aria-label="Tutup" on:click={() => (lightboxIndex = null)}>&times;</button>

    <div class="fb-lightbox-img-wrap">
      {#if talent.gallery.length > 1}
        <button
          class="fb-lightbox-nav fb-lightbox-prev"
          type="button"
          aria-label="Sebelumnya"
          on:click={() => (lightboxIndex = ((lightboxIndex ?? 0) - 1 + talent.gallery.length) % talent.gallery.length)}
        >
          <i class="bi bi-chevron-left"></i>
        </button>
      {/if}

      <img src={lightboxImage.url} alt={lightboxImage.caption} />

      {#if talent.gallery.length > 1}
        <button
          class="fb-lightbox-nav fb-lightbox-next"
          type="button"
          aria-label="Berikutnya"
          on:click={() => (lightboxIndex = ((lightboxIndex ?? 0) + 1) % talent.gallery.length)}
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      {/if}
    </div>

    <div class="fb-lightbox-footer">
      <div class="fb-lightbox-caption">{lightboxImage.caption}</div>
      {#if talent.gallery.length > 1}
        <div class="fb-lightbox-counter">{(lightboxIndex ?? 0) + 1} / {talent.gallery.length}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Portrait behind the hero, veiled rather than blurred. */
  .talent-backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
  }

  .talent-backdrop__veil {
    position: absolute;
    inset: 0;
    /* Dense behind the copy on the left, thinning to the right so the colour of
       the portrait still comes through instead of being flattened to black. */
    background:
      linear-gradient(110deg, #0a0a0aeb, #0a0a0a1f 42%, #0a0a0a7a),
      linear-gradient(0deg, rgb(10 10 10 / 19%), #00000000 55%);
  }

  .talent-bio {
    color: rgba(255, 255, 255, 0.72);
  }

  /* The talent's own colour as the avatar ring, so the page feels like theirs
     without fighting the site palette. */
  .talent-profile :global(.creator-profile-avatar) {
    background: linear-gradient(180deg, var(--talent-color, #f1ff32) 0%, rgba(255, 255, 255, 0.65) 100%);
  }

  /*
   * A rail rather than a grid. Reels are a feed — a talent may have twelve —
   * and wrapping them into rows pushed the rest of the profile down. Same
   * horizontal-scroll idiom the site already uses in .article-scroll-grid and
   * the home ReelsSection: snap points, no visible scrollbar.
   */
  .reels-rail {
    display: flex;
    flex-wrap: nowrap;
    gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    /* Room for the card's hover lift, which would otherwise be clipped by the
       scroll container. */
    padding-bottom: 0.35rem;
  }

  .reels-rail::-webkit-scrollbar {
    display: none;
  }

  .reels-rail > :global(.reel) {
    flex: 0 0 auto;
    scroll-snap-align: start;
  }

  .reels-nav {
    display: none;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  /* Shown once the rail actually overflows, and only from lg up — the same
     breakpoint the page's own two-column split uses. Below it the row is
     swiped, which is the better gesture there and needs no chrome. */
  @media (min-width: 992px) {
    .reels-nav--shown {
      display: flex;
    }
  }

  .reels-nav__btn {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid var(--bs-border-color, #dee2e6);
    background: #fff;
    color: #0a0a0a;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .reels-nav__btn:hover {
    background: #f4f5f7;
    border-color: color-mix(in srgb, var(--site-accent, #55ad9b) 45%, transparent);
  }

  .reels-nav__btn:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--site-primary, #f1ff32) 46%, transparent);
    outline-offset: 3px;
  }

  .works-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .work-card {
    position: relative;
    display: block;
    max-width: 380px;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.75rem;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    background: #fff;
    transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 220ms ease, border-color 220ms ease;
  }

  /* Only anchors are actually clickable — a work with no url stays an
     <article> and never receives this affordance. */
  a.work-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
    border-color: color-mix(in srgb, var(--site-accent, #55ad9b) 45%, transparent);
  }

  a.work-card:hover .work-card__thumb {
    transform: scale(1.04);
  }

  a.work-card:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--site-primary, #f1ff32) 46%, transparent);
    outline-offset: 3px;
  }

  .work-card__thumb {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    transition: transform 250ms ease;
  }

  .work-card__body {
    padding: 0.75rem;
  }

  .work-card__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .work-card__meta {
    margin: 0.25rem 0 0;
    font-size: 0.78rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  .work-card__desc {
    margin: 0.4rem 0 0;
    font-size: 0.83rem;
  }

  /* Same fade-in-on-hover affordance as .social-link__out, so the two "this
     leaves the site" signals on this page read as one idiom. */
  .work-card__out {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(10, 10, 10, 0.65);
    color: #fff;
    font-size: 0.78rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  a.work-card:hover .work-card__out,
  a.work-card:focus-visible .work-card__out {
    opacity: 1;
  }

  /*
   * The first frame takes a 2x2 tile and the rest fill in around it, so a
   * handful of photos reads as a composition rather than a contact sheet.
   * `dense` lets later small tiles backfill any hole the lead leaves.
   */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-flow: dense;
    gap: 0.6rem;
  }

  @media (min-width: 576px) {
    .gallery-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .gallery-tile--lead {
      grid-column: span 2;
      grid-row: span 2;
    }
  }

  .gallery-tile {
    position: relative;
    display: block;
    padding: 0;
    border: 0;
    border-radius: 0.75rem;
    overflow: hidden;
    background: #e9ecef;
    cursor: zoom-in;
    aspect-ratio: 3 / 4;
  }

  .gallery-tile--lead {
    aspect-ratio: 1 / 1;
  }

  .gallery-tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .gallery-tile:hover img,
  .gallery-tile:focus-visible img {
    transform: scale(1.06);
  }

  /* The caption sits on the photo instead of under it; the veil is what keeps
     it legible over a bright frame. */
  .gallery-tile__veil {
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, rgba(10, 10, 10, 0.78) 0%, rgba(10, 10, 10, 0) 55%);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .gallery-tile__caption {
    position: absolute;
    left: 0.65rem;
    right: 0.65rem;
    bottom: 0.6rem;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.3;
    text-align: left;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  .gallery-tile__year {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.72);
  }

  .gallery-tile__zoom {
    position: absolute;
    top: 0.55rem;
    right: 0.55rem;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(10, 10, 10, 0.6);
    color: #fff;
    font-size: 0.75rem;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .gallery-tile:hover .gallery-tile__veil,
  .gallery-tile:focus-visible .gallery-tile__veil,
  .gallery-tile:hover .gallery-tile__caption,
  .gallery-tile:focus-visible .gallery-tile__caption,
  .gallery-tile:hover .gallery-tile__zoom,
  .gallery-tile:focus-visible .gallery-tile__zoom {
    opacity: 1;
    transform: none;
  }

  .gallery-tile:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--site-primary, #f1ff32) 46%, transparent);
    outline-offset: 3px;
  }

  /* Touch has no hover, so the caption would never appear otherwise. */
  @media (hover: none) {
    .gallery-tile__veil,
    .gallery-tile__caption {
      opacity: 1;
      transform: none;
    }
  }

  .rate-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rate-list__item + .rate-list__item {
    margin-top: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--bs-border-color, #dee2e6);
  }

  .social-link {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem;
    border-radius: 0.6rem;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.15s ease;
  }

  .social-link:hover {
    background: rgba(128, 128, 128, 0.1);
  }

  /* Each platform keeps its own brand colour so the row is recognisable before
     the text is read. */
  .social-link__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--social-color, #6c757d);
    color: #fff;
    font-size: 1rem;
  }

  .social-link--instagram {
    --social-color: #e1306c;
  }

  .social-link--youtube {
    --social-color: #ff0000;
  }

  .social-link--x {
    --social-color: #0f1419;
  }

  .social-link--facebook {
    --social-color: #1877f2;
  }

  .social-link--threads {
    --social-color: #000000;
  }

  .social-link__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;
  }

  .social-link__platform {
    font-size: 0.85rem;
    font-weight: 800;
  }

  .social-link__handle {
    font-size: 0.78rem;
    color: var(--bs-secondary-color, #6c757d);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .social-link__out {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--bs-secondary-color, #6c757d);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .social-link:hover .social-link__out {
    opacity: 1;
  }

</style>
