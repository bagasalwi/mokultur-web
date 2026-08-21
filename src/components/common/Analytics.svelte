<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { consent } from '$lib/consent';

  export let measurementId: string | null = null;
  export let adsenseEnabled = false;
  export let adsensePublisherId: string | null = null;

  let gaLoaded = false;
  let adsLoaded = false;

  $: analyticsAllowed = $consent?.analytics === true;
  $: adsAllowed = $consent?.ads === true;

  // Nothing is fetched from Google until the visitor has said yes: no script tag,
  // no cookie, no request. Consent Mode then keeps ad signals off unless the ads
  // category was ticked too.
  $: if (browser && analyticsAllowed && measurementId && !gaLoaded) {
    gaLoaded = true;
    loadGtag(measurementId);
  }

  $: if (browser && gaLoaded) {
    updateConsentSignals(analyticsAllowed, adsAllowed);
  }

  $: if (browser && adsAllowed && adsenseEnabled && adsensePublisherId && !adsLoaded) {
    adsLoaded = true;
    loadAdsense(adsensePublisherId);
  }

  // SPA navigation does not reload the page, so each route change is reported
  // explicitly or every visit collapses into a single pageview.
  $: if (browser && gaLoaded && $page.url.pathname) {
    trackPageview($page.url.pathname + $page.url.search);
  }

  function gtag(...args: unknown[]) {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(args);
  }

  function loadGtag(id: string) {
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    gtag('js', new Date());
    gtag('config', id, { anonymize_ip: true });

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
  }

  function updateConsentSignals(analyticsOk: boolean, adsOk: boolean) {
    gtag('consent', 'update', {
      analytics_storage: analyticsOk ? 'granted' : 'denied',
      ad_storage: adsOk ? 'granted' : 'denied',
      ad_user_data: adsOk ? 'granted' : 'denied',
      ad_personalization: adsOk ? 'granted' : 'denied',
    });
  }

  function trackPageview(path: string) {
    if (!measurementId) return;
    gtag('event', 'page_view', { page_path: path });
  }

  function loadAdsense(publisherId: string) {
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
    document.head.appendChild(s);
  }
</script>
