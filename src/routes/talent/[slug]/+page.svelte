<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildPageTitle, buildBreadcrumb } from '$lib/seo';
  import { PUBLIC_API_URL } from '$env/static/public';
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

          {#if talent.bioShort}
            <p class="creator-profile-description talent-bio mt-4 mb-0">{talent.bioShort}</p>
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
            <span class="creator-profile-highlight__label badge badge-main">Talent Snapshot</span>
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
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Latest Work</p>
              <h2 class="creator-profile-section__title mb-4">Talent's Latest Work</h2>

              <div class="reels-grid">
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

              <div class="works-grid">
                {#each talent.works as work (work.slug)}
                  <article class="work-card">
                    {#if work.thumbnail}
                      <img class="work-card__thumb" src={work.thumbnail} alt={work.title} loading="lazy" />
                    {/if}
                    <div class="work-card__body">
                      <h3 class="work-card__title">
                        {#if work.url}
                          <a href={work.url} target="_blank" rel="noopener">{work.title}</a>
                        {:else}
                          {work.title}
                        {/if}
                      </h3>
                      <p class="work-card__meta">
                        {[work.client, work.type, formatDate(work.publishedAt)].filter(Boolean).join(' · ')}
                      </p>
                      {#if work.description}<p class="work-card__desc">{work.description}</p>{/if}
                    </div>
                  </article>
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

              <div class="gallery-grid">
                {#each talent.gallery as img (img.slug)}
                  <figure class="mb-0">
                    <img src={img.url} alt={img.caption} loading="lazy" decoding="async" />
                    <figcaption class="small text-muted mt-1">{img.caption}</figcaption>
                  </figure>
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
                      <span class="small text-muted">{a.description ?? a.year}</span>
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

  .reels-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .works-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .work-card {
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .work-card__thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .work-card__body {
    padding: 0.75rem;
  }

  .work-card__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .work-card__title :global(a) {
    color: inherit;
    text-decoration: none;
  }

  .work-card__title :global(a:hover) {
    color: var(--site-accent, #55ad9b);
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

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }

  .gallery-grid img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: 0.6rem;
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

  @media (max-width: 991.98px) {
    .reels-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 575.98px) {
    .reels-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
