<script lang="ts">
  import '../styles/app.scss';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import Navbar from '$components/layout/Navbar.svelte';
  import Footer from '$components/layout/Footer.svelte';
  import NavProgress from '$components/common/NavProgress.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  afterNavigate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  onMount(async () => {
    await import('bootstrap/dist/js/bootstrap.bundle.min.js');
  });

  $: if (typeof document !== 'undefined') {
    const r = document.documentElement.style;
    r.setProperty('--site-primary', primaryColor);
    r.setProperty('--site-dark', darkColor);
    r.setProperty('--site-accent-glow', accentGlow);
    r.setProperty('--site-accent', accentGlow);
    r.setProperty('--site-badge-text', badgeTextColor);
    r.setProperty('--site-secondary', primaryColor);
    r.setProperty('--site-primary-contrast', primaryContrast);
    r.setProperty('--navbar-bg', navbarBg);
    r.setProperty('--navbar-text', navbarText);
  }

  $: s = data.settings;
  $: primaryColor = s?.primary_color ?? '#f1ff32';
  $: darkColor = s?.dark_color ?? '#0a0a0a';
  $: accentGlow = s?.accent_glow ?? primaryColor;
  $: badgeTextColor = s?.badge_text_color ?? '#ffffff';
  $: navbarBg = s?.navbar_bg ?? '#ffffff';
  $: navbarText = s?.navbar_text ?? '#1a1a1a';
  $: primaryContrast = s?.primary_contrast ?? '#000000';

  $: origin = $page.url.origin;
  $: siteName = data.settings?.site_name ?? 'Mokultur';

  $: orgSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: siteName,
    url: origin,
    logo: data.settings?.site_logo
      ? { '@type': 'ImageObject', url: data.settings.site_logo }
      : undefined,
    sameAs: (data.socials ?? []).map((s) => s.url),
  });

  $: websiteSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/index-article?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
</script>

<svelte:head>
  {#if data.settings?.site_favicon}
    <link rel="icon" href={data.settings.site_favicon} />
  {/if}
  <meta property="og:locale" content="id_ID" />
  <meta property="og:site_name" content={siteName} />
  {@html `<script type="application/ld+json">${orgSchema}<\/script>`}
  {@html `<script type="application/ld+json">${websiteSchema}<\/script>`}
  {@html `<style>
    :root {
      --site-primary: ${primaryColor};
      --site-dark: ${darkColor};
      --site-accent-glow: ${accentGlow};
      --site-accent: ${accentGlow};
      --site-badge-text: ${badgeTextColor};
      --site-secondary: ${primaryColor};
      --site-primary-contrast: ${primaryContrast};
      --navbar-bg: ${navbarBg};
      --navbar-text: ${navbarText};
    }
  </style>`}
</svelte:head>

<a href="#main-content" class="visually-hidden-focusable">Skip to content</a>
<NavProgress />
<Navbar settings={data.settings} navItems={data.navHeader} socials={data.socials} categories={data.categories} user={data.user ?? null} />

<main id="main-content">
  <slot />
</main>

<Footer settings={data.settings} footerItems={data.navFooter} socials={data.socials} categories={data.categories} />
