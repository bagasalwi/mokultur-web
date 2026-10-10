<script lang="ts">
  import { PUBLIC_API_URL } from '$env/static/public';
  import SideCard from './SideCard.svelte';

  /** Weekly digest sign-up. 'card' for sidebars, 'footer' for the dark footer. */
  export let variant: 'card' | 'footer' = 'card';
  export let source = 'web';

  let email = '';
  let website = '';
  let status: 'idle' | 'sending' | 'done' | 'error' = 'idle';
  let message = '';
  const id = `nl-${Math.random().toString(36).slice(2, 8)}`;

  async function submit() {
    if (status === 'sending') return;
    status = 'sending'; message = '';
    try {
      const res = await fetch(`${PUBLIC_API_URL.replace(/\/$/, '')}/api/newsletter/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Gagal mendaftar. Coba lagi sebentar lagi.');
      status = 'done';
      message = `Cek inbox ${email} dan klik tautan konfirmasi. Kalau tidak ada, lihat folder Spam/Promosi.`;
    } catch (cause) {
      status = 'error';
      message = cause instanceof Error ? cause.message : 'Gagal mendaftar.';
    }
  }
</script>

{#snippet form()}
  {#if status === 'done'}
    <p class="nl-done" role="status"><i class="bi bi-envelope-check" aria-hidden="true"></i> {message}</p>
  {:else}
    <form class="nl-form" on:submit|preventDefault={submit}>
      <label class="visually-hidden" for="{id}-email">Alamat email</label>
      <input id="{id}-email" type="email" bind:value={email} required maxlength="191" placeholder="email@kamu.com" autocomplete="email" inputmode="email" />
      <!-- Honeypot for bots; hidden from people and screen readers. -->
      <input class="nl-hp" type="text" name="website" bind:value={website} tabindex="-1" autocomplete="off" aria-hidden="true" />
      <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Mengirim…' : 'Langganan'}</button>
    </form>
    {#if status === 'error'}<p class="nl-error" role="alert">{message}</p>{/if}
    <p class="nl-note">Gratis, setiap Senin pagi. Berhenti kapan saja lewat tautan di email.</p>
  {/if}
{/snippet}

{#if variant === 'card'}
  <SideCard title="Rangkuman mingguan" headingId="side-newsletter" lead="Berita anime, game, dan event yang paling banyak dibaca pekan itu, langsung ke inbox kamu.">
    {@render form()}
  </SideCard>
{:else}
  <div class="nl-footer">
    <p class="nl-footer__title">Rangkuman mingguan Mokultur</p>
    {@render form()}
  </div>
{/if}

<style>
  .nl-form { display: flex; gap: 0.4rem; }
  .nl-form input[type='email'] {
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 0.9rem;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    background: #fff;
    color: #111;
    font-size: 0.875rem;
  }
  .nl-form input[type='email']:focus { outline: none; border-color: var(--site-dark, #111); box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-primary, #f1ff32) 60%, transparent); }
  .nl-form button { flex: none; height: 44px; padding: 0 1rem; border: 0; border-radius: 999px; background: var(--site-dark, #111); color: #fff; font-size: 0.8125rem; font-weight: 800; cursor: pointer; }
  .nl-form button:hover { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .nl-form button:disabled { opacity: 0.7; cursor: wait; }
  .nl-form button:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .nl-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
  .nl-note { margin: 0.5rem 0 0; color: #6b7280; font-size: 0.75rem; }
  .nl-error { margin: 0.5rem 0 0; color: #b91c1c; font-size: 0.8125rem; }
  .nl-done { display: flex; gap: 0.5rem; margin: 0; padding: 0.75rem; border-radius: 12px; background: color-mix(in srgb, var(--site-primary, #f1ff32) 35%, #fff); color: #111; font-size: 0.8125rem; line-height: 1.5; }

  .nl-footer__title { margin: 0 0 0.6rem; color: #fff; font-size: 0.9375rem; font-weight: 800; }
  .nl-footer .nl-form input[type='email'] { border-color: rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.06); color: #fff; }
  .nl-footer .nl-form input[type='email']::placeholder { color: rgba(255, 255, 255, 0.5); }
  .nl-footer .nl-form button { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .nl-footer .nl-form button:hover { background: #fff; }
  .nl-footer .nl-note { color: rgba(255, 255, 255, 0.55); }
  .nl-footer .nl-done { background: rgba(255, 255, 255, 0.08); color: #fff; }
</style>
