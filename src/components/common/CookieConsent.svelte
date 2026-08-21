<script lang="ts">
  import { onMount } from 'svelte';
  import { consent, saveConsent, ALLOW_ALL, DENY_ALL } from '$lib/consent';

  let mounted = false;
  let showPrefs = false;
  let analytics = false;
  let ads = false;

  // Rendering server-side would flash the banner at visitors who already chose,
  // since the store only reads document.cookie in the browser.
  onMount(() => {
    mounted = true;
  });

  $: visible = mounted && $consent === null;

  function acceptAll() {
    saveConsent(ALLOW_ALL);
  }

  function rejectAll() {
    saveConsent(DENY_ALL);
  }

  function savePrefs() {
    saveConsent({ analytics, ads, v: 1 });
  }
</script>

{#if visible}
  <div
    class="cookie-consent"
    role="dialog"
    aria-modal="false"
    aria-labelledby="cookie-consent-title"
  >
    <div class="cookie-consent__inner">
      <div class="cookie-consent__text">
        <h2 id="cookie-consent-title" class="cookie-consent__title">🍪 Kami menggunakan cookie</h2>
        <p class="cookie-consent__desc">
          Cookie esensial dipakai untuk menjaga sesi login Anda dan selalu aktif. Untuk cookie
          analitik dan iklan, kami membutuhkan persetujuan Anda terlebih dahulu. Selengkapnya di
          <a href="/page/2/privacy-policy">Kebijakan Privasi</a>.
        </p>

        {#if showPrefs}
          <div class="cookie-consent__prefs">
            <label class="cookie-consent__option cookie-consent__option--locked">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Esensial</strong>
                <small>Sesi login dan keamanan. Tidak dapat dinonaktifkan.</small>
              </span>
            </label>
            <label class="cookie-consent__option">
              <input type="checkbox" bind:checked={analytics} />
              <span>
                <strong>Analitik</strong>
                <small>Mengukur statistik kunjungan secara agregat.</small>
              </span>
            </label>
            <label class="cookie-consent__option">
              <input type="checkbox" bind:checked={ads} />
              <span>
                <strong>Iklan</strong>
                <small>Menampilkan iklan yang lebih relevan.</small>
              </span>
            </label>
          </div>
        {/if}
      </div>

      <div class="cookie-consent__actions">
        {#if showPrefs}
          <button type="button" class="cc-btn cc-btn--primary" on:click={savePrefs}>
            Simpan pilihan
          </button>
        {:else}
          <button type="button" class="cc-btn cc-btn--ghost" on:click={() => (showPrefs = true)}>
            Atur preferensi
          </button>
        {/if}
        <button type="button" class="cc-btn cc-btn--ghost" on:click={rejectAll}>
          Hanya esensial
        </button>
        <button type="button" class="cc-btn cc-btn--primary" on:click={acceptAll}>
          Terima semua
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .cookie-consent {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1080;
    padding: 0.75rem;
    animation: cc-rise 0.25s ease-out;
  }

  .cookie-consent__inner {
    max-width: 1140px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 1.5rem;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-radius: 14px;
    background: var(--site-dark, #0a0a0a);
    color: #fff;
    border: 1px solid rgb(255 255 255 / 12%);
    box-shadow: 0 12px 40px rgb(0 0 0 / 35%);
  }

  .cookie-consent__text {
    flex: 1 1 22rem;
    min-width: 0;
  }

  .cookie-consent__title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
  }

  .cookie-consent__desc {
    font-size: 0.85rem;
    line-height: 1.5;
    margin: 0;
    color: rgb(255 255 255 / 78%);
  }

  .cookie-consent__desc a {
    color: var(--site-primary, #f1ff32);
    text-decoration: underline;
  }

  .cookie-consent__prefs {
    display: grid;
    gap: 0.5rem;
    margin-top: 0.85rem;
  }

  .cookie-consent__option {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .cookie-consent__option--locked {
    cursor: default;
    opacity: 0.7;
  }

  .cookie-consent__option input {
    margin-top: 0.2rem;
    accent-color: var(--site-primary, #f1ff32);
    flex: none;
  }

  .cookie-consent__option small {
    display: block;
    color: rgb(255 255 255 / 62%);
  }

  .cookie-consent__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    flex: 0 1 auto;
  }

  .cc-btn {
    border-radius: 999px;
    padding: 0.5rem 1.1rem;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: filter 0.15s ease, background-color 0.15s ease;
  }

  .cc-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #000);
  }

  .cc-btn--primary:hover {
    filter: brightness(0.92);
  }

  .cc-btn--ghost {
    background: transparent;
    color: #fff;
    border-color: rgb(255 255 255 / 28%);
  }

  .cc-btn--ghost:hover {
    background: rgb(255 255 255 / 10%);
  }

  .cc-btn:focus-visible {
    outline: 2px solid var(--site-primary, #f1ff32);
    outline-offset: 2px;
  }

  @keyframes cc-rise {
    from {
      transform: translateY(12px);
      opacity: 0;
    }
  }

  @media (max-width: 575.98px) {
    .cookie-consent__actions {
      width: 100%;
    }

    .cc-btn {
      flex: 1 1 auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cookie-consent {
      animation: none;
    }
  }
</style>
