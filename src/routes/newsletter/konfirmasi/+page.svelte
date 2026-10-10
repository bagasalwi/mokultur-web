<script lang="ts">
  import type { PageData } from './$types';
  import NewsletterSignup from '$components/sidebar/NewsletterSignup.svelte';

  export let data: PageData;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: confirming = data.action === 'confirm';
  $: title = !data.ok
    ? 'Tautan tidak berlaku'
    : confirming
      ? 'Langganan aktif!'
      : 'Kamu sudah berhenti berlangganan';
</script>

<svelte:head>
  <title>{title} · {siteName}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="nlp container-xl">
  <section class="nlp-card" aria-labelledby="nlp-title">
    <span class="nlp-icon" class:nlp-icon--off={!data.ok || !confirming} aria-hidden="true">
      <i class="bi {!data.ok ? 'bi-link-45deg' : confirming ? 'bi-envelope-check' : 'bi-envelope-dash'}"></i>
    </span>
    <h1 id="nlp-title">{title}</h1>
    {#if !data.ok}
      <p>Tautan ini sudah tidak berlaku atau tidak lengkap. Kalau ingin berlangganan, daftar lagi di bawah.</p>
      <div class="nlp-form"><NewsletterSignup variant="card" source="relink" /></div>
    {:else if confirming}
      <p>Mulai Senin depan, rangkuman berita anime, game, dan event yang paling banyak dibaca akan dikirim ke <strong>{data.email}</strong>.</p>
      <a class="theme-btn theme-btn--primary" href="/">Baca berita terbaru</a>
    {:else}
      <p><strong>{data.email}</strong> tidak akan menerima rangkuman mingguan lagi. Kalau berubah pikiran, daftar ulang kapan saja.</p>
      <div class="nlp-form"><NewsletterSignup variant="card" source="resubscribe" /></div>
    {/if}
  </section>
</div>

<style>
  .nlp { display: grid; place-items: center; min-height: 60vh; padding-top: 3rem; padding-bottom: 4rem; }
  .nlp-card { width: min(560px, 100%); padding: 2rem; border: 1px solid #ececec; border-radius: 24px; background: #fff; text-align: center; }
  .nlp-icon { display: inline-grid; place-items: center; width: 64px; height: 64px; margin-bottom: 1rem; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); font-size: 1.75rem; }
  .nlp-icon--off { background: #f3f4f6; color: #374151; }
  .nlp-card h1 { margin: 0 0 0.6rem; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 900; letter-spacing: -0.03em; }
  .nlp-card p { max-width: 46ch; margin: 0 auto 1.25rem; color: #4b5563; font-size: 0.9375rem; line-height: 1.6; overflow-wrap: anywhere; }
  .nlp-card strong { color: #111; }
  .nlp-form { text-align: left; }
</style>
