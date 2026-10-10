<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import { afterNavigate, replaceState } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { AUTH_MESSAGES, authMessage } from '$lib/auth-messages';
  import { authModal, closeAuth, openAuth, type AuthMode } from '$lib/stores/auth-modal';

  export let siteName = 'Mokultur';
  export let logo: string | null = null;

  let dialog: HTMLDialogElement;
  let pending = false;
  let showPassword = false;
  let previousOverflow = '';
  let previousFocus: HTMLElement | null = null;

  /*
   * Server-rendered open when the URL asks for it (`?auth=login`), so the form
   * still works with JavaScript off: a plain <dialog open> is just a visible box.
   */
  /*
   * Without JavaScript the dialog is shown by CSS (see .auth-modal--ssr) rather
   * than an `open` attribute: Svelte re-applies attributes on update, and
   * toggling `open` on a modal dialog shuts it without a close event.
   */
  const ssrOpen = ['login', 'register'].includes(get(page).url.searchParams.get('auth') ?? '');
  $: mode = $authModal.open ? $authModal.mode : (($page.url.searchParams.get('auth') as AuthMode) ?? 'login');
  $: redirectTo = $authModal.open ? $authModal.redirect : ($page.url.searchParams.get('redirect') ?? '/');
  $: error = $authModal.open ? $authModal.error : authMessage($page.url.searchParams.get('auth_error'));
  $: googleHref = `${PUBLIC_API_URL.replace(/\/$/, '')}/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`;

  function setMode(next: AuthMode) {
    authModal.update((state) => ({ ...state, mode: next, error: null }));
    showPassword = false;
  }

  async function sync(open: boolean) {
    if (!dialog) return;
    if (open && !dialog.open) {
      previousFocus = document.activeElement as HTMLElement | null;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      dialog.showModal();
      await tick();
      dialog.querySelector<HTMLInputElement>('input:not([type=hidden])')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }
  $: sync($authModal.open);

  function onClose() {
    document.documentElement.style.overflow = previousOverflow;
    previousFocus?.focus?.();
    if ($authModal.open) closeAuth();
  }

  // A click on the backdrop lands on the <dialog> element itself.
  function onBackdrop(event: MouseEvent) {
    if (event.target === dialog) closeAuth();
  }

  /*
   * Every "Masuk"/"Daftar" link on the site still points at /auth/login or
   * /auth/register (and still works without JS). With JS we open the modal in
   * place instead of navigating away.
   */
  function intercept(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link || link.target === '_blank') return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    const target = url.pathname.replace(/\/$/, '');
    if (target !== '/auth/login' && target !== '/auth/register') return;
    event.preventDefault();
    openAuth(target === '/auth/register' ? 'register' : 'login', url.searchParams.get('redirect'));
  }

  /** `?auth=login|register` (from a server redirect or a shared link) opens the modal, then leaves the URL. */
  function openFromUrl(url: URL) {
    const params = url.searchParams;
    const requested = params.get('auth');
    if (requested === 'login' || requested === 'register') {
      openAuth(requested, params.get('redirect'), authMessage(params.get('auth_error')));
      const clean = new URL(url);
      ['auth', 'redirect', 'auth_error'].forEach((key) => clean.searchParams.delete(key));
      const tidy = () => replaceState(`${clean.pathname}${clean.search}${clean.hash}`, {});
      // The router may not be ready during the very first mount.
      try { tidy(); } catch { setTimeout(() => { try { tidy(); } catch { /* cosmetic only */ } }, 0); }
    }
  }

  onMount(() => {
    // Capture phase: SvelteKit's own link handler would otherwise navigate first.
    document.addEventListener('click', intercept, true);
    dialog.dataset.hydrated = '1';
    openFromUrl($page.url);
  });

  // Client-side navigations (e.g. a server redirect to `/?auth=login`) don't remount the layout.
  afterNavigate(({ to, type }) => {
    if (type !== 'enter' && to?.url) openFromUrl(to.url);
  });

  onDestroy(() => {
    if (typeof document === 'undefined') return;
    document.removeEventListener('click', intercept, true);
    document.documentElement.style.overflow = previousOverflow;
  });

  const submit: SubmitFunction = () => {
    pending = true;
    authModal.update((state) => ({ ...state, error: null }));
    return async ({ result }) => {
      pending = false;
      if (result.type === 'redirect') {
        closeAuth();
        // A full load, not a client-side goto: every cached guest view (page
        // data, preloaded links, components) is replaced by the signed-in one.
        window.location.assign(result.location);
      } else if (result.type === 'failure') {
        const message = (result.data?.error as string | undefined) ?? AUTH_MESSAGES.busy;
        authModal.update((state) => ({ ...state, error: message }));
      } else if (result.type === 'error') {
        authModal.update((state) => ({ ...state, error: AUTH_MESSAGES.busy }));
      }
    };
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  class="auth-modal"
  class:auth-modal--ssr={ssrOpen}
  aria-labelledby="auth-modal-title"
  on:close={onClose}
  on:click={onBackdrop}
>
  <div class="auth-modal__frame">
    <button type="button" class="auth-modal__close" aria-label="Tutup" on:click={closeAuth}><i class="bi bi-x-lg" aria-hidden="true"></i></button>
    <aside class="auth-modal__brand" aria-hidden="true">
      {#if logo}<img class="auth-modal__logo" src={logo} alt="" />{:else}<strong class="auth-modal__wordmark">{siteName}</strong>{/if}
      <p class="auth-modal__pitch">Ruang bacamu sendiri di {siteName}.</p>
      <ul class="auth-modal__perks">
        <li><i class="bi bi-bookmark-heart"></i> Simpan artikel untuk dibaca nanti</li>
        <li><i class="bi bi-stars"></i> Feed yang mengikuti minatmu</li>
        <li><i class="bi bi-clock-history"></i> Lanjutkan bacaan terakhirmu</li>
        <li><i class="bi bi-chat-dots"></i> Ikut diskusi di kolom komentar</li>
      </ul>
    </aside>

    <div class="auth-modal__body">
      <div class="auth-modal__tabs" role="tablist" aria-label="Masuk atau daftar">
        <button type="button" role="tab" aria-selected={mode === 'login'} class:is-active={mode === 'login'} on:click={() => setMode('login')}>Masuk</button>
        <button type="button" role="tab" aria-selected={mode === 'register'} class:is-active={mode === 'register'} on:click={() => setMode('register')}>Daftar</button>
      </div>

      <h2 id="auth-modal-title" class="auth-modal__title">
        {mode === 'login' ? `Selamat datang kembali` : `Gabung ${siteName}`}
      </h2>
      <p class="auth-modal__hint">
        {mode === 'login' ? 'Masuk untuk membuka bacaan dan artikel simpananmu.' : 'Gratis, cukup satu menit. Minatmu langsung membentuk feed-mu.'}
      </p>

      <a class="auth-modal__google" href={googleHref}>
        <svg viewBox="0 0 48 48" aria-hidden="true" width="18" height="18"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {mode === 'login' ? 'Lanjutkan dengan Google' : 'Daftar dengan Google'}
      </a>

      <div class="auth-modal__divider"><span>atau pakai email</span></div>

      {#if error}<p class="auth-modal__error" role="alert"><i class="bi bi-exclamation-circle" aria-hidden="true"></i>{error}</p>{/if}

      {#if mode === 'login'}
        <form method="POST" action="/auth/login" use:enhance={submit} class="auth-modal__form">
          <input type="hidden" name="redirect" value={redirectTo} />
          <label class="auth-modal__field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required placeholder="nama@email.com" />
          </label>
          <label class="auth-modal__field">
            <span>Password</span>
            <span class="auth-modal__password">
              <input name="password" type={showPassword ? 'text' : 'password'} autocomplete="current-password" required minlength="8" />
              <button type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword} on:click={() => (showPassword = !showPassword)}>
                <i class="bi {showPassword ? 'bi-eye-slash' : 'bi-eye'}" aria-hidden="true"></i>
              </button>
            </span>
          </label>
          <button class="auth-modal__submit theme-btn theme-btn--primary" type="submit" disabled={pending}>
            {pending ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
        <p class="auth-modal__switch">Belum punya akun? <button type="button" on:click={() => setMode('register')}>Daftar gratis</button></p>
      {:else}
        <form method="POST" action="/auth/register" use:enhance={submit} class="auth-modal__form">
          <input type="hidden" name="redirect" value={redirectTo} />
          <label class="auth-modal__field">
            <span>Nama</span>
            <input name="name" type="text" autocomplete="name" required minlength="2" maxlength="80" />
          </label>
          <label class="auth-modal__field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required placeholder="nama@email.com" />
          </label>
          <div class="auth-modal__row">
            <label class="auth-modal__field">
              <span>Password</span>
              <input name="password" type={showPassword ? 'text' : 'password'} autocomplete="new-password" required minlength="8" />
            </label>
            <label class="auth-modal__field">
              <span>Ulangi password</span>
              <input name="password_confirm" type={showPassword ? 'text' : 'password'} autocomplete="new-password" required minlength="8" />
            </label>
          </div>
          <label class="auth-modal__check">
            <input type="checkbox" bind:checked={showPassword} /> Tampilkan password
          </label>
          <button class="auth-modal__submit theme-btn theme-btn--primary" type="submit" disabled={pending}>
            {pending ? 'Membuat akun…' : 'Buat akun'}
          </button>
        </form>
        <p class="auth-modal__switch">Sudah punya akun? <button type="button" on:click={() => setMode('login')}>Masuk</button></p>
      {/if}
    </div>
  </div>
</dialog>

<style>
  .auth-modal {
    width: min(880px, calc(100vw - 2rem));
    max-width: none;
    max-height: calc(100dvh - 2rem);
    padding: 0;
    border: 0;
    border-radius: 24px;
    background: #fff;
    color: #1a1a1a;
    box-shadow: 0 32px 80px rgba(10, 10, 10, 0.35);
    overflow: hidden;
  }
  .auth-modal[open] { animation: auth-in 260ms cubic-bezier(0.16, 1, 0.3, 1); }
  .auth-modal::backdrop { background: rgba(10, 10, 10, 0.62); }
  /* No-JS copy (`?auth=login` in the URL): shown as a plain fixed box. */
  .auth-modal--ssr:not([data-hydrated]) { display: block; position: fixed; inset: 0; margin: auto; z-index: 1100; height: fit-content; }

  .auth-modal__frame { position: relative; display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr); max-height: inherit; }

  .auth-modal__brand {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 2.25rem 2rem;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 75%, transparent), transparent 45%),
      radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--site-primary, #f1ff32) 22%, transparent), transparent 40%),
      linear-gradient(150deg, var(--site-dark, #0a0a0a) 0%, #101827 55%, #1f2937 100%);
  }
  .auth-modal__logo { height: 40px; width: auto; align-self: flex-start; }
  .auth-modal__wordmark { font-size: 1.5rem; font-weight: 900; color: var(--site-primary, #f1ff32); }
  .auth-modal__pitch {
    margin: auto 0 0;
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }
  .auth-modal__perks { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
  .auth-modal__perks li { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9375rem; color: rgba(255, 255, 255, 0.85); }
  .auth-modal__perks i {
    display: inline-grid;
    place-items: center;
    flex: 0 0 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--site-primary, #f1ff32);
    font-size: 1rem;
  }

  .auth-modal__body { position: relative; padding: 2rem 2.25rem 1.75rem; overflow-y: auto; max-height: calc(100dvh - 2rem); }
  .auth-modal__close {
    position: absolute;
    z-index: 2;
    top: 1rem;
    right: 1rem;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: #f3f4f6;
    color: #1a1a1a;
    transition: background-color 160ms ease;
  }
  .auth-modal__close:hover { background: #e5e7eb; }

  .auth-modal__tabs {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 999px;
    background: #f3f4f6;
    margin-bottom: 1.25rem;
  }
  .auth-modal__tabs button {
    min-height: 36px;
    padding: 0 1.1rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #4b5563;
    font-size: 0.875rem;
    font-weight: 700;
    transition: background-color 160ms ease, color 160ms ease;
  }
  .auth-modal__tabs button.is-active { background: var(--site-dark, #111); color: #fff; }

  .auth-modal__title { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
  .auth-modal__hint { margin: 0.35rem 0 1.25rem; color: #6b7280; font-size: 0.9rem; }

  .auth-modal__google {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-height: 46px;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    background: #fff;
    color: #1a1a1a;
    font-weight: 700;
    font-size: 0.9375rem;
    text-decoration: none;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .auth-modal__google:hover { border-color: var(--site-dark, #111); background: #fafafa; color: #1a1a1a; }

  .auth-modal__divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.1rem 0; color: #9ca3af; font-size: 0.75rem; }
  .auth-modal__divider::before,
  .auth-modal__divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }

  .auth-modal__error {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0 0 1rem;
    padding: 0.7rem 0.85rem;
    border-radius: 12px;
    background: #fef2f2;
    color: #991b1b;
    font-size: 0.875rem;
  }

  .auth-modal__form { display: grid; gap: 0.85rem; }
  .auth-modal__row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .auth-modal__field { display: grid; gap: 0.35rem; min-width: 0; }
  .auth-modal__field > span:first-child { font-size: 0.8125rem; font-weight: 700; color: #374151; }
  .auth-modal__field input {
    width: 100%;
    min-height: 46px;
    padding: 0 0.9rem;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    background: #fff;
    color: #1a1a1a;
    font-size: 1rem;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }
  .auth-modal__field input:focus {
    outline: none;
    border-color: var(--site-dark, #111);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-primary, #f1ff32) 55%, transparent);
  }
  .auth-modal__password { position: relative; display: block; }
  .auth-modal__password input { padding-right: 3rem; }
  .auth-modal__password button {
    position: absolute;
    top: 50%;
    right: 0.35rem;
    transform: translateY(-50%);
    width: 38px;
    height: 38px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #6b7280;
  }
  .auth-modal__check { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #4b5563; }
  .auth-modal__check input { width: 16px; height: 16px; accent-color: var(--site-dark, #111); }

  .auth-modal__submit { width: 100%; min-height: 48px; margin-top: 0.25rem; justify-content: center; font-size: 0.9375rem; }
  .auth-modal__submit:disabled { opacity: 0.7; cursor: progress; }

  .auth-modal__switch { margin: 1rem 0 0; text-align: center; font-size: 0.875rem; color: #6b7280; }
  .auth-modal__switch button {
    padding: 0;
    border: 0;
    background: none;
    color: var(--site-dark, #111);
    font-weight: 800;
    text-decoration: underline;
    text-decoration-color: var(--site-primary, #f1ff32);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  .auth-modal :is(button, a):focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  @keyframes auth-in {
    from { opacity: 0; transform: translateY(12px) scale(0.985); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) { .auth-modal[open] { animation: none; } }

  /* Phones: a bottom sheet, brand panel reduced to a strip above the form. */
  @media (max-width: 767px) {
    .auth-modal {
      width: 100vw;
      max-height: 94dvh;
      margin: auto 0 0;
      border-radius: 22px 22px 0 0;
    }
    .auth-modal[open] { animation-name: auth-up; }
    .auth-modal__frame { grid-template-columns: 1fr; }
    .auth-modal__brand { flex-direction: row; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; }
    .auth-modal__logo { height: 28px; }
    .auth-modal__pitch { margin: 0; font-size: 0.9375rem; font-weight: 700; }
    .auth-modal__perks { display: none; }
    .auth-modal__body { padding: 1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom)); max-height: calc(94dvh - 64px); }
    .auth-modal__close { top: 0.85rem; right: 0.85rem; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.14); color: #fff; }
    .auth-modal__brand { padding-right: 3.75rem; }
    .auth-modal__row { grid-template-columns: 1fr; }
  }
  @keyframes auth-up {
    from { transform: translateY(100%); }
    to { transform: none; }
  }
</style>
