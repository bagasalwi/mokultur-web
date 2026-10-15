<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';
  import { imgFallback } from '$lib/format';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: email = data.settings?.contact_email ?? null;
  $: mailUrl = email ? `mailto:${email}` : null;
  $: stats = [
    { label: 'Total Partner', value: data.stats.total },
    { label: 'Media Partnership', value: data.stats.media },
    { label: 'Paid Partnership', value: data.stats.paid },
    { label: 'Invitational', value: data.stats.invitational },
  ];

</script>

<svelte:head>
  <title>Media Partner — {siteName}</title>
  <meta name="description" content="Daftar media partner dan kolaborasi {siteName}. Bergabunglah bersama kami." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={absoluteUrl('/media-partner')} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Media Partner — {siteName}" />
  <meta property="og:description" content="Daftar media partner dan kolaborasi {siteName}. Bergabunglah bersama kami." />
  <meta property="og:url" content={absoluteUrl('/media-partner')} />
  <meta name="twitter:card" content={data.settings?.og_image ? 'summary_large_image' : 'summary'} />
  {#if data.settings?.og_image}
    <meta property="og:image" content={data.settings.og_image} />
    <meta name="twitter:image" content={data.settings.og_image} />
  {/if}
  <meta name="twitter:title" content="Media Partner — {siteName}" />
  <meta name="twitter:description" content="Daftar media partner dan kolaborasi {siteName}. Bergabunglah bersama kami." />
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Media Partner', path: '/media-partner' }]))}<\/script>`}
</svelte:head>

<div class="media-partner-page section-md container-xl">

  <!-- Hero -->
  <header class="media-partner-hero">
    <div class="media-partner-hero__copy">
      <span class="media-partner-eyebrow">Media Partner Network</span>
      <h1>Bergabung Bersama Media Partner Kami</h1>
      <p>Kami terbuka untuk kolaborasi dengan berbagai media, brand, dan komunitas yang memiliki visi serupa.</p>
      <div class="media-partner-actions">
        {#if mailUrl}
          <a href={mailUrl} class="media-partner-button media-partner-button--primary">
            <i class="bi bi-envelope" aria-hidden="true"></i>Hubungi Kami
          </a>
        {/if}
        <a href="#partner-directory" class="media-partner-button media-partner-button--ghost">
          <i class="bi bi-grid" aria-hidden="true"></i>Lihat Direktori
        </a>
      </div>
    </div>
    <dl class="media-partner-hero__stats">
      {#each stats as stat}
        <div class="media-partner-stat">
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      {/each}
    </dl>
  </header>

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
              <svelte:element
                this={partner.link ? 'a' : 'div'}
                class="media-partner-card"
                href={partner.link ?? undefined}
                target={partner.link ? '_blank' : undefined}
                rel={partner.link ? 'noopener noreferrer' : undefined}
              >
                  <div class="media-partner-card__top">
                    <div class="media-partner-logo">
                      {#if partner.logo}
                        <img src={partner.logo} alt={partner.name} width="84" height="84" loading="lazy" on:error={imgFallback} />
                      {:else}
                        <span class="fw-boldest fs-4" style="color:var(--site-primary,#f1ff32);">{partner.name.slice(0, 2).toUpperCase()}</span>
                      {/if}
                    </div>
                    {#if partner.featured}
                      <span class="media-partner-card__badge">Featured</span>
                    {/if}
                  </div>
                  <div class="media-partner-card__body">
                    <h3>{partner.name}</h3>
                    {#if partner.industry}
                      <p class="media-partner-card__industry">{partner.industry}</p>
                    {/if}
                  </div>
                  {#if partner.link}
                    <span class="media-partner-card__link">
                      Kunjungi <i class="bi bi-box-arrow-up-right"></i>
                    </span>
                  {/if}
              </svelte:element>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

</div>
