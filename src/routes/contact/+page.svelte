<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';
  import LatestList from '$components/home/LatestList.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: email = data.settings?.contact_email && data.settings.contact_email !== '-' ? data.settings.contact_email : null;
  $: whatsapp = (data.settings?.contact_whatsapp ?? '').replace(/\D/g, '') || null;

  type Kind = { id: string; icon: string; label: string; desc: string; intent: string; fields: string[] };
  const KINDS: Kind[] = [
    {
      id: 'press', icon: 'bi-megaphone', label: 'Press Release',
      desc: 'Kirim rilis untuk dipublikasikan sebagai berita.',
      intent: 'mengirim press release',
      fields: ['Nama brand / perusahaan', 'Topik rilis', 'Tanggal rilis yang diinginkan', 'Link rilis & foto'],
    },
    {
      id: 'event', icon: 'bi-calendar-event', label: 'Liputan Event',
      desc: 'Masuk jadwal event, liputan, atau media partner.',
      intent: 'mendaftarkan event / mengajak liputan',
      fields: ['Nama event', 'Tanggal & jam', 'Lokasi', 'Link tiket / info', 'Poster (link)'],
    },
    {
      id: 'paid', icon: 'bi-stars', label: 'Paid Partnership',
      desc: 'Artikel bersponsor, review produk, atau konten kolaborasi.',
      intent: 'membahas paid partnership',
      fields: ['Nama brand', 'Produk / kampanye', 'Format yang diinginkan', 'Periode tayang', 'Anggaran (opsional)'],
    },
    {
      id: 'campaign', icon: 'bi-broadcast', label: 'Amplifikasi Campaign',
      desc: 'Sebar campaign lewat website dan media sosial.',
      intent: 'membahas amplifikasi campaign',
      fields: ['Nama campaign', 'Kanal yang diinginkan', 'Periode', 'Link materi'],
    },
    {
      id: 'other', icon: 'bi-chat-dots', label: 'Lainnya',
      desc: 'Pertanyaan, koreksi berita, atau ide lain.',
      intent: 'menghubungi redaksi',
      fields: ['Nama', 'Keperluan'],
    },
  ];

  // `?type=event` (e.g. from the event pages) preselects a kind.
  let selected = KINDS.find((k) => k.id === $page.url.searchParams.get('type'))?.id ?? 'press';
  $: kind = KINDS.find((k) => k.id === selected) ?? KINDS[0];

  function message(k: Kind): string {
    return `Halo tim ${siteName}! Saya ingin ${k.intent}.\n\n${k.fields.map((f) => `${f}: `).join('\n')}\n\nTerima kasih.`;
  }
  const waHref = (k: Kind) => (whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message(k))}` : null);
  const mailHref = (k: Kind) =>
    email ? `mailto:${email}?subject=${encodeURIComponent(`[${k.label}] Kolaborasi dengan ${siteName}`)}&body=${encodeURIComponent(message(k))}` : null;

  $: preview = message(kind);
  $: wa = waHref(kind);
  $: mail = mailHref(kind);

  $: canonical = absoluteUrl('/contact');
  $: pageTitle = `Kontak & Kolaborasi — ${siteName}`;
  $: metaDescription = `Hubungi ${siteName} untuk press release, liputan event, paid partnership, dan amplifikasi campaign. Pilih kebutuhanmu, pesan langsung tersusun.`;
  $: jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: pageTitle,
    url: canonical,
    mainEntity: {
      '@type': 'Organization',
      name: siteName,
      url: absoluteUrl('/'),
      contactPoint: [
        ...(email ? [{ '@type': 'ContactPoint', contactType: 'customer support', email, availableLanguage: ['id', 'en'] }] : []),
        ...(whatsapp ? [{ '@type': 'ContactPoint', contactType: 'sales', telephone: `+${whatsapp}`, availableLanguage: ['id'] }] : []),
      ],
    },
  };
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={metaDescription} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={canonical} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content={data.settings?.og_image ? 'summary_large_image' : 'summary'} />
  {#if data.settings?.og_image}
    <meta property="og:image" content={data.settings.og_image} />
    <meta name="twitter:image" content={data.settings.og_image} />
  {/if}
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Kontak', path: '/contact' }]))}<\/script>`}
</svelte:head>

