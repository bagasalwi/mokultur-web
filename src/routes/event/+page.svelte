<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';
  import EventCard from '$components/event/EventCard.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';

  // Same contact plumbing the /contact hero uses, with the message pre-filled
  // so the sender does not have to explain why they are writing.
  $: whatsapp =
    data.settings?.contact_whatsapp && data.settings.contact_whatsapp !== '-'
      ? data.settings.contact_whatsapp.replace(/\D/g, '')
      : null;
  $: email = data.settings?.contact_email ?? null;
  $: waUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Halo ${siteName}, saya mau daftarkan event saya ke Jadwal Event.`
      )}`
    : null;
  $: mailUrl = email
    ? `mailto:${email}?subject=${encodeURIComponent('Daftarkan Event ke Jadwal Event Mokultur')}`
    : null;

  $: pageTitle = buildPageTitle('Jadwal Event', siteName);
  $: description = `Jadwal event anime, manga, cosplay, dan pop culture yang sedang dan akan berlangsung, dikurasi ${siteName}.`;
  $: canonical = absoluteUrl('/event');
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
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  {@html `<script type="application/ld+json">${JSON.stringify(
    buildBreadcrumb([{ name: 'Jadwal Event', path: '/event' }])
  )}<\/script>`}
</svelte:head>

<section class="section-md container-xl event-page">
  <!-- The dark gradient hero is this app's signature page opener; /contact uses
       the same one. The CTA lives inside it rather than as a card floating
       beside it, which left a large hole on desktop. -->
  <header class="event-page__hero mb-4">
    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-7">
        <span class="badge badge-main mb-3">Jadwal</span>
        <h1 class="event-page__title mb-2">Jadwal Event</h1>
        <p class="event-page__description mb-0">
          Acara anime, manga, cosplay, game, dan pop culture yang sedang dan akan berlangsung.
        </p>
      </div>

      {#if waUrl || mailUrl}
        <div class="col-12 col-lg-5">
          <div class="event-page__cta">
            <h2 class="h6 fw-bold text-white mb-1">Mau event kamu masuk sini?</h2>
            <p class="event-page__cta-text mb-3">
              Kirim detail acaranya ke kami — kalau cocok, kami tayangkan di Jadwal Event.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-2">
              {#if waUrl}
                <a
                  href={waUrl}
                  class="theme-btn theme-btn--primary w-100 justify-content-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i class="bi bi-whatsapp me-2"></i>WhatsApp
                </a>
              {/if}
              {#if mailUrl}
                <a href={mailUrl} class="theme-btn theme-btn--surface w-100 justify-content-center">
                  <i class="bi bi-envelope me-2"></i>Email
                </a>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </header>

  {#if data.upcoming.length > 0}
    <h2 class="event-page__section-head">Mendatang</h2>
    <div class="event-grid">
      {#each data.upcoming as event (event.slug)}
        <EventCard {event} />
      {/each}
    </div>
  {:else}
    <div class="event-empty">
      <i class="bi bi-calendar-x"></i>
      <p class="mb-0">Belum ada event mendatang yang terjadwal. Cek lagi nanti ya.</p>
    </div>
  {/if}

  {#if data.past.length > 0}
    <h2 class="event-page__section-head event-page__section-head--past">Sudah Lewat</h2>
    <div class="event-grid">
      {#each data.past as event (event.slug)}
        <EventCard {event} />
      {/each}
    </div>
  {/if}
</section>

<style>
  .event-page__hero {
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

  .event-page__title {
    font-size: clamp(2rem, 3vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #fff;
  }

  .event-page__description {
    color: rgb(255 255 255 / 78%);
  }

  .event-page__cta {
    border-radius: 16px;
    padding: 1.25rem;
    background: rgb(255 255 255 / 6%);
    border: 1px solid rgb(255 255 255 / 12%);
  }

  .event-page__cta-text {
    color: rgb(255 255 255 / 66%);
    font-size: 0.85rem;
  }

  .event-page__section-head {
    margin: 0 0 1rem;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    padding-left: 0.75rem;
    border-left: 4px solid var(--site-primary, #f1ff32);
  }

  .event-page__section-head--past {
    margin-top: 2.75rem;
    border-left-color: var(--bs-border-color, #dee2e6);
  }

  /* Four across like the homepage rows, so a schedule page and an article row
     line up when a reader moves between them. */
  .event-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .event-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--bs-secondary-color, #6c757d);
    border: 1px dashed var(--bs-border-color, #dee2e6);
    border-radius: 14px;
  }

  .event-empty i {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  @media (max-width: 991.98px) {
    .event-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 767.98px) {
    .event-page__hero {
      border-radius: 20px;
      padding: 1.5rem;
    }

    .event-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
  }
</style>
