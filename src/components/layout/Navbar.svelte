<script lang="ts">
  import { imgUrl } from '$lib/img';
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import type { SiteSettings, SocialMediaItem, NavbarItem, Category } from '$lib/api';
  import { LOUNGE_ENABLED } from '$lib/features';
  import { openSearchPalette } from '$lib/stores/search-palette';
  import { avatarUrl, initials } from '$lib/user';
  import { socialGradient } from '$lib/social';

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
  let userMenuEl: HTMLDivElement;
  let userButton: HTMLButtonElement;
  async function toggleUserMenu(e: MouseEvent) {
    e.stopPropagation();
    userMenuOpen = !userMenuOpen;
    if (userMenuOpen) {
      await tick();
      menuItems()[0]?.focus();
    }
  }
  function closeUserMenu() { userMenuOpen = false; }
  const menuItems = () => [...(userMenuEl?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  /** Arrow keys move between items, Escape closes and hands focus back to the avatar. */
  function onUserMenuKey(event: KeyboardEvent) {
    const items = menuItems();
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      closeUserMenu();
      userButton?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(at + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      closeUserMenu();
    }
  }
  const USER_LINKS = [
    { href: '/dashboard', icon: 'bi-stars', label: 'Untuk Kamu' },
    { href: '/dashboard/tersimpan', icon: 'bi-bookmark', label: 'Tersimpan' },
    { href: '/dashboard/riwayat', icon: 'bi-clock-history', label: 'Riwayat baca' },
    { href: '/dashboard/aktivitas', icon: 'bi-lightning-charge', label: 'Aktivitas' },
    { href: '/dashboard/account', icon: 'bi-gear', label: 'Pengaturan akun' },
  ];

  let menuOpen = false;
  let sheetClose: HTMLButtonElement;
  let menuOpener: HTMLElement | null = null;
  async function openMenu() {
    menuOpener = document.activeElement as HTMLElement | null;
    menuOpen = true;
    document.body.style.overflow = 'hidden';
    await tick();
    sheetClose?.focus();
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    document.body.style.overflow = '';
    menuOpener?.focus?.();
  }
  function onSheetKey(event: KeyboardEvent) {
    if (event.key === 'Escape') closeMenu();
  }
  // The sheet hands search over to the site-wide palette rather than keeping its own field.
  function searchFromSheet() {
    closeMenu();
    openSearchPalette();
  }
  const EXTRA_LINKS = [
    { href: '/untuk-kamu', icon: 'bi-stars', label: "Mokultur's Pick" },
    { href: '/index-article', icon: 'bi-collection', label: 'Semua artikel' },
    { href: '/author', icon: 'bi-people', label: 'Penulis' },
  ];

  $: siteName = settings?.site_name ?? 'Mokultur';
  $: siteLogo = settings?.site_logo ?? null;
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

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  }

  $: currentPath = $page.url.pathname;

  // Whitelist with a fallback, matching Hero.svelte: an unknown value from the
  // database renders the shipped layout rather than an empty header.
  const NAVBAR_STYLES = ['times', 'compact', 'masthead', 'split', 'minimal'];
  $: variant = NAVBAR_STYLES.includes(settings?.navbar_style ?? '')
    ? (settings?.navbar_style as string)
    : 'times';
  $: baseSectionLinks = navItems.length > 0
    ? navItems.map(item => ({ label: item.navName, href: item.navTarget }))
    : categories.map(cat => ({ label: cat.name, href: `/category/${cat.slug}` }));
  $: sectionLinks = baseSectionLinks.filter((item) => item.href !== '/untuk-kamu');
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
  .navbar-user__avatar:focus-visible { outline: 3px solid var(--site-dark, #0d0d0d); outline-offset: 2px; }
  .navbar-user__avatar[aria-expanded='true'] { box-shadow: 0 0 0 3px #fff, 0 0 0 5px var(--site-dark, #0d0d0d); }

  /* Account menu: the house dark panel, same as the mobile sheet. */
  .user-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 1050;
    width: 288px;
    max-width: calc(100vw - 24px);
    padding: 0.5rem;
    border-radius: 18px;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #f1ff32) 26%, transparent), transparent 45%),
      linear-gradient(160deg, var(--site-dark, #0d0d0d) 0%, #101827 60%, #1f2937 100%);
    box-shadow: 0 18px 44px rgba(13, 13, 13, 0.28), 0 2px 6px rgba(13, 13, 13, 0.12);
    animation: user-menu-in 160ms cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: top right;
  }
  @keyframes user-menu-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } }
  .user-menu__me { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.65rem 0.8rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 0.35rem; }
  .user-menu__face { display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; overflow: hidden; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #0d0d0d); font-size: 0.875rem; font-weight: 900; }
  .user-menu__face img { width: 100%; height: 100%; object-fit: cover; }
  .user-menu__who { display: grid; min-width: 0; line-height: 1.25; }
  .user-menu__who strong { overflow: hidden; color: #fff; font-size: 0.9375rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
  .user-menu__who small { overflow: hidden; color: rgba(255, 255, 255, 0.6); font-size: 0.75rem; text-overflow: ellipsis; white-space: nowrap; }
  .user-menu__item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    min-height: 40px;
    padding: 0 0.65rem;
    border: 0;
    border-radius: 10px;
    background: none;
    color: rgba(255, 255, 255, 0.88);
    font-size: 0.875rem;
    font-weight: 600;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .user-menu__item i { width: 18px; color: var(--site-primary, #f1ff32); text-align: center; }
  .user-menu__item em { font-style: italic; }
  .user-menu__item:hover, .user-menu__item:focus-visible { background: rgba(255, 255, 255, 0.09); color: #fff; outline: none; }
  .user-menu__item:focus-visible { box-shadow: inset 0 0 0 2px var(--site-primary, #f1ff32); }
  .user-menu__item.is-active { background: rgba(255, 255, 255, 0.06); color: #fff; }
  .user-menu__item.is-active::after { content: ''; width: 6px; height: 6px; margin-left: auto; border-radius: 50%; background: var(--site-primary, #f1ff32); }
  .user-menu__sep { height: 1px; margin: 0.35rem 0.4rem; border: 0; background: rgba(255, 255, 255, 0.1); }
  .user-menu__item--out { color: #fca5a5; }
  .user-menu__item--out i { color: #fca5a5; }
  @media (prefers-reduced-motion: reduce) { .user-menu { animation: none; } }

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

  /* Mobile bottom sheet: the house dark panel (same recipe as the dark side cards). */
  .sheet-backdrop { position: fixed; inset: 0; z-index: 1060; background: rgba(13, 13, 13, 0.6); }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1061;
    display: flex;
    flex-direction: column;
    max-height: 88dvh;
    border-radius: 24px 24px 0 0;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #f1ff32) 28%, transparent), transparent 42%),
      linear-gradient(160deg, var(--site-dark, #0d0d0d) 0%, #101827 60%, #1f2937 100%);
    box-shadow: 0 -18px 44px rgba(13, 13, 13, 0.35);
    transform: translateY(100%);
    transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sheet.is-open { transform: translateY(0); }
  .sheet:not(.is-open) { visibility: hidden; }

  .sheet__grip { width: 40px; height: 4px; margin: 0.6rem auto 0; border-radius: 4px; background: rgba(255, 255, 255, 0.25); }
  .sheet__head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.5rem 1.25rem 0.75rem; }
  .sheet__head h2 { margin: 0; color: #fff; font-size: 1.25rem; font-weight: 900; letter-spacing: -0.02em; }
  .sheet__close { display: grid; place-items: center; width: 44px; height: 44px; margin-right: -0.5rem; border: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.08); color: #fff; font-size: 1rem; }
  .sheet__close:hover { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #0d0d0d); }

  .sheet__body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 1.25rem calc(1.25rem + env(safe-area-inset-bottom)); }

  .sheet__search {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 52px;
    padding: 0 0.5rem 0 1rem;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9375rem;
    text-align: left;
  }
  .sheet__search > span { flex: 1; }
  .sheet__search > i:last-child { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #0d0d0d); }

  .sheet__account { margin-top: 1rem; padding: 1rem; border-radius: 18px; background: rgba(255, 255, 255, 0.06); }
  .sheet__account p { margin: 0 0 0.85rem; color: rgba(255, 255, 255, 0.78); font-size: 0.875rem; line-height: 1.5; }
  .sheet__cta { display: flex; gap: 0.5rem; }
  .sheet__btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; flex: 1; min-height: 44px; padding: 0 1rem; border: 1px solid transparent; border-radius: 999px; font-size: 0.875rem; font-weight: 800; text-decoration: none; }
  .sheet__btn--primary { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #0d0d0d); }
  .sheet__btn--ghost { border-color: rgba(255, 255, 255, 0.2); color: #fff; }
  .sheet__btn--ghost:hover { border-color: #fff; }

  .sheet__me { display: flex; align-items: center; gap: 0.75rem; color: #fff; text-decoration: none; }
  .sheet__avatar { display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; overflow: hidden; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #0d0d0d); font-size: 0.875rem; font-weight: 900; }
  .sheet__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .sheet__me-text { display: grid; flex: 1; min-width: 0; line-height: 1.25; }
  .sheet__me-text strong { overflow: hidden; font-size: 0.9375rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
  .sheet__me-text small { color: rgba(255, 255, 255, 0.6); font-size: 0.75rem; }
  .sheet__me > i { color: rgba(255, 255, 255, 0.5); }
  .sheet__shortcuts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.4rem; margin: 0.9rem 0 0; padding: 0; list-style: none; }
  .sheet__shortcuts a { display: grid; justify-items: center; gap: 0.3rem; padding: 0.6rem 0.25rem; border-radius: 12px; background: rgba(255, 255, 255, 0.06); color: #fff; font-size: 0.6875rem; font-weight: 700; text-align: center; text-decoration: none; }
  .sheet__shortcuts a i { color: var(--site-primary, #f1ff32); font-size: 1.05rem; }
  .sheet__shortcuts a:hover { background: rgba(255, 255, 255, 0.12); }
  .sheet__logout { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 36px; margin-top: 0.6rem; padding: 0; border: 0; background: none; color: #fca5a5; font-size: 0.8125rem; font-weight: 700; }

  .sheet__group { margin-top: 1.5rem; }
  .sheet__group h3 { margin: 0 0 0.6rem; color: rgba(255, 255, 255, 0.6); font-size: 0.75rem; font-weight: 700; }
  .sheet__nav { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .sheet__nav a { display: flex; align-items: center; min-height: 48px; padding: 0 1rem; border-radius: 14px; background: rgba(255, 255, 255, 0.06); color: #fff; font-size: 0.9375rem; font-weight: 700; text-decoration: none; transition: background-color 160ms ease, color 160ms ease; }
  .sheet__nav a:hover { background: rgba(255, 255, 255, 0.12); }
  .sheet__nav a.is-active { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #0d0d0d); }
  .sheet__nav a em { font-style: italic; }
  .sheet__nav-wide-item { grid-column: 1 / -1; }
  .sheet__nav .sheet__nav-wide { grid-column: 1 / -1; justify-content: center; gap: 0.4rem; border: 1px solid color-mix(in srgb, var(--site-primary, #f1ff32) 40%, transparent); color: var(--site-primary, #f1ff32); background: transparent; }

  .sheet__chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .sheet__chips a { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 40px; padding: 0 0.9rem; border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 999px; color: #fff; font-size: 0.8125rem; font-weight: 700; text-decoration: none; }
  .sheet__chips a i { color: var(--site-primary, #f1ff32); }
  .sheet__chips a:hover, .sheet__chips a.is-active { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #0d0d0d); }
  .sheet__chips a:hover i, .sheet__chips a.is-active i { color: inherit; }

  .sheet__foot { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1); }
  .sheet__socials { display: flex; gap: 0.5rem; }
  .sheet__socials a { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: #fff; font-size: 0.95rem; text-decoration: none; }
  .sheet__foot small { color: rgba(255, 255, 255, 0.45); font-size: 0.75rem; }

  .sheet :is(a, button):focus-visible { outline: 3px solid var(--site-primary, #f1ff32); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .sheet { transition: none; }
  }
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
      <img src={imgUrl(siteLogo, 160)} alt={siteName} width="160" height="56" />
    {:else}
      <span class="logo-text">{siteName}</span>
    {/if}
  </a>
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
      on:click={() => openSearchPalette()}
      title="Cari (tekan /)"
      aria-label="Buka pencarian"
      aria-keyshortcuts="/ Control+K Meta+K"
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
          aria-haspopup="menu"
          aria-controls="user-menu"
          aria-expanded={userMenuOpen}
          bind:this={userButton}
          on:click={toggleUserMenu}
        >
          {#if user.img}
            <img src={avatarUrl(user.img)} alt={user.name} />
          {:else}
            {initials(user.name)}
          {/if}
        </button>

        {#if userMenuOpen}
          <div
            class="user-menu"
            id="user-menu"
            role="menu"
            aria-label="Akun {user.name}"
            tabindex="-1"
            bind:this={userMenuEl}
            on:click|stopPropagation
            on:keydown={onUserMenuKey}
          >
            <div class="user-menu__me">
              <span class="user-menu__face" aria-hidden="true">
                {#if user.img}<img src={avatarUrl(user.img)} alt="" />{:else}{initials(user.name)}{/if}
              </span>
              <span class="user-menu__who">
                <strong>{user.name}</strong>
                <small>{user.username ? `@${user.username}` : user.email}</small>
              </span>
            </div>
            {#each USER_LINKS as link (link.href)}
              <a
                class="user-menu__item"
                class:is-active={currentPath === link.href}
                href={link.href}
                role="menuitem"
                aria-current={currentPath === link.href ? 'page' : undefined}
                on:click={closeUserMenu}
              ><i class="bi {link.icon}" aria-hidden="true"></i>{link.label}</a>
            {/each}
            {#if LOUNGE_ENABLED}
              <a class="user-menu__item" href="/lounge" role="menuitem" on:click={closeUserMenu}><i class="bi bi-chat-square-heart" aria-hidden="true"></i><em>Culture Lounge</em></a>
            {/if}
            {#if user.username}
              <a class="user-menu__item" href="/@{encodeURIComponent(user.username)}" role="menuitem" on:click={closeUserMenu}><i class="bi bi-person" aria-hidden="true"></i>Profil publik</a>
            {/if}
            <hr class="user-menu__sep" />
            <form method="POST" action="/auth/logout">
              <button type="submit" class="user-menu__item user-menu__item--out" role="menuitem"><i class="bi bi-box-arrow-right" aria-hidden="true"></i>Keluar</button>
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
        {@render burger()}
        {@render brand()}
        {@render sections('navbar-sections-nav--inline')}
        {@render actions('d-none d-lg-flex')}
      </div>
    </div>

  {:else if variant === 'masthead'}
    <div class="navbar-brand-bar navbar-brand-bar--masthead">
      <div class="container-xl">
        <div class="navbar-masthead__top">
          {@render burger()}
          {@render actions('d-none d-lg-flex')}
        </div>
        <div class="navbar-masthead__brand">
          {@render brand()}
        </div>
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
        {@render burger()}
        {@render brand()}
        {@render actions('d-none d-lg-flex')}
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
  {#if menuOpen}
    <div class="sheet-backdrop" on:click={closeMenu} on:keydown role="presentation" aria-hidden="true"></div>
  {/if}

  <!-- Mobile menu: a bottom sheet in the house dark panel. -->
  <div
    class="sheet"
    class:is-open={menuOpen}
    role="dialog"
    aria-modal="true"
    aria-labelledby="sheet-title"
    tabindex="-1"
    inert={!menuOpen}
    aria-hidden={!menuOpen}
    on:keydown={onSheetKey}
  >
    <div class="sheet__grip" aria-hidden="true"></div>
    <div class="sheet__head">
      <h2 id="sheet-title">Menu</h2>
      <button type="button" class="sheet__close" bind:this={sheetClose} on:click={closeMenu} aria-label="Tutup menu"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
    </div>

    <div class="sheet__body">
      <button type="button" class="sheet__search" on:click={searchFromSheet}>
        <span>Cari artikel, topik, atau penulis…</span>
        <i class="bi bi-search" aria-hidden="true"></i>
      </button>

      <div class="sheet__account">
        {#if user}
          <a href="/dashboard" class="sheet__me" on:click={closeMenu}>
            <span class="sheet__avatar" aria-hidden="true">
              {#if user.img}<img src={avatarUrl(user.img)} alt="" />{:else}{initials(user.name)}{/if}
            </span>
            <span class="sheet__me-text">
              <strong>{user.name}</strong>
              <small>{user.username ? `@${user.username}` : 'Ruang pribadimu'}</small>
            </span>
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </a>
          <ul class="sheet__shortcuts">
            <li><a href="/dashboard" on:click={closeMenu}><i class="bi bi-stars" aria-hidden="true"></i>Untuk Kamu</a></li>
            <li><a href="/dashboard/tersimpan" on:click={closeMenu}><i class="bi bi-bookmark" aria-hidden="true"></i>Tersimpan</a></li>
            <li><a href="/dashboard/riwayat" on:click={closeMenu}><i class="bi bi-clock-history" aria-hidden="true"></i>Riwayat</a></li>
            <li><a href="/dashboard/account" on:click={closeMenu}><i class="bi bi-gear" aria-hidden="true"></i>Pengaturan</a></li>
          </ul>
          <form method="POST" action="/auth/logout">
            <button type="submit" class="sheet__logout"><i class="bi bi-box-arrow-right" aria-hidden="true"></i> Keluar</button>
          </form>
        {:else}
          <p>{LOUNGE_ENABLED ? 'Masuk untuk ikut Culture Lounge, menyimpan artikel, dan dapat rekomendasi.' : 'Masuk untuk menyimpan artikel dan dapat rekomendasi Untuk Kamu.'}</p>
          <div class="sheet__cta">
            <a href={LOUNGE_ENABLED ? '/auth/login?redirect=/lounge' : '/auth/login'} class="sheet__btn sheet__btn--primary" on:click={closeMenu}><i class="bi bi-box-arrow-in-right" aria-hidden="true"></i> Masuk</a>
            <a href="/auth/register" class="sheet__btn sheet__btn--ghost" on:click={closeMenu}>Daftar</a>
          </div>
        {/if}
      </div>

      <section class="sheet__group" aria-labelledby="sheet-sections">
        <h3 id="sheet-sections">Rubrik</h3>
        <ul class="sheet__nav">
          {#each sectionLinks as link (link.href)}
            <li><a href={link.href} class:is-active={isActive(link.href, currentPath)} aria-current={isActive(link.href, currentPath) ? 'page' : undefined} on:click={closeMenu}>{link.label}</a></li>
          {/each}
          {#if LOUNGE_ENABLED}
            <li class="sheet__nav-wide-item"><a href="/lounge" class="sheet__nav-wide" class:is-active={isActive('/lounge', currentPath)} on:click={closeMenu}><i class="bi bi-stars" aria-hidden="true"></i> <em>Culture Lounge</em></a></li>
          {/if}
        </ul>
      </section>

      <section class="sheet__group" aria-labelledby="sheet-more">
        <h3 id="sheet-more">Jelajahi juga</h3>
        <ul class="sheet__chips">
          {#each EXTRA_LINKS as link (link.href)}
            <li><a href={link.href} class:is-active={isActive(link.href, currentPath)} on:click={closeMenu}><i class="bi {link.icon}" aria-hidden="true"></i> {link.label}</a></li>
          {/each}
        </ul>
      </section>

      <div class="sheet__foot">
        {#if socials.length > 0}
          <div class="sheet__socials">
            {#each socials as s (s.id)}
              <a href={s.url} style:background={socialGradient(s.platform, s.icon)} title={s.platform} aria-label="{siteName} di {s.platform}" target="_blank" rel="noopener noreferrer">
                <i class="bi bi-{getIcon(s.platform, s.icon)}" aria-hidden="true"></i>
              </a>
            {/each}
          </div>
        {/if}
        <small>&copy;{year} {siteName}</small>
      </div>
    </div>
  </div>
{/if}
