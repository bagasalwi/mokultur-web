<script lang="ts">
  import { page } from '$app/stores';
  import { tick, onMount } from 'svelte';
  import type { SiteSettings, SocialMediaItem, NavbarItem, Category } from '$lib/api';

  let scrolled = false;

  onMount(() => {
    const onScroll = () => { scrolled = window.scrollY > 4; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  export let settings: SiteSettings | null = null;
  export let navItems: NavbarItem[] = [];
  export let socials: SocialMediaItem[] = [];
  export let categories: Category[] = [];
  export let user: AuthUser | null = null;

  const DASHBOARD_URL = 'https://dashboard.mokultur.com';

  let userMenuOpen = false;
  function toggleUserMenu() { userMenuOpen = !userMenuOpen; }
  function closeUserMenu() { userMenuOpen = false; }

  function initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  }

  $: siteName = settings?.site_name ?? 'Mokultur';
  $: siteLogo = settings?.site_logo ?? null;
  const year = new Date().getFullYear();

  let searchOpen = false;
  let searchInputEl: HTMLInputElement;

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

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  }

  function openSearch() {
    searchOpen = true;
    tick().then(() => searchInputEl?.focus());
  }

  function closeSearch() {
    searchOpen = false;
  }

  function handleSearchKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim();
      if (val) window.location.href = `/index-article?search=${encodeURIComponent(val)}`;
    }
    if (e.key === 'Escape') closeSearch();
  }

  $: currentPath = $page.url.pathname;
  $: sectionLinks = navItems.length > 0
    ? navItems.map(item => ({ label: item.navName, href: item.navTarget }))
    : categories.map(cat => ({ label: cat.name, href: `/category/${cat.slug}` }));
</script>

<svelte:window on:click={closeUserMenu} />

