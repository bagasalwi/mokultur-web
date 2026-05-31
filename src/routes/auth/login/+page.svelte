<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { page } from '$app/stores';

  export let data: PageData;
  export let form: ActionData;

  $: redirectTo = $page.url.searchParams.get('redirect') ?? '/';
  $: siteName = data.settings?.site_name ?? 'Mokultur';
</script>

<svelte:head>
  <title>Masuk · {siteName}</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="auth-page">
  <div class="auth-card">
    <h1 class="auth-card__title">Masuk ke {siteName}</h1>
    <p class="auth-card__hint">Pakai email &amp; password, atau lanjut dengan Google.</p>

    {#if form?.error}
      <div class="auth-alert">{form.error}</div>
    {/if}

    <form method="POST" class="auth-form" autocomplete="on">
      <input type="hidden" name="redirect" value={redirectTo} />

      <label class="auth-field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autocomplete="email"
          required
          value={form?.email ?? ''}
        />
      </label>

      <label class="auth-field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autocomplete="current-password"
          required
          minlength="8"
        />
      </label>

      <button class="auth-btn auth-btn--primary" type="submit">Masuk</button>
    </form>

    <div class="auth-divider"><span>atau</span></div>

    <a
      class="auth-btn auth-btn--google"
      href="https://dashboard.mokultur.com/auth/google/redirect?from=public"
    >
      <i class="bi bi-google"></i> Lanjutkan dengan Google
    </a>

    <p class="auth-footer">
      Belum punya akun? <a href="/auth/register">Daftar di sini</a>
    </p>
  </div>
</section>

<style>
  .auth-page {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
  }
  .auth-card {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    padding: 32px;
  }
  .auth-card__title { font-size: 24px; font-weight: 700; margin: 0 0 6px; }
  .auth-card__hint { color: #6b7280; font-size: 14px; margin: 0 0 20px; }

  .auth-alert {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .auth-form { display: flex; flex-direction: column; gap: 14px; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-field span { font-size: 13px; font-weight: 600; color: #111; }
  .auth-field input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .auth-field input:focus {
    border-color: var(--site-primary, #f1ff32);
    box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25);
  }

  .auth-btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 14px;
    border: 1px solid transparent;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.05s, filter 0.15s;
  }
  .auth-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    margin-top: 4px;
  }
  .auth-btn--primary:hover { filter: brightness(0.95); }
  .auth-btn--google {
    background: #fff;
    border-color: #d1d5db;
    color: #111;
    margin-top: 4px;
  }
  .auth-btn--google:hover { background: #f9fafb; }

  .auth-divider {
    text-align: center;
    color: #9ca3af;
    font-size: 12px;
    margin: 18px 0;
    position: relative;
  }
  .auth-divider::before,
  .auth-divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    border-top: 1px solid #e5e7eb;
  }
  .auth-divider::before { left: 0; }
  .auth-divider::after { right: 0; }
  .auth-divider span {
    background: #fff;
    padding: 0 10px;
    position: relative;
    z-index: 1;
  }

  .auth-footer {
    text-align: center;
    font-size: 13px;
    color: #6b7280;
    margin: 20px 0 0;
  }
  .auth-footer a { color: var(--site-dark, #111); font-weight: 600; }
</style>
