<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { avatarUrl, initials, roleLabel } from '$lib/user';
  import BottomNav from '$components/dashboard/BottomNav.svelte';
  import InterestEditor from '$components/dashboard/InterestEditor.svelte';

  export let data;

  $: profile = data.profile;
  $: firstName = (profile.name ?? '').split(/\s+/)[0] || 'Pembaca';
  $: interestLabels = data.availableInterests
    .filter((interest) => data.interests.includes(interest.id))
    .map((interest) => interest.label);
  $: current = $page.url.pathname;

  let editing = false;

  $: tabs = [
    { href: '/dashboard', label: 'Untuk Kamu', icon: 'bi-stars', count: null as number | null, show: true },
    { href: '/dashboard/tersimpan', label: 'Tersimpan', icon: 'bi-bookmark', count: data.savedTotal, show: true },
    { href: '/dashboard/riwayat', label: 'Riwayat', icon: 'bi-clock-history', count: null, show: true },
    { href: '/dashboard/aktivitas', label: 'Aktivitas', icon: 'bi-lightning-charge', count: null, show: true },
    { href: '/dashboard/artikel', label: 'Artikel Saya', icon: 'bi-file-text', count: null, show: profile.canWrite },
    { href: '/dashboard/account', label: 'Pengaturan', icon: 'bi-gear', count: null, show: true },
  ].filter((tab) => tab.show);

  const isActive = (href: string, path: string) => (href === '/dashboard' ? path === href : path.startsWith(href));

  $: bottomNav = [
    { href: '/dashboard', label: 'Untuk Kamu', icon: 'bi-stars' },
    { href: '/dashboard/tersimpan', label: 'Tersimpan', icon: 'bi-bookmark' },
    { href: '/dashboard/riwayat', label: 'Riwayat', icon: 'bi-clock-history' },
    ...(profile.canWrite ? [{ href: '/dashboard/artikel', label: 'Artikel', icon: 'bi-file-text' }] : []),
    { href: '/dashboard/account', label: 'Akun', icon: 'bi-person-gear' },
  ];

  /*
   * Tells the rest of the app a bottom bar is present, so the floating chat
   * button can lift clear of it. Set on <body> so it goes away the moment we
   * navigate out of the dashboard.
   */
  onMount(() => document.body.classList.add('has-bottom-nav'));
  onDestroy(() => {
    if (typeof document !== 'undefined') document.body.classList.remove('has-bottom-nav');
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<header class="me-hero">
  <div class="container-xl">
    <div class="me-hero__top">
      <div class="me-hero__who">
        {#if profile.img}
          <img class="me-hero__avatar" src={avatarUrl(profile.img)} alt="" width="56" height="56" />
        {:else}
          <span class="me-hero__avatar me-hero__avatar--text" aria-hidden="true">{initials(profile.name)}</span>
        {/if}
        <div class="me-hero__text">
          <h1>Halo, {firstName}!</h1>
          <p>
            {#if profile.username}<span>@{profile.username}</span>{/if}
            <span class="me-hero__role">{roleLabel(profile.roleName)}</span>
            {#if profile.isVerified}<span class="me-hero__verified"><i class="bi bi-patch-check-fill" aria-hidden="true"></i> Terverifikasi</span>{/if}
          </p>
        </div>
      </div>
      <div class="me-hero__actions">
        {#if profile.username}
          <a class="theme-btn theme-btn--see-all theme-btn--on-dark theme-btn--sm" href="/@{profile.username}">Profil publik <i class="bi bi-arrow-up-right" aria-hidden="true"></i></a>
        {/if}
      </div>
    </div>

    <div class="me-hero__interests">
      <span class="me-hero__label">Minatmu</span>
      {#if interestLabels.length}
        <ul>{#each interestLabels as label}<li>{label}</li>{/each}</ul>
      {:else}
        <span class="me-hero__empty">Belum dipilih — feed masih berisi bacaan terbaru.</span>
      {/if}
      <button type="button" class="theme-btn theme-btn--primary theme-btn--sm" aria-expanded={editing} on:click={() => (editing = !editing)}>
        <i class="bi bi-sliders" aria-hidden="true"></i> {interestLabels.length ? 'Ubah minat' : 'Pilih minat'}
      </button>
    </div>
  </div>
</header>

{#if editing}
  <div class="container-xl me-editor">
    <InterestEditor interests={data.interests} availableInterests={data.availableInterests} on:done={() => (editing = false)} />
  </div>
{/if}

<nav class="me-tabs" aria-label="Ruang personal">
  <div class="container-xl">
    <ul>
      {#each tabs as tab}
        <li>
          <a href={tab.href} class:is-active={isActive(tab.href, current)} aria-current={isActive(tab.href, current) ? 'page' : undefined}>
            <i class="bi {tab.icon}" aria-hidden="true"></i>
            {tab.label}
            {#if tab.count}<span class="me-tabs__count">{tab.count}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</nav>

<div class="container-xl me-main">
  <slot />
</div>

<BottomNav items={bottomNav} />

<style>
  .me-hero {
    position: relative;
    padding: 1.5rem 0 1.1rem;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 70%, transparent), transparent 32%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #101827 55%, #1f2937 100%);
  }
  .me-hero__top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem 1.5rem; }
  .me-hero__who { display: flex; align-items: center; gap: 1rem; min-width: 0; }
  .me-hero__avatar {
    flex: 0 0 56px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--site-primary, #f1ff32);
  }
  .me-hero__avatar--text {
    display: grid;
    place-items: center;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
    font-size: 1.125rem;
    font-weight: 900;
  }
  .me-hero__text { min-width: 0; }
  .me-hero__text h1 { margin: 0; font-size: clamp(1.25rem, 2.2vw, 1.625rem); font-weight: 800; letter-spacing: -0.02em; color: #fff; }
  .me-hero__text p { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 0.75rem; margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.72); font-size: 0.8125rem; }
  .me-hero__role {
    padding: 0.1rem 0.55rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
  }
  .me-hero__verified { color: var(--site-primary, #f1ff32); font-weight: 700; font-size: 0.75rem; }
  .me-hero__actions { display: flex; gap: 0.5rem; }

  .me-hero__interests {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem 0.75rem;
    margin-top: 1.1rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .me-hero__label { font-size: 0.75rem; font-weight: 700; color: rgba(255, 255, 255, 0.72); }
  .me-hero__interests ul { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .me-hero__interests li {
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .me-hero__empty { font-size: 0.8125rem; color: rgba(255, 255, 255, 0.72); }
  .me-hero__interests .theme-btn { margin-left: auto; box-shadow: none; }

  .me-editor { margin-top: 1.25rem; }

  .me-tabs {
    position: sticky;
    top: 0;
    z-index: 5;
    background: #fff;
    border-bottom: 1px solid #ececec;
  }
  .me-tabs ul {
    display: flex;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .me-tabs ul::-webkit-scrollbar { display: none; }
  .me-tabs a {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    padding: 0 0.7rem;
    color: #4b5563;
    font-size: 0.8125rem;
    font-weight: 700;
    white-space: nowrap;
    text-decoration: none;
    transition: color 160ms ease;
  }
  .me-tabs a::after {
    content: '';
    position: absolute;
    left: 0.7rem;
    right: 0.7rem;
    bottom: -1px;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: transparent;
    transition: background-color 160ms ease;
  }
  .me-tabs a:hover { color: #1a1a1a; }
  .me-tabs a.is-active { color: #1a1a1a; }
  .me-tabs a.is-active::after { background: var(--site-primary, #f1ff32); }
  .me-tabs a.is-active i { color: #1a1a1a; }
  .me-tabs a:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: -3px; border-radius: 8px; }
  .me-tabs__count {
    min-width: 1.25rem;
    padding: 0 0.35rem;
    border-radius: 999px;
    background: #f3f4f6;
    color: #1a1a1a;
    font-size: 0.6875rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .me-main { padding-top: 1.5rem; padding-bottom: 3rem; }

  @media (max-width: 575px) {
    .me-hero { padding: 1.25rem 0 1rem; }
    .me-hero__avatar { flex-basis: 48px; width: 48px; height: 48px; }
    .me-hero__interests .theme-btn { margin-left: 0; }
    .me-main { padding-top: 1.25rem; }
  }
</style>
