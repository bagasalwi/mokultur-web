<script lang="ts">
  import { imgUrl } from '$lib/img';
  import { page } from '$app/stores';
  import { tick, onMount } from 'svelte';
  import type { SiteSettings, SocialMediaItem, NavbarItem, Category } from '$lib/api';
  import { LOUNGE_ENABLED } from '$lib/features';
  import { avatarUrl, initials } from '$lib/user';

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

  let userMenuOpen = false;
  function toggleUserMenu(e: MouseEvent) { e.stopPropagation(); userMenuOpen = !userMenuOpen; }
  function closeUserMenu() { userMenuOpen = false; }

  let menuOpen = false;
  function openMenu() { menuOpen = true; document.body.style.overflow = 'hidden'; }
  function closeMenu() { menuOpen = false; document.body.style.overflow = ''; }

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

  // Whitelist with a fallback, matching Hero.svelte: an unknown value from the
  // database renders the shipped layout rather than an empty header.
  const NAVBAR_STYLES = ['times', 'compact', 'masthead', 'split', 'minimal'];
  $: variant = NAVBAR_STYLES.includes(settings?.navbar_style ?? '')
    ? (settings?.navbar_style as string)
    : 'times';
  $: sectionLinks = navItems.length > 0
    ? navItems.map(item => ({ label: item.navName, href: item.navTarget }))
    : categories.map(cat => ({ label: cat.name, href: `/category/${cat.slug}` }));
  // Split variant seats the first half of the links left of the logo, the rest right.
  $: splitAt = Math.ceil(sectionLinks.length / 2);
</script>

<svelte:window on:click={closeUserMenu} />

