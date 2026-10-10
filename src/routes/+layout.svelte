<script lang="ts">
  import '../styles/app.scss';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import Navbar from '$components/layout/Navbar.svelte';
  import Footer from '$components/layout/Footer.svelte';
  import NavProgress from '$components/common/NavProgress.svelte';
  import CookieConsent from '$components/common/CookieConsent.svelte';
  import AuthModal from '$components/auth/AuthModal.svelte';
  import { openSearchPalette, searchPalette } from '$lib/stores/search-palette';
  import { ICON_FONT_URL } from '$lib/generated/icon-font';
  import Analytics from '$components/common/Analytics.svelte';
  import type { LayoutData } from './$types';
  import { isAnimePath } from '$lib/route-policy';

  export let data: LayoutData;

  // Bootstrap's JS (≈80 KB) is only needed by markup that uses its data API;
  // no page does today, so it loads on demand instead of on every visit.
  let bootstrapRequested = false;
  function loadBootstrapIfNeeded() {
    if (bootstrapRequested || !document.querySelector('[data-bs-toggle], [data-bs-ride], .carousel')) return;
    bootstrapRequested = true;
    void import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }

  /**
   * Runs `run` once, on the reader's first scroll, tap, key or pointer move,
   * or after `fallbackMs`. Extras that nobody needs to start reading load here
   * so they never block the first paint or the page becoming responsive.
   */
  function onFirstInteraction(run: () => void, fallbackMs: number) {
    let done = false;
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;
    const fire = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      for (const name of events) window.removeEventListener(name, fire);
      run();
    };
    const timer = setTimeout(fire, fallbackMs);
    for (const name of events) window.addEventListener(name, fire, { once: true, passive: true });
  }

  // Subscribe with Google (≈80 KB, ~300 ms of script on a phone) is not needed
  // to read. The inline SWG_BASIC queue in <svelte:head> holds the init call
  // until the script arrives.
  let swgRequested = false;
  function loadSwg() {
    if (swgRequested) return;
    swgRequested = true;
    onFirstInteraction(() => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://news.google.com/swg/js/v1/swg-basic.js';
      document.head.appendChild(script);
    }, 10_000);
  }

  // The chat widget and the search palette are loaded on demand, not with every page.
  let ChatWidget: typeof import('$components/chat/ChatWidget.svelte').default | null = null;
  let SearchPalette: typeof import('$components/search/SearchPalette.svelte').default | null = null;
  function loadSearchPalette() {
    if (SearchPalette) return;
    void import('$components/search/SearchPalette.svelte').then((m) => (SearchPalette = m.default));
  }
  $: if ($searchPalette.open) loadSearchPalette();
  // Until the palette is loaded, this stands in for its "/" and Ctrl/⌘+K shortcuts; it then takes them over.
  function searchShortcut(event: KeyboardEvent) {
    if (SearchPalette) return;
    const el = event.target as HTMLElement | null;
    const typing = !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    if (((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey) && !event.altKey) || (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !typing)) {
      event.preventDefault();
      openSearchPalette();
    }
  }

  let mounted = false;
  afterNavigate(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    loadBootstrapIfNeeded();
  });

  onMount(() => {
    mounted = true;
    loadBootstrapIfNeeded();
    if (data.settings?.ai_chat_enabled) {
      onFirstInteraction(() => void import('$components/chat/ChatWidget.svelte').then((m) => (ChatWidget = m.default)), 8_000);
    }
  });

  $: if (mounted && !isPrivateRoute) loadSwg();

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

  // The assistant answers questions about the public site; it has no business
  // on the dashboard or the auth screens.
  $: isPrivateRoute = $page.url.pathname.startsWith('/dashboard') || $page.url.pathname.startsWith('/auth');

  $: origin = $page.url.origin;
  $: siteName = data.settings?.site_name ?? 'Mokultur';

  $: orgSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: siteName,
    url: origin,
    // The same logo file the article publisher markup uses (API schema builder).
    logo: { '@type': 'ImageObject', url: `${origin}/assets/mokultur/MOKULTUR-LOGO.png` },
    sameAs: (data.socials ?? []).map((s) => s.url),
  });

  $: websiteSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    // Helps Google settle on a single site name in search results.
    alternateName: 'Mokultur ID',
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
</script>

<svelte:head>
  <link rel="preload" href={ICON_FONT_URL} as="font" type="font/woff2" crossorigin="anonymous" />
  {#if isAnimePath($page.url.pathname)}
    <meta name="robots" content="noindex, follow" />
  {/if}
  <!-- Google Reader Revenue Manager (Subscribe with Google, open access). Public pages only. -->
  {#if !isPrivateRoute}
    {@html `<script>
  (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
    basicSubscriptions.init({
      type: "NewsArticle",
      isPartOfType: ["Product"],
      isPartOfProductId: "CAowgYTIDA:openaccess",
      clientOptions: { theme: "light", lang: "id" },
    });
  });
<\/script>`}
  {/if}
  {#if data.settings?.site_favicon}
    <link rel="icon" href={data.settings.site_favicon} />
  {:else}
    <link rel="icon" href="/icons/icon-32.png" sizes="32x32" type="image/png" />
  {/if}
  <meta property="og:locale" content="id_ID" />
  <meta property="og:site_name" content={siteName} />
  <meta name="twitter:site" content="@mokultur" />
  <link rel="alternate" type="application/rss+xml" title="Mokultur" href="/rss.xml" />
  <meta name="twitter:creator" content="@mokultur" />
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

<svelte:window on:keydown={searchShortcut} />

{#if ChatWidget && data.settings?.ai_chat_enabled && !isPrivateRoute}
  <svelte:component
    this={ChatWidget}
    title={data.settings.ai_chat_title}
    greeting={data.settings.ai_chat_greeting}
    placeholder={data.settings.ai_chat_placeholder}
    suggestions={data.settings.ai_chat_suggestions}
  />
{/if}

<CookieConsent />
<!-- Site-wide search: the navbar icon, "/" or Ctrl/⌘+K. -->
{#if SearchPalette}<svelte:component this={SearchPalette} categories={data.categories} />{/if}
{#if !data.user}
  <!-- Logging in and signing up happen here, over whatever page the reader is on. -->
  <AuthModal siteName={data.settings?.site_name ?? 'Mokultur'} logo={data.settings?.site_logo ?? null} />
{/if}
<Analytics
  measurementId={data.settings?.google_analytics ?? null}
  adsenseEnabled={data.settings?.adsense_enabled ?? false}
  adsensePublisherId={data.settings?.adsense_publisher_id ?? null}
/>