<div class="desk container-xl">
  <header class="desk-head">
    <h1>Kolaborasi dengan {siteName}</h1>
    <p>Ceritakan kebutuhanmu. Pilih jenis kolaborasi, lalu kirim lewat WhatsApp atau email. Pesannya sudah kami susun, tinggal dilengkapi.</p>
  </header>

  <div class="desk-grid">
    <div class="desk-main">
      <section class="desk-step" aria-labelledby="step-kind">
        <h2 id="step-kind"><span class="desk-step__num" aria-hidden="true">1</span> Pilih jenis kolaborasi</h2>
        <div class="desk-kinds" role="radiogroup" aria-labelledby="step-kind">
          {#each KINDS as k (k.id)}
            <label class="desk-kind" class:is-on={selected === k.id}>
              <input type="radio" name="kind" value={k.id} bind:group={selected} />
              <i class="bi {k.icon}" aria-hidden="true"></i>
              <span class="desk-kind__text">
                <strong>{k.label}</strong>
                <small>{k.desc}</small>
              </span>
              <i class="bi bi-check-circle-fill desk-kind__check" aria-hidden="true"></i>
            </label>
          {/each}
        </div>
      </section>

      <section class="desk-step" aria-labelledby="step-send">
        <h2 id="step-send"><span class="desk-step__num" aria-hidden="true">2</span> Kirim lewat</h2>
        <div class="desk-send">
          {#if wa}
            <a class="desk-channel desk-channel--wa" href={wa} target="_blank" rel="noopener">
              <i class="bi bi-whatsapp" aria-hidden="true"></i>
              <span><strong>WhatsApp</strong><small>Paling cepat dibalas</small></span>
              <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
            </a>
          {/if}
          {#if mail}
            <a class="desk-channel desk-channel--mail" href={mail}>
              <i class="bi bi-envelope" aria-hidden="true"></i>
              <span><strong>Email</strong><small>{email}</small></span>
              <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
            </a>
          {/if}
        </div>
        <figure class="desk-preview">
          <figcaption>Pesan yang akan terkirim · {kind.label}</figcaption>
          <pre>{preview}</pre>
        </figure>
        <noscript>
          <p class="desk-noscript">Tanpa JavaScript, pesan di atas selalu untuk {KINDS[0].label}. Jenis lain:
            {#each KINDS.slice(1) as k}{#if waHref(k)} <a href={waHref(k)}>{k.label}</a>{/if}{/each}
          </p>
        </noscript>
      </section>

      <section class="desk-ready" aria-labelledby="ready-title">
        <h2 id="ready-title">Siapkan ini supaya cepat diproses</h2>
        <ul>
          {#each kind.fields as field}<li><i class="bi bi-check2" aria-hidden="true"></i>{field}</li>{/each}
        </ul>
      </section>

      {#if data.recentArticles?.length}
        <section class="desk-work" aria-labelledby="work-title">
          <div class="desk-work__head">
            <h2 id="work-title">Liputan terbaru kami</h2>
            <a class="theme-btn theme-btn--see-all theme-btn--sm" href="/media-partner">Media partner <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
          </div>
          <LatestList articles={data.recentArticles} />
        </section>
      {/if}
    </div>

    <aside class="desk-aside" aria-label="Kanal resmi">
      <section class="desk-card">
        <h2>Kanal resmi</h2>
        <dl class="desk-contacts">
          {#if email}<div><dt>Email</dt><dd><a href="mailto:{email}">{email}</a></dd></div>{/if}
          {#if whatsapp}<div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">+{whatsapp}</a></dd></div>{/if}
        </dl>
      </section>

      {#if data.socials?.length}
        <section class="desk-card">
          <h2>Ikuti kami</h2>
          <ul class="desk-socials">
            {#each data.socials as social (social.id)}
              <li>
                <a href={social.url} target="_blank" rel="noopener">
                  <i class="bi bi-{(social.icon ?? social.platform).toLowerCase()}" aria-hidden="true"></i>
                  <span><strong>{social.username}</strong><small>{social.platform}</small></span>
                  {#if social.followers}<em>{social.followers}</em>{/if}
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if data.bioLinks?.length}
        <section class="desk-card">
          <h2>Tautan cepat</h2>
          <ul class="desk-links">
            {#each data.bioLinks as link}
              <li><a href={link.url} target="_blank" rel="noopener">{link.name}<i class="bi bi-arrow-up-right" aria-hidden="true"></i></a></li>
            {/each}
          </ul>
        </section>
      {/if}
    </aside>
  </div>
</div>

<style>
  .desk { padding-top: 2rem; padding-bottom: 4rem; }

  .desk-head { max-width: 760px; margin-bottom: 2.25rem; }
  .desk-head h1 { margin: 0; font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; letter-spacing: -0.035em; line-height: 1.05; text-wrap: balance; }
  .desk-head p { margin: 0.75rem 0 0; color: #4b5563; font-size: 1.0625rem; line-height: 1.6; max-width: 60ch; }

  .desk-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); gap: 3rem; align-items: start; }
  .desk-main { min-width: 0; display: grid; gap: 2.5rem; }

  .desk-step h2,
  .desk-ready h2,
  .desk-work h2,
  .desk-card h2 { margin: 0 0 1rem; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.6rem; }
  .desk-step__num {
    display: inline-grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--site-dark, #111);
    color: var(--site-primary, #f1ff32);
    font-size: 0.875rem;
    font-weight: 900;
  }

  .desk-kinds { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .desk-kind {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 1rem 1.1rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 16px;
    background: #fff;
    cursor: pointer;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .desk-kind:hover { border-color: #9ca3af; }
  .desk-kind input { position: absolute; opacity: 0; pointer-events: none; }
  .desk-kind > i:first-of-type { font-size: 1.25rem; color: #1a1a1a; margin-top: 0.1rem; }
  .desk-kind__text { display: grid; gap: 0.2rem; min-width: 0; }
  .desk-kind__text strong { font-size: 0.9375rem; }
  .desk-kind__text small { font-size: 0.8125rem; color: #6b7280; line-height: 1.45; }
  .desk-kind__check { margin-left: auto; color: transparent; font-size: 1.1rem; transition: color 160ms ease; }
  .desk-kind.is-on { border-color: var(--site-dark, #111); background: color-mix(in srgb, var(--site-primary, #f1ff32) 12%, #fff); }
  .desk-kind.is-on .desk-kind__check { color: var(--site-dark, #111); }
  .desk-kind:focus-within { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  .desk-send { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .desk-channel {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-height: 72px;
    padding: 0.9rem 1.1rem;
    border-radius: 16px;
    text-decoration: none;
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease;
  }
  .desk-channel > i:first-child { font-size: 1.5rem; }
  .desk-channel span { display: grid; min-width: 0; flex: 1; }
  .desk-channel strong { font-size: 1rem; }
  .desk-channel small { font-size: 0.8125rem; opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .desk-channel--wa { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .desk-channel--mail { background: var(--site-dark, #111); color: #fff; }
  .desk-channel--mail:hover { color: var(--site-primary, #f1ff32); }
  .desk-channel--wa:hover { color: var(--site-primary-contrast, #111); }
  .desk-channel:active { transform: scale(0.98); }
  .desk-channel:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 3px; }

  .desk-preview { margin: 1rem 0 0; padding: 1rem 1.1rem; border: 1px dashed #d1d5db; border-radius: 14px; background: #fafafa; }
  .desk-preview figcaption { margin-bottom: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #6b7280; }
  .desk-preview pre { margin: 0; font-family: inherit; font-size: 0.875rem; line-height: 1.6; color: #1f2937; white-space: pre-wrap; }
  .desk-noscript { margin: 0.75rem 0 0; font-size: 0.8125rem; color: #6b7280; }

  .desk-ready ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem 1.5rem; margin: 0; padding: 0; list-style: none; }
  .desk-ready li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; color: #374151; }
  .desk-ready li i { color: #16a34a; font-size: 1.1rem; }

  .desk-work__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem; }
  .desk-work__head h2 { margin: 0; }

  .desk-aside { position: sticky; top: 80px; display: grid; gap: 1rem; }
  .desk-card { padding: 1.15rem 1.25rem; border: 1px solid #ececec; border-radius: 18px; background: #fff; }
  .desk-card h2 { font-size: 1rem; margin-bottom: 0.75rem; }
  .desk-contacts { display: grid; gap: 0.75rem; margin: 0; }
  .desk-contacts dt { font-size: 0.75rem; font-weight: 700; color: #6b7280; }
  .desk-contacts dd { margin: 0.1rem 0 0; font-weight: 700; overflow-wrap: anywhere; }
  .desk-contacts a { color: #1a1a1a; text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }

  .desk-socials,
  .desk-links { display: grid; gap: 0.25rem; margin: 0; padding: 0; list-style: none; }
  .desk-socials a,
  .desk-links a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
    padding: 0.35rem 0.5rem;
    border-radius: 10px;
    color: #1a1a1a;
    text-decoration: none;
    transition: background-color 160ms ease;
  }
  .desk-socials a:hover,
  .desk-links a:hover { background: #f3f4f6; }
  .desk-socials i { font-size: 1.15rem; }
  .desk-socials span { display: grid; min-width: 0; flex: 1; }
  .desk-socials strong { font-size: 0.875rem; }
  .desk-socials small { font-size: 0.75rem; color: #6b7280; }
  .desk-socials em { font-style: normal; font-size: 0.75rem; font-weight: 800; color: #4b5563; font-variant-numeric: tabular-nums; }
  .desk-links a { justify-content: space-between; font-size: 0.875rem; font-weight: 700; }
  .desk :is(.desk-socials, .desk-links) a:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 1px; }

  @media (max-width: 991px) {
    .desk-grid { grid-template-columns: minmax(0, 1fr); gap: 2.5rem; }
    .desk-aside { position: static; }
  }
  @media (max-width: 575px) {
    .desk { padding-top: 1.25rem; }
    .desk-kinds,
    .desk-send,
    .desk-ready ul { grid-template-columns: minmax(0, 1fr); }
  }
  @media (prefers-reduced-motion: reduce) { .desk-channel, .desk-kind { transition: none; } }
</style>
