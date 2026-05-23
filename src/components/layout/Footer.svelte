<script lang="ts">
  import type { SiteSettings, NavbarItem, SocialMediaItem, Category } from '$lib/api';

  export let settings: SiteSettings | null = null;
  export let footerItems: NavbarItem[] = [];
  export let socials: SocialMediaItem[] = [];
  export let categories: Category[] = [];

  const siteName = settings?.site_name ?? 'Mokultur';
  const siteLogo = settings?.site_logo ?? null;
  const tagline = settings?.site_description ?? 'News, ulasan, dan wawasan budaya pop terkini.';
  const year = new Date().getFullYear();

  const iconMap: Record<string, string> = {
    instagram: 'instagram',
    facebook: 'facebook',
    tiktok: 'tiktok',
    twitter: 'twitter-x',
    x: 'twitter-x',
    youtube: 'youtube',
    threads: 'threads',
    whatsapp: 'whatsapp',
    globe: 'globe',
    website: 'globe',
    linkedin: 'linkedin',
    telegram: 'telegram',
  };

  function getIcon(platform: string, icon: string | null): string {
    if (icon) return icon;
    return iconMap[platform.toLowerCase()] ?? 'link-45deg';
  }

  $: mid = Math.ceil(footerItems.length / 2);
  $: col1 = footerItems.length > 0 ? footerItems.slice(0, mid) : [{ navTarget: '/', navName: 'Beranda' }, { navTarget: '/index-article', navName: 'Artikel' }];
  $: col2 = footerItems.slice(mid);
</script>

<footer class="bg-black text-white">
  <div class="container-xl">
    <div class="row py-4 py-lg-5">
      <!-- Brand column -->
      <div class="col-lg-4 col-md-5 mb-4 mb-md-0">
        <a href="/" class="d-inline-block mb-3">
          {#if siteLogo}
            <img src={siteLogo} alt={siteName} height="28" />
          {:else}
            <span class="fw-boldest fs-5 text-white">{siteName}</span>
          {/if}
        </a>
        <p class="text-white-50 small mb-3" style="max-width: 280px;">
          {tagline}
        </p>
        {#if socials.length > 0}
          <div class="d-flex gap-2 flex-wrap">
            {#each socials as s}
              <a href={s.url} class="social-btn" title={s.platform} target="_blank" rel="noopener noreferrer">
                <i class="bi bi-{getIcon(s.platform, s.icon)}"></i>
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Kategori column -->
      {#if categories.length > 0}
        <div class="col-6 col-md-2 offset-lg-1 mb-3 mb-md-0">
          <h6 class="fw-bold text-white-50 text-uppercase small mb-3" style="letter-spacing: 0.05em;">Kategori</h6>
          <ul class="list-unstyled mb-0">
            {#each categories.slice(0, 7) as cat}
              <li class="mb-2">
                <a class="text-white text-decoration-none small footer-link" href="/category/{cat.slug}">{cat.name}</a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Menu column -->
      <div class="col-6 col-md-2 {categories.length === 0 ? 'offset-lg-2' : ''} mb-3 mb-md-0">
        <h6 class="fw-bold text-white-50 text-uppercase small mb-3" style="letter-spacing: 0.05em;">Menu</h6>
        <ul class="list-unstyled mb-0">
          {#each col1 as item}
            <li class="mb-2">
              <a class="text-white text-decoration-none small footer-link" href={item.navTarget}>{item.navName}</a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Lainnya column -->
      {#if col2.length > 0}
        <div class="col-6 col-md-2 mb-3 mb-md-0">
          <h6 class="fw-bold text-white-50 text-uppercase small mb-3" style="letter-spacing: 0.05em;">Lainnya</h6>
          <ul class="list-unstyled mb-0">
            {#each col2 as item}
              <li class="mb-2">
                <a class="text-white text-decoration-none small footer-link" href={item.navTarget}>{item.navName}</a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <!-- Copyright bar -->
    <div class="border-top py-3" style="border-color: rgba(255,255,255,0.1) !important;">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
        <small class="text-white-50">&copy;{year} {siteName}. All rights reserved.</small>
        {#if socials.length > 0}
          <div class="d-flex align-items-center gap-2">
            {#each socials as s}
              <a href={s.url} class="footer-socmed-btn" title={s.platform} target="_blank" rel="noopener noreferrer">
                <i class="bi bi-{getIcon(s.platform, s.icon)}"></i>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</footer>