<style>
  .navbar-user__avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    border: none; font-weight: 700; font-size: 13px;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .navbar-user__menu {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    min-width: 200px; padding: 8px 0; z-index: 1050;
  }
  .navbar-user__greet { padding: 6px 14px; }
  .navbar-user__greet small { color: #6b7280; font-size: 11px; display: block; }
  .navbar-user__greet strong { font-size: 14px; }
  .navbar-user__menu hr { margin: 4px 0; border-color: #f1f1f1; }
  .navbar-user__item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 14px; font-size: 13px; color: #111;
    text-decoration: none; background: none; border: none; width: 100%; text-align: left;
    cursor: pointer;
  }
  .navbar-user__item:hover { background: #f5f5f5; }
  .navbar-user__item--logout { color: #dc2626; }

  .navbar-login-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 999px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    text-decoration: none; font-weight: 600; font-size: 13px;
    border: 1px solid rgba(0,0,0,0.08);
  }
  .navbar-login-btn:hover { filter: brightness(0.95); }
</style>

<header class="sticky-top navbar-times" class:navbar-times--scrolled={scrolled}>
  <!-- Row 1: Brand bar -->
  <div class="navbar-brand-bar">
    <div class="container-xl d-flex justify-content-between align-items-center">

      {#if searchOpen}
        <!-- Search mode: full-width inline input -->
        <div class="navbar-search-inline flex-grow-1">
          <i class="bi bi-search navbar-search-inline__icon"></i>
          <input
            bind:this={searchInputEl}
            class="navbar-search-inline__input"
            type="search"
            placeholder="Cari artikel..."
            autocomplete="off"
            on:keydown={handleSearchKey}
          />
          <button class="btn btn-sm btn-icon-mokultur" on:click={closeSearch} aria-label="Tutup pencarian">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      {:else}
        <!-- Burger (mobile only) -->
        <button
          id="burgerBtn"
          class="btn navbar-burger d-lg-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasMokultur"
          aria-controls="offcanvasMokultur"
          aria-label="Menu"
        >
          <span class="burger-icon" id="burgerIcon">
            <span class="burger-bar"></span>
            <span class="burger-bar"></span>
            <span class="burger-bar"></span>
          </span>
        </button>

        <!-- Logo -->
        <a href="/" class="navbar-logo-link">
          {#if siteLogo}
            <img src={siteLogo} alt={siteName} />
          {:else}
            <span class="logo-text">{siteName}</span>
          {/if}
        </a>

        <!-- Right: Search + Social icons -->
        <div class="d-flex align-items-center gap-2">
          <button
            class="btn btn-sm btn-icon-mokultur"
            type="button"
            on:click={openSearch}
            title="Cari artikel"
            aria-label="Buka pencarian"
          >
            <i class="bi bi-search"></i>
          </button>

          {#if socials.length > 0}
            <div class="d-none d-lg-flex align-items-center gap-1">
              {#each socials as s}
                <a href={s.url} class="btn btn-sm btn-icon-mokultur" title={s.platform} target="_blank" rel="noopener noreferrer">
                  <i class="bi bi-{getIcon(s.platform, s.icon)}"></i>
                </a>
              {/each}
            </div>
          {/if}

          {#if user}
            <div class="navbar-user" style="position:relative;">
              <button
                type="button"
                class="navbar-user__avatar"
                aria-label="Menu akun"
                aria-expanded={userMenuOpen}
                on:click={toggleUserMenu}
              >{initials(user.name)}</button>

              {#if userMenuOpen}
                <div class="navbar-user__menu" role="menu">
                  <div class="navbar-user__greet">
                    <small>Halo,</small>
                    <strong>{user.name}</strong>
                  </div>
                  <hr />
                  <a class="navbar-user__item" href="/profile" role="menuitem" on:click={closeUserMenu}>
                    <i class="bi bi-person"></i> Profil
                  </a>
                  <form method="POST" action="/auth/logout" class="d-block">
                    <button type="submit" class="navbar-user__item navbar-user__item--logout" role="menuitem">
                      <i class="bi bi-box-arrow-right"></i> Keluar
                    </button>
                  </form>
                </div>
              {/if}
            </div>
          {:else}
            <a class="navbar-login-btn" href="/auth/login" aria-label="Masuk">
              <i class="bi bi-box-arrow-in-right"></i>
              <span class="d-none d-md-inline">Masuk</span>
            </a>
          {/if}
        </div>
      {/if}

    </div>
  </div>

  <!-- Row 2: Sections bar -->
  {#if sectionLinks.length > 0}
    <div class="navbar-sections-bar">
      <div class="container-xl">
        <nav class="navbar-sections-nav" aria-label="Sections">
          {#each sectionLinks as link}
            <a
              class="navbar-section-link {isActive(link.href, currentPath) ? 'active' : ''}"
              href={link.href}
            >
              {link.label}
            </a>
          {/each}
        </nav>
      </div>
    </div>
  {/if}
</header>

<!-- Mobile Bottom Sheet — outside header to avoid stacking context issues -->
<div class="offcanvas offcanvas-bottom offcanvas-bottomsheet" tabindex="-1" id="offcanvasMokultur" aria-labelledby="offcanvasLabel">
  <div class="bottomsheet-handle-wrap">
    <div class="bottomsheet-handle"></div>
  </div>

  <div class="offcanvas-body">
    <form action="/index-article" method="GET" class="bottomsheet-search">
      <div class="search-field-mokultur bottomsheet-search__field">
        <input
          type="text"
          class="search-input-mokultur"
          placeholder="Cari artikel..."
          name="search"
          autocomplete="off"
        />
        <button type="submit" class="bottomsheet-search__btn" aria-label="Cari">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </form>

    <nav class="bottomsheet-nav">
      {#each sectionLinks as link}
        <a
          href={link.href}
          class="bottomsheet-nav__item {isActive(link.href, currentPath) ? 'is-active' : ''}"
          data-bs-dismiss="offcanvas"
        >{link.label}</a>
      {/each}
    </nav>

    <div class="bottomsheet-footer">
      {#if socials.length > 0}
        <div class="bottomsheet-footer__socials">
          {#each socials as s}
            <a href={s.url} class="social-btn" title={s.platform} target="_blank" rel="noopener noreferrer">
              <i class="bi bi-{getIcon(s.platform, s.icon)}"></i>
            </a>
          {/each}
        </div>
      {/if}
      <small class="bottomsheet-footer__copy">&copy;{year} {siteName}</small>
    </div>
  </div>
</div>
