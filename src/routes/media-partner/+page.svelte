<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: email = data.settings?.contact_email ?? null;
  $: mailUrl = email ? `mailto:${email}` : null;

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }
</script>

<svelte:head>
  <title>Media Partner — {siteName}</title>
  <meta name="description" content="Daftar media partner dan kolaborasi {siteName}. Bergabunglah bersama kami." />
  <link rel="canonical" href="/media-partner" />
</svelte:head>

<div class="media-partner-page section-md container-xl">

  <!-- Hero -->
  <div class="media-partner-hero mb-4">
    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-7">
        <span class="media-partner-eyebrow d-block mb-2">Media Partner Network</span>
        <h1 class="fw-boldest mb-2" style="font-size:clamp(1.8rem,4vw,3rem);letter-spacing:-0.03em;color:#fff;">
          Bergabung Bersama<br />Media Partner Kami
        </h1>
        <p class="mb-4" style="color:rgba(255,255,255,0.78);max-width:60ch;line-height:1.75;">
          Kami terbuka untuk kolaborasi dengan berbagai media, brand, dan komunitas yang memiliki visi serupa.
        </p>
        <div class="media-partner-actions d-flex flex-wrap gap-2">
          {#if mailUrl}
            <a href={mailUrl} class="media-partner-button media-partner-button--primary">
              <i class="bi bi-envelope me-2"></i>Hubungi Kami
            </a>
          {/if}
          <a href="#partner-directory" class="media-partner-button media-partner-button--ghost">
            <i class="bi bi-grid me-2"></i>Lihat Direktori
          </a>
        </div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="row g-3">
          <div class="col-6">
            <div class="media-partner-stat">
              <strong class="d-block fs-4 fw-boldest">{data.stats.total}</strong>
              <small style="color:rgba(255,255,255,0.55);">Total Partner</small>
            </div>
          </div>
          <div class="col-6">
            <div class="media-partner-stat">
              <strong class="d-block fs-4 fw-boldest">{data.stats.media}</strong>
              <small style="color:rgba(255,255,255,0.55);">Media Partnership</small>
            </div>
          </div>
          <div class="col-6">
            <div class="media-partner-stat">
              <strong class="d-block fs-4 fw-boldest">{data.stats.paid}</strong>
              <small style="color:rgba(255,255,255,0.55);">Paid Partnership</small>
            </div>
          </div>
          <div class="col-6">
            <div class="media-partner-stat">
              <strong class="d-block fs-4 fw-boldest">{data.stats.invitational}</strong>
              <small style="color:rgba(255,255,255,0.55);">Invitational</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Featured Partners -->
  {#if data.featured.length > 0}
    <div class="media-partner-featured mb-4">
      <div class="mb-3">
        <span class="badge badge-main mb-2">Featured</span>
        <h2 class="h5 fw-bold mb-0">Partner Unggulan</h2>
      </div>
      <div class="media-partner-featured__grid">
        {#each data.featured as partner}
          <a
            href={partner.link ?? '#'}
            class="media-partner-featured-card text-decoration-none"
            target={partner.link ? '_blank' : undefined}
            rel={partner.link ? 'noopener noreferrer' : undefined}
          >
            <div class="media-partner-logo">
              {#if partner.logo}
                <img src={partner.logo} alt={partner.name} width="48" height="48" style="object-fit:contain;max-width:60px;max-height:44px;" loading="lazy" on:error={imgFallback} />
              {:else}
                <span class="fw-boldest fs-5" style="color:var(--site-primary,#f1ff32);">{partner.name.slice(0, 2).toUpperCase()}</span>
              {/if}
            </div>
            <div class="min-w-0">
              <strong class="d-block text-dark fw-bold small">{partner.name}</strong>
              {#if partner.industry}
                <small class="text-muted">{partner.industry}</small>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Partner Directory -->
  <div id="partner-directory">
    {#each data.sections as section}
      <div class="media-partner-directory mb-5">
        <div class="media-partner-section-heading mb-4">
          <span class="badge badge-main mb-2">{section.eyebrow}</span>
          <h2 class="h4 fw-bold mb-1">{section.label}</h2>
          <p class="text-muted small mb-0">{section.description}</p>
        </div>

        {#if section.partners.length === 0}
          <div class="media-partner-empty">
            <strong class="small">Belum ada partner di kategori ini</strong>
            <p class="small text-muted mb-0">Tertarik bergabung? Hubungi kami untuk informasi lebih lanjut.</p>
          </div>
        {:else}
          <div class="media-partner-grid">
            {#each section.partners as partner}
              <div class="media-partner-card">
                  <div class="media-partner-card__top">
                    <div class="media-partner-logo">
                      {#if partner.logo}
                        <img src={partner.logo} alt={partner.name} width="60" height="60" style="object-fit:contain;max-width:60px;max-height:55px;" loading="lazy" on:error={imgFallback} />
                      {:else}
                        <span class="fw-boldest fs-4" style="color:var(--site-primary,#f1ff32);">{partner.name.slice(0, 2).toUpperCase()}</span>
                      {/if}
                    </div>
                    {#if partner.featured}
                      <span class="media-partner-card__badge">Featured</span>
                    {/if}
                  </div>
                  <div class="media-partner-card__body">
                    <h3 class="fw-boldest mb-1">{partner.name}</h3>
                    {#if partner.industry}
                      <p class="small text-muted mb-1">{partner.industry}</p>
                    {/if}
                    {#if partner.description}
                      <p class="mb-0">{partner.description.slice(0, 130)}{partner.description.length > 130 ? '…' : ''}</p>
                    {/if}
                  </div>
                  {#if partner.link}
                    <a href={partner.link} class="media-partner-card__link" target="_blank" rel="noopener noreferrer">
                      <span>Kunjungi Website</span>
                      <i class="bi bi-chevron-right"></i>
                    </a>
                  {/if}
                </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

</div>