<style>
  .navbar-user__avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    border: none; font-weight: 700; font-size: 13px;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; overflow: hidden; padding: 0;
  }
  .navbar-user__avatar img {
    width: 100%; height: 100%; object-fit: cover;
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

  /* Login button — desktop only */
  .navbar-login-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 0 14px; height: 34px; border-radius: 999px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    text-decoration: none; font-weight: 600; font-size: 13px;
    border: 1px solid rgba(0,0,0,0.08);
  }
  .navbar-login-btn:hover { filter: brightness(0.95); }

  /* Culture Lounge link in sections bar — inherits navbar-text color, italic to differentiate */
  .navbar-lounge-link {
    display: inline-flex; align-items: center; gap: 5px;
    font-style: italic;
  }
  .navbar-lounge-link i { font-size: 13px; }

  /* Offcanvas auth section */
  .bottomsheet-divider {
    border-color: rgba(255,255,255,0.08); margin: 0 0 1rem;
  }
  .bottomsheet-profile {
    display: flex; align-items: center; gap: 12px;
    padding: 0 0 14px; margin-bottom: 2px;
  }
  .bottomsheet-profile__avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 14px; overflow: hidden;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .bottomsheet-profile__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .bottomsheet-profile__info { display: flex; flex-direction: column; min-width: 0; }
  .bottomsheet-profile__info strong { color: #fff; font-size: 14px; }
  .bottomsheet-profile__info small { color: rgba(255,255,255,0.5); font-size: 12px; }

  .bottomsheet-auth-links { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
  .bottomsheet-auth-link {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8);
    text-decoration: none; background: none; border: none; width: 100%; text-align: left; cursor: pointer;
  }
  .bottomsheet-auth-link:hover { background: rgba(255,255,255,0.08); color: #fff; }
  .bottomsheet-auth-link em { font-style: italic; color: var(--site-primary, #f1ff32); }
  .bottomsheet-auth-link--logout { color: #f87171; }
  .bottomsheet-auth-link--logout:hover { background: rgba(248,113,113,0.1); }

  .bottomsheet-guest { padding-bottom: 12px; }
  .bottomsheet-guest p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 0 0 10px; }
  .bottomsheet-guest__cta { display: flex; gap: 8px; }
  .bottomsheet-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 999px;
    font-weight: 600; font-size: 13px; text-decoration: none; border: 1px solid transparent;
  }
  .bottomsheet-btn--primary {
    background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a);
  }
  .bottomsheet-btn--ghost {
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8);
    border-color: rgba(255,255,255,0.15);
  }
  .bottomsheet-nav__item--lounge {
    grid-column: 1 / -1;
    background: color-mix(in srgb, var(--site-primary, #f1ff32) 10%, transparent);
    border-color: color-mix(in srgb, var(--site-primary, #f1ff32) 25%, transparent);
    color: var(--site-primary, #f1ff32);
    justify-content: center; font-weight: 700;
  }
  .bottomsheet-nav__item--lounge:hover {
    background: color-mix(in srgb, var(--site-primary, #f1ff32) 20%, transparent);
  }
  .bottomsheet-nav__item--lounge em { font-style: italic; }
</style>

<!--
  Shared building blocks. Defined once so the five layouts below rearrange the
  same markup instead of each carrying its own copy of the logo, the action
  cluster and the section links.
-->
{#snippet burger()}
  <button
    class="btn navbar-burger d-lg-none"
    type="button"
    on:click={openMenu}
    aria-label="Menu"
    aria-expanded={menuOpen}
  >
    <span class="burger-icon" class:is-open={menuOpen}>
      <span class="burger-bar"></span>
      <span class="burger-bar"></span>
      <span class="burger-bar"></span>
    </span>
  </button>
{/snippet}

{#snippet brand()}
  <a href="/" class="navbar-logo-link">
    {#if siteLogo}
      <img src={imgUrl(siteLogo, 160)} alt={siteName} />
    {:else}
      <span class="logo-text">{siteName}</span>
    {/if}
  </a>
{/snippet}

{#snippet searchInline()}
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
{/snippet}

<!--
  `authClass` is how a variant decides whether the login button survives on
  mobile. Most layouts hide it there because the bottom sheet carries its own
  auth block; `minimal` has no sheet, so it passes an empty string.
-->
{#snippet actions(authClass: string)}
  <div class="d-flex align-items-center gap-2 navbar-actions">
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
        >
          {#if user.img}
            <img src={avatarUrl(user.img)} alt={user.name} />
          {:else}
            {initials(user.name)}
          {/if}
        </button>

        {#if userMenuOpen}
          <div class="navbar-user__menu" role="menu" on:click|stopPropagation on:keydown tabindex="-1">
            <div class="navbar-user__greet">
              <small>Halo,</small>
              <strong>{user.name}</strong>
            </div>
            <hr />
            {#if LOUNGE_ENABLED}
              <a class="navbar-user__item" href="/lounge" role="menuitem" on:click={closeUserMenu}>
                <i class="bi bi-stars"></i> <em>Culture Lounge</em>
              </a>
            {/if}
            <a class="navbar-user__item" href="/dashboard" role="menuitem" on:click={closeUserMenu}>
              <i class="bi bi-grid-1x2"></i> Dashboard
            </a>
            <a class="navbar-user__item" href="/dashboard/account" role="menuitem" on:click={closeUserMenu}>
              <i class="bi bi-person-gear"></i> Pengaturan Akun
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
      <a class="navbar-login-btn {authClass}" href="/auth/login" aria-label="Masuk">
        <i class="bi bi-box-arrow-in-right"></i>
        <span>Masuk</span>
      </a>
    {/if}
  </div>
{/snippet}

{#snippet sectionItems(links: { label: string; href: string }[], withLounge: boolean)}
  {#each links as link}
    <a
      class="navbar-section-link {isActive(link.href, currentPath) ? 'active' : ''}"
      href={link.href}
    >
      {link.label}
    </a>
  {/each}
  {#if withLounge && LOUNGE_ENABLED}
    <a
      class="navbar-section-link navbar-lounge-link {isActive('/lounge', currentPath) ? 'active' : ''}"
      href="/lounge"
    >
      <i class="bi bi-stars"></i> <em>Culture Lounge</em>
    </a>
  {/if}
{/snippet}

{#snippet sections(extraClass: string)}
  <nav class="navbar-sections-nav {extraClass}" aria-label="Sections">
    {@render sectionItems(sectionLinks, true)}
  </nav>
{/snippet}

<header class="sticky-top navbar-times navbar-times--{variant}" class:navbar-times--scrolled={scrolled}>
  {#if variant === 'compact'}
    <!-- One row: everything shares the brand bar, no sections bar underneath. -->
    <div class="navbar-brand-bar">
      <div class="container-xl d-flex align-items-center gap-3">
        {#if searchOpen}
          {@render searchInline()}
        {:else}
          {@render burger()}
          {@render brand()}
          {@render sections('navbar-sections-nav--inline')}
          {@render actions('d-none d-lg-flex')}
        {/if}
      </div>
    </div>

  {:else if variant === 'masthead'}
    <div class="navbar-brand-bar navbar-brand-bar--masthead">
      <div class="container-xl">
        {#if searchOpen}
          <div class="d-flex align-items-center">{@render searchInline()}</div>
        {:else}
          <div class="navbar-masthead__top">
            {@render burger()}
            {@render actions('d-none d-lg-flex')}
          </div>
          <div class="navbar-masthead__brand">
            {@render brand()}
          </div>
        {/if}
      </div>
    </div>
    <div class="navbar-sections-bar">
      <div class="container-xl">
        {@render sections('navbar-sections-nav--center')}
      </div>
    </div>

  {:else if variant === 'split'}
    <!--
      Sections flank the logo on one row. Below lg the flex container wraps and
      CSS `order` drops the logo onto its own line with the two halves beneath —
      the links are never duplicated in the DOM to make that happen.
    -->
    <div class="navbar-brand-bar navbar-brand-bar--split">
      <div class="container-xl navbar-split">
        {#if searchOpen}
          {@render searchInline()}
        {:else}
          <nav class="navbar-sections-nav navbar-split__side navbar-split__side--left" aria-label="Sections">
            {@render sectionItems(sectionLinks.slice(0, splitAt), false)}
          </nav>
          <div class="navbar-split__center">
            {@render burger()}
            {@render brand()}
          </div>
          <nav class="navbar-sections-nav navbar-split__side navbar-split__side--right" aria-label="Sections lanjutan">
            {@render sectionItems(sectionLinks.slice(splitAt), true)}
          </nav>
          {@render actions('d-none d-lg-flex')}
        {/if}
      </div>
    </div>

  {:else if variant === 'minimal'}
    <!--
      The toggle is a checkbox rather than the Svelte-driven burger the other
      variants use: this layout hides every link behind the menu, so with
      scripts blocked — the settings preview does exactly that — a JS-only
      toggle would leave the header with no navigation at all.
      It sits here as a direct child of <header> so `~` can reach the panel.
    -->
    <input type="checkbox" id="navMinimalMenu" class="navbar-minimal__toggle" />
    <div class="navbar-brand-bar">
      <div class="container-xl d-flex justify-content-between align-items-center">
        {#if searchOpen}
          {@render searchInline()}
        {:else}
          <label class="btn navbar-burger navbar-minimal__burger" for="navMinimalMenu">
            <span class="burger-icon">
              <span class="burger-bar"></span>
              <span class="burger-bar"></span>
              <span class="burger-bar"></span>
            </span>
            <span class="visually-hidden">Menu</span>
          </label>
          {@render brand()}
          {@render actions('')}
        {/if}
      </div>
    </div>
    <div class="navbar-minimal__panel">
      <div class="container-xl">
        {@render sections('navbar-sections-nav--stack')}
      </div>
    </div>

  {:else}
    <!-- times (default): brand bar, then a full-width sections bar below it. -->
    <div class="navbar-brand-bar">
      <div class="container-xl d-flex justify-content-between align-items-center">
        {#if searchOpen}
          {@render searchInline()}
        {:else}
          {@render burger()}
          {@render brand()}
          {@render actions('d-none d-lg-flex')}
        {/if}
      </div>
    </div>
    <div class="navbar-sections-bar">
      <div class="container-xl">
        {@render sections('')}
      </div>
    </div>
  {/if}
</header>

<!--
  Minimal keeps its navigation in the CSS panel above and never opens this sheet,
  so rendering it there would leave unreachable markup in every page.
-->
{#if variant !== 'minimal'}
  <!-- Backdrop -->
  {#if menuOpen}
    <div class="bottomsheet-backdrop" on:click={closeMenu} on:keydown role="presentation" aria-hidden="true"></div>
  {/if}

  <!-- Mobile Bottom Sheet -->
  <div class="offcanvas-bottomsheet offcanvas-bottomsheet--{variant}" class:is-open={menuOpen} tabindex="-1" aria-hidden={!menuOpen} aria-labelledby="offcanvasLabel">
    <div class="bottomsheet-handle-wrap">
      <div class="bottomsheet-handle"></div>
    </div>

    <div class="offcanvas-body">
      <!-- Auth section -->
      {#if user}
        <div class="bottomsheet-profile">
          <div class="bottomsheet-profile__avatar">
            {#if user.img}
              <img src={avatarUrl(user.img)} alt={user.name} />
            {:else}
              {initials(user.name)}
            {/if}
          </div>
          <div class="bottomsheet-profile__info">
            <strong>{user.name}</strong>
            {#if user.username}<small>@{user.username}</small>{/if}
          </div>
        </div>
        <div class="bottomsheet-auth-links">
          {#if LOUNGE_ENABLED}
            <a href="/lounge" class="bottomsheet-auth-link" on:click={closeMenu}>
              <i class="bi bi-stars"></i> <em>Culture Lounge</em>
            </a>
          {/if}
          <a href="/dashboard" class="bottomsheet-auth-link" on:click={closeMenu}>
            <i class="bi bi-grid-1x2"></i> Dashboard
          </a>
          <a href="/dashboard/account" class="bottomsheet-auth-link" on:click={closeMenu}>
            <i class="bi bi-person-gear"></i> Pengaturan Akun
          </a>
          <form method="POST" action="/auth/logout">
            <button type="submit" class="bottomsheet-auth-link bottomsheet-auth-link--logout">
              <i class="bi bi-box-arrow-right"></i> Keluar
            </button>
          </form>
        </div>
      {:else}
        <div class="bottomsheet-guest">
          <p>{LOUNGE_ENABLED ? 'Masuk untuk ikut Culture Lounge & diskusi.' : 'Masuk untuk pengalaman yang lebih personal.'}</p>
          <div class="bottomsheet-guest__cta">
            <a href={LOUNGE_ENABLED ? '/auth/login?redirect=/lounge' : '/auth/login'} class="bottomsheet-btn bottomsheet-btn--primary" on:click={closeMenu}>
              <i class="bi bi-box-arrow-in-right"></i> Masuk
            </a>
            <a href="/auth/register" class="bottomsheet-btn bottomsheet-btn--ghost" on:click={closeMenu}>Daftar</a>
          </div>
        </div>
      {/if}
      <hr class="bottomsheet-divider" />

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
            on:click={closeMenu}
          >{link.label}</a>
        {/each}
        {#if LOUNGE_ENABLED}
          <a
            href="/lounge"
            class="bottomsheet-nav__item bottomsheet-nav__item--lounge {isActive('/lounge', currentPath) ? 'is-active' : ''}"
            on:click={closeMenu}
          ><i class="bi bi-stars"></i> <em>Culture Lounge</em></a>
        {/if}
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
{/if}
