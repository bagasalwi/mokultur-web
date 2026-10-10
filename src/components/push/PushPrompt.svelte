<script lang="ts">
  import { onMount } from 'svelte';
  import { consent } from '$lib/consent';
  import { disablePush, dismissedRecently, enablePush, pushState, rememberDismiss, type PushState } from '$lib/push';

  /**
   * 'card': a soft ask at the end of an article, shown only when push can work,
   * has not been answered, and the cookie banner is out of the way.
   * 'setting': an on/off row for the reader's account page.
   */
  export let variant: 'card' | 'setting' = 'card';

  let state: PushState = 'unsupported';
  let ready = false;
  let busy = false;
  let error = '';
  let hidden = false;

  onMount(async () => {
    state = await pushState();
    hidden = variant === 'card' && dismissedRecently();
    ready = true;
  });

  async function enable() {
    busy = true; error = '';
    try {
      state = await enablePush();
      if (state === 'denied') error = 'Izin notifikasi ditolak di browser. Ubah lewat pengaturan situs di browser kalau berubah pikiran.';
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : '';
      // Browser-level refusals (private/incognito windows, blocked push service) read as gibberish; say what to do instead.
      error = /permission denied|incognito|push service|AbortError|not supported/i.test(text)
        ? 'Browser ini belum bisa menerima notifikasi (misalnya di mode penyamaran). Coba dari jendela browser biasa.'
        : text || 'Gagal mengaktifkan notifikasi.';
    } finally { busy = false; }
  }

  async function disable() {
    busy = true; error = '';
    try { state = await disablePush(); } finally { busy = false; }
  }

  function later() {
    rememberDismiss();
    hidden = true;
  }

  $: showCard = ready && !hidden && $consent !== null && state === 'available';
</script>

{#if variant === 'card'}
  {#if showCard}
    <aside class="push-card" aria-label="Notifikasi berita">
      <span class="push-card__icon" aria-hidden="true"><i class="bi bi-bell-fill"></i></span>
      <div class="push-card__text">
        <p class="push-card__title">Dapat kabar penting duluan</p>
        <p>Hasil pertandingan dan berita besar langsung muncul di perangkatmu. Bisa dimatikan kapan saja.</p>
        {#if error}<p class="push-card__error" role="alert">{error}</p>{/if}
      </div>
      <div class="push-card__actions">
        <button type="button" class="push-btn" on:click={enable} disabled={busy}>{busy ? 'Mengaktifkan…' : 'Aktifkan notifikasi'}</button>
        <button type="button" class="push-later" on:click={later}>Nanti</button>
      </div>
    </aside>
  {/if}
{:else if ready}
  <div class="push-setting">
    <div>
      <strong>Notifikasi push</strong>
      <p>
        {#if state === 'subscribed'}Aktif di perangkat ini. Kamu akan menerima berita penting dan hasil pertandingan.
        {:else if state === 'denied'}Diblokir oleh browser. Izinkan notifikasi untuk mokultur.com di pengaturan situs browser.
        {:else if state === 'unsupported'}Browser ini belum mendukung notifikasi. Di iPhone, tambahkan Mokultur ke Layar Utama dulu.
        {:else}Belum aktif di perangkat ini.{/if}
      </p>
      {#if error}<p class="push-card__error" role="alert">{error}</p>{/if}
    </div>
    {#if state === 'subscribed'}
      <button type="button" class="push-later push-later--outline" on:click={disable} disabled={busy}>{busy ? 'Memproses…' : 'Matikan'}</button>
    {:else if state === 'available'}
      <button type="button" class="push-btn" on:click={enable} disabled={busy}>{busy ? 'Mengaktifkan…' : 'Aktifkan'}</button>
    {/if}
  </div>
{/if}

<style>
  .push-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0 0;
    padding: 1rem 1.1rem;
    border-radius: 16px;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #f1ff32) 26%, transparent), transparent 45%),
      linear-gradient(135deg, var(--site-dark, #0d0d0d), #101827 60%, #1f2937);
  }
  .push-card__icon { display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; border-radius: 12px; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); font-size: 1.1rem; }
  .push-card__text { flex: 1; min-width: 0; }
  .push-card__text p { margin: 0; color: rgba(255, 255, 255, 0.78); font-size: 0.8125rem; line-height: 1.5; }
  .push-card__text .push-card__title { margin-bottom: 0.15rem; color: #fff; font-size: 0.9375rem; font-weight: 800; }
  .push-card__error { margin-top: 0.35rem !important; color: #fca5a5 !important; }
  .push-card__actions { display: flex; flex-direction: column; align-items: stretch; gap: 0.35rem; flex: none; }
  .push-btn { min-height: 40px; padding: 0 1rem; border: 0; border-radius: 999px; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); font-size: 0.8125rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
  .push-btn:hover { background: #fff; }
  .push-btn:disabled { opacity: 0.7; cursor: wait; }
  .push-later { min-height: 32px; border: 0; background: none; color: rgba(255, 255, 255, 0.75); font-size: 0.8125rem; font-weight: 700; cursor: pointer; }
  .push-later:hover { color: #fff; text-decoration: underline; }
  .push-card :is(button):focus-visible, .push-setting :is(button):focus-visible { outline: 3px solid var(--site-primary, #f1ff32); outline-offset: 2px; }

  .push-setting { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .push-setting strong { font-size: 0.9375rem; }
  .push-setting p { margin: 0.2rem 0 0; color: #6b7280; font-size: 0.8125rem; line-height: 1.5; }
  .push-setting .push-btn:hover { background: var(--site-dark, #111); color: #fff; }
  .push-later--outline { min-height: 40px; padding: 0 1rem; border: 1px solid #d1d5db; border-radius: 999px; color: #111; }
  .push-later--outline:hover { border-color: #111; color: #111; text-decoration: none; }

  @media (max-width: 575px) {
    .push-card { flex-wrap: wrap; }
    .push-card__text { flex-basis: calc(100% - 60px); }
    .push-card__actions { flex: 1 1 100%; flex-direction: row; }
    .push-card__actions .push-btn { flex: 1; }
  }
</style>
