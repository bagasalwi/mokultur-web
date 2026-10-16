<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { RatecardPackage, RatecardSection } from '$lib/api';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';

  export let data: PageData;

  $: rc = data.ratecard;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: whatsapp = rc.contact.whatsapp;
  $: email = rc.contact.email;

  const idr = (value: number) => `Rp${value.toLocaleString('id-ID')}`;
  const usd = (value: number) => `US$${value.toLocaleString('en-US')}`;

  /** "Monthly Partnership", or "Template Create Content – All platform Reels" when the package has its own name. */
  const packageLabel = (section: RatecardSection, pkg: RatecardPackage) =>
    pkg.name === section.title ? section.title : `${section.title} – ${pkg.name}`;

  function orderMessage(section: RatecardSection, pkg: RatecardPackage): string {
    const price = pkg.priceIdr > 0 ? ` (${idr(pkg.priceIdr)})` : '';
    return `Halo ${siteName}! Saya tertarik dengan paket ${packageLabel(section, pkg)}${price} dari ratecard.\n\nNama brand: \nRencana tayang: \n\nTerima kasih.`;
  }

  function orderHref(section: RatecardSection, pkg: RatecardPackage): string | null {
    const text = orderMessage(section, pkg);
    if (whatsapp) return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
    if (email) return `mailto:${email}?subject=${encodeURIComponent(`Ratecard: ${packageLabel(section, pkg)}`)}&body=${encodeURIComponent(text)}`;
    return null;
  }

  $: generalHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Halo ${siteName}! Saya ingin bertanya tentang ratecard kolaborasi.`)}`
    : null;
  $: mailHref = email ? `mailto:${email}?subject=${encodeURIComponent(`Ratecard ${siteName}`)}` : null;

  $: lowest = rc.sections.flatMap((s) => s.packages.map((p) => p.priceIdr)).filter((v) => v > 0).sort((a, b) => a - b)[0];
  $: description = rc.intro
    ?? `Ratecard kolaborasi konten ${siteName}${lowest ? `, mulai ${idr(lowest)}` : ''}.`;
  $: pageTitle = `${rc.title} — ${siteName}`;

  /*
   * The site header is sticky and changes height as it compacts on scroll, so
   * the section nav sits under its live height, and anchors land below both.
   */
  let root: HTMLElement;
  onMount(() => {
    const header = document.querySelector<HTMLElement>('header.sticky-top');
    if (!header) return;
    const sync = () => root?.style.setProperty('--rc-head', `${Math.round(header.getBoundingClientRect().height)}px`);
    sync();
    // The browser jumped to #section before the offset existed; redo it with the offset in place.
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target) requestAnimationFrame(() => target.scrollIntoView());
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  });

  const isInstagram = (url: string) => /(^|\.)instagram\.com$/i.test(new URL(url).hostname);
  const exampleLabel = (url: string, label: string | null, index: number) =>
    label ?? (isInstagram(url) ? `Contoh ${index + 1} di Instagram` : `Contoh ${index + 1}`);
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <!-- Shared by link with brands; deliberately kept out of search results. -->
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href={absoluteUrl('/ratecard')} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={absoluteUrl('/ratecard')} />
  <meta name="twitter:card" content={data.settings?.og_image ? 'summary_large_image' : 'summary'} />
  {#if data.settings?.og_image}
    <meta property="og:image" content={data.settings.og_image} />
    <meta name="twitter:image" content={data.settings.og_image} />
  {/if}
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Ratecard', path: '/ratecard' }])).replace(/</g, '\\u003c')}<\/script>`}
</svelte:head>

<div class="rc container-xl" bind:this={root}>
  <header class="rc-hero">
    <div class="rc-hero__copy">
      <span class="rc-eyebrow">Ratecard</span>
      <h1>{rc.title}</h1>
      {#if rc.intro}<p>{rc.intro}</p>{/if}
      <div class="rc-actions">
        {#if generalHref}
          <a class="rc-btn rc-btn--primary" href={generalHref} target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i>Chat WhatsApp</a>
        {/if}
        {#if mailHref}
          <a class="rc-btn rc-btn--ghost" href={mailHref}><i class="bi bi-envelope" aria-hidden="true"></i>{email}</a>
        {/if}
        {#if rc.mediaProfile}
          <a class="rc-btn rc-btn--ghost" href={rc.mediaProfile.url} target="_blank" rel="noopener">
            <i class="bi bi-file-earmark-pdf" aria-hidden="true"></i>{rc.mediaProfile.label ?? 'Media Profile'} (PDF)
          </a>
        {/if}
      </div>
    </div>

    {#if rc.insight.stats.length}
      <section class="rc-insight" aria-label="Insight">
        <dl>
          {#each rc.insight.stats as stat}
            <div class="rc-stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
              {#if stat.hint}<dd class="rc-stat__hint">{stat.hint}</dd>{/if}
            </div>
          {/each}
        </dl>
        {#if rc.insight.caption}<p class="rc-insight__caption"><i class="bi bi-instagram" aria-hidden="true"></i>{rc.insight.caption}</p>{/if}
      </section>
    {/if}
  </header>

  {#if rc.sections.length > 1}
    <nav class="rc-nav" aria-label="Daftar layanan">
      <ul>
        {#each rc.sections as section}
          <li><a href="#{section.id}" class:rc-nav__featured={section.featured}>{#if section.featured}<i class="bi bi-stars" aria-hidden="true"></i>{/if}{section.title}</a></li>
        {/each}
      </ul>
    </nav>
  {/if}

  <div class="rc-sections">
    {#each rc.sections as section (section.id)}
      <section id={section.id} class="rc-section" class:rc-section--featured={section.featured} aria-labelledby="{section.id}-title">
        <div class="rc-section__head">
          {#if section.featured}<span class="rc-eyebrow rc-eyebrow--onlight"><i class="bi bi-stars" aria-hidden="true"></i>Partnership</span>{/if}
          <h2 id="{section.id}-title">{section.title}</h2>
          {#if section.meta}<p class="rc-section__meta">{section.meta}</p>{/if}
        </div>

        <div class="rc-packages" class:rc-packages--single={section.packages.length === 1}>
          {#each section.packages as pkg}
            {@const href = orderHref(section, pkg)}
            <article class="rc-pkg">
              <div class="rc-pkg__top">
              {#if pkg.name !== section.title}<h3 class="rc-pkg__name">{pkg.name}</h3>{/if}
              <p class="rc-price">
                {#if pkg.priceIdr > 0}
                  <span class="rc-price__idr">{idr(pkg.priceIdr)}</span>
                  {#if pkg.unit}<span class="rc-price__unit">{pkg.unit}</span>{/if}
                  {#if pkg.priceUsd}<span class="rc-price__usd">{usd(pkg.priceUsd)}</span>{/if}
                {:else}
                  <span class="rc-price__idr rc-price__idr--ask">Hubungi kami</span>
                {/if}
              </p>
              </div>
              {#if pkg.features.length}
                <ul class="rc-features">
                  {#each pkg.features as feature}
                    <li><i class="bi bi-check2" aria-hidden="true"></i><span>{feature}</span></li>
                  {/each}
                </ul>
              {/if}
              {#if href}
                <a class="rc-order" {href} target="_blank" rel="noopener">
                  <i class="bi {whatsapp ? 'bi-whatsapp' : 'bi-envelope'}" aria-hidden="true"></i>Pesan paket ini
                </a>
              {/if}
            </article>
          {/each}
        </div>

        {#if section.note || section.examples.length}
          <div class="rc-note">
            {#if section.note}
              {#each section.note.split(/\n{2,}/) as paragraph}<p>{paragraph}</p>{/each}
            {/if}
            {#if section.examples.length}
              <ul class="rc-examples" aria-label="Contoh {section.title}">
                {#each section.examples as example, i}
                  <li>
                    <a href={example.url} target="_blank" rel="noopener">
                      <i class="bi {isInstagram(example.url) ? 'bi-instagram' : 'bi-link-45deg'}" aria-hidden="true"></i>
                      <span>{exampleLabel(example.url, example.label, i)}</span>
                      <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
      </section>
    {/each}
  </div>

  {#if generalHref || mailHref}
    <section class="rc-closing" aria-labelledby="rc-closing-title">
      <div>
        <h2 id="rc-closing-title">Siap berkolaborasi?</h2>
        {#if rc.closing}<p>{rc.closing}</p>{/if}
      </div>
      <div class="rc-actions">
        {#if generalHref}<a class="rc-btn rc-btn--dark" href={generalHref} target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i>WhatsApp</a>{/if}
        {#if mailHref}<a class="rc-btn rc-btn--outline" href={mailHref}><i class="bi bi-envelope" aria-hidden="true"></i>Email</a>{/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .rc {
    --rc-primary: var(--site-primary, #f1ff32);
    --rc-on-primary: var(--site-primary-contrast, #0a0a0a);
    --rc-dark: var(--site-dark, #0a0a0a);
    --rc-glow: var(--site-accent-glow, var(--rc-primary));
    --rc-line: #e5e5e5;
    --rc-muted: #6b7280;
    --rc-head: 0px;
    padding-top: 1.5rem;
    padding-bottom: 3.5rem;
  }

  /* ── Hero ───────────────────────────────────────────────────────────── */
  .rc-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: clamp(1.5rem, 4vw, 3rem);
    align-items: center;
    padding: clamp(1.5rem, 4vw, 2.75rem);
    border-radius: 30px;
    color: #fff;
    background:
      radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--rc-glow) 60%, transparent), transparent 28%),
      linear-gradient(140deg, color-mix(in srgb, var(--rc-dark) 96%, #000), color-mix(in srgb, var(--rc-dark) 78%, #fff));
  }

  .rc-hero h1 {
    margin: 0 0 1rem;
    color: #fff;
    font-size: clamp(2.4rem, 6vw, 4.75rem);
    font-weight: 900;
    letter-spacing: -0.06em;
    line-height: 0.95;
  }

  .rc-hero p {
    max-width: 52ch;
    margin: 0;
    color: rgba(255, 255, 255, 0.78);
    font-size: clamp(1rem, 1.4vw, 1.1rem);
    line-height: 1.7;
  }

  .rc-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    width: fit-content;
    margin-bottom: 1rem;
    padding: 0.35rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    color: var(--rc-primary);
    background: rgba(255, 255, 255, 0.08);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .rc-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    margin-top: 1.5rem;
  }

  .rc-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 46px;
    max-width: 100%;
    padding: 0.75rem 1.1rem;
    border-radius: 999px;
    font-weight: 800;
    text-decoration: none;
    overflow-wrap: anywhere;
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease;
  }

  .rc-btn:hover { transform: translateY(-1px); }
  .rc-btn:active { transform: scale(0.97); }
  .rc-btn:focus-visible, .rc-order:focus-visible, .rc-nav a:focus-visible, .rc-examples a:focus-visible {
    outline: 3px solid var(--rc-primary);
    outline-offset: 3px;
  }

  .rc-btn--primary { color: var(--rc-on-primary); background: var(--rc-primary); }
  .rc-btn--ghost { border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; background: rgba(255, 255, 255, 0.08); }
  .rc-btn--ghost:hover { color: #fff; background: rgba(255, 255, 255, 0.15); }
  .rc-btn--dark { color: #fff; background: var(--rc-dark); }
  .rc-btn--dark:hover { color: #fff; }
  .rc-btn--outline { border: 2px solid var(--rc-dark); color: var(--rc-dark); }
  .rc-btn--outline:hover { color: var(--rc-dark); background: rgba(0, 0, 0, 0.05); }

  .rc-insight {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.07);
  }

  .rc-insight dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin: 0;
  }

  .rc-stat {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.08);
  }

  .rc-stat dt {
    order: 2;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .rc-stat dd {
    margin: 0 0 0.25rem;
    color: #fff;
    font-size: clamp(1.5rem, 2.6vw, 2.2rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }

  .rc-stat dd.rc-stat__hint {
    order: 3;
    margin: 0.35rem 0 0;
    color: var(--rc-primary);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1.3;
  }

  .rc-insight__caption {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0.85rem 0.25rem 0 !important;
    color: rgba(255, 255, 255, 0.6) !important;
    font-size: 0.8rem !important;
  }

  /* ── Section nav ────────────────────────────────────────────────────── */
  .rc-nav {
    position: sticky;
    top: var(--rc-head, 0px);
    z-index: 5;
    margin: 1.25rem -0.25rem 0;
    padding: 0.6rem 0.25rem;
    background: color-mix(in srgb, #fff 92%, transparent);
    backdrop-filter: blur(8px);
  }

  .rc-nav ul {
    display: flex;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .rc-nav ul::-webkit-scrollbar { display: none; }

  .rc-nav a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 40px;
    padding: 0.5rem 0.9rem;
    border: 1px solid var(--rc-line);
    border-radius: 999px;
    color: #1a1a1a;
    background: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
    text-decoration: none;
    transition: border-color 160ms ease, background 160ms ease;
  }

  .rc-nav a:hover { border-color: #1a1a1a; }
  .rc-nav a.rc-nav__featured { border-color: var(--rc-dark); color: #fff; background: var(--rc-dark); }
  .rc-nav a.rc-nav__featured i { color: var(--rc-primary); }

  /* ── Sections ───────────────────────────────────────────────────────── */
  .rc-sections {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }

  /* Grid and flex items default to min-width:auto, so one long example label could widen the page. */
  .rc-sections > *, .rc-examples li { min-width: 0; max-width: 100%; }

  .rc-section {
    scroll-margin-top: calc(var(--rc-head, 0px) + 4.5rem);
    padding: clamp(1.25rem, 3vw, 2rem);
    border: 1px solid var(--rc-line);
    border-radius: 24px;
    background: #fff;
  }

  .rc-section__head { margin-bottom: 1.1rem; }

  .rc-section h2 {
    margin: 0;
    color: #1a1a1a;
    font-size: clamp(1.4rem, 2.6vw, 1.9rem);
    font-weight: 850;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }

  .rc-section__meta {
    margin: 0.4rem 0 0;
    color: var(--rc-muted);
    font-size: 0.9rem;
  }

  .rc-packages {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    gap: 0.75rem;
  }

  .rc-packages--single { grid-template-columns: minmax(0, 1fr); }

  .rc-pkg {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
    padding: 1.1rem 1.2rem;
    border-radius: 18px;
    background: #fafafa;
    border: 1px solid #efefef;
  }

  .rc-packages--single .rc-pkg {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    column-gap: 1.5rem;
  }

  .rc-packages--single .rc-features { flex-basis: 100%; width: 100%; order: 3; }

  .rc-pkg__top {
    display: grid;
    gap: 0.4rem;
  }

  .rc-pkg__name {
    margin: 0;
    color: #1a1a1a;
    font-size: 1rem;
    font-weight: 750;
  }

  .rc-price {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.15rem 0.5rem;
    margin: 0;
  }

  .rc-price__idr {
    color: #1a1a1a;
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .rc-price__idr--ask { font-size: 1.25rem; letter-spacing: -0.02em; }
  .rc-price__unit { color: var(--rc-muted); font-weight: 700; }

  .rc-price__usd {
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    color: var(--rc-muted);
    background: #fff;
    border: 1px solid var(--rc-line);
    font-size: 0.78rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .rc-features {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
    color: #333;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .rc-features li { display: flex; gap: 0.5rem; }
  .rc-features i { flex-shrink: 0; margin-top: 0.1rem; font-size: 1rem; }

  .rc-order {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    width: fit-content;
    min-height: 44px;
    margin-top: auto;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    color: #fff;
    background: var(--rc-dark);
    font-size: 0.875rem;
    font-weight: 800;
    text-decoration: none;
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .rc-order:hover { color: #fff; transform: translateY(-1px); }
  .rc-order:active { transform: scale(0.97); }
  .rc-packages--single .rc-order { margin-top: 0; }

  .rc-note {
    margin-top: 1rem;
    padding: 1rem 1.2rem;
    border: 1px solid color-mix(in srgb, var(--rc-primary) 32%, transparent);
    border-radius: 14px;
    background: color-mix(in srgb, var(--rc-primary) 9%, #fff);
    color: #333;
    font-size: 0.93rem;
    line-height: 1.65;
  }

  .rc-note p { max-width: 75ch; margin: 0 0 0.6rem; }
  .rc-note p:last-child { margin-bottom: 0; }

  .rc-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.75rem 0 0;
    padding: 0;
    list-style: none;
  }

  .rc-examples a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 40px;
    max-width: 100%;
    padding: 0.45rem 0.85rem;
    border: 1px solid var(--rc-line);
    border-radius: 999px;
    color: #1a1a1a;
    background: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
  }

  .rc-examples a span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rc-examples a:hover { border-color: #1a1a1a; }

  /* Partnership bundles: the dark card is what the page builds up to. */
  .rc-section--featured {
    border-color: var(--rc-dark);
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--rc-glow) 34%, transparent), transparent 32%),
      var(--rc-dark);
  }

  .rc-section--featured h2, .rc-section--featured .rc-pkg__name, .rc-section--featured .rc-price__idr { color: #fff; }
  .rc-section--featured .rc-section__meta { color: rgba(255, 255, 255, 0.7); }
  .rc-eyebrow--onlight { margin-bottom: 0.75rem; }

  .rc-section--featured .rc-pkg {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }

  .rc-section--featured .rc-price__usd { border-color: rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.75); background: transparent; }
  .rc-section--featured .rc-price__unit { color: rgba(255, 255, 255, 0.7); }
  .rc-section--featured .rc-features { color: rgba(255, 255, 255, 0.88); }
  .rc-section--featured .rc-features i { color: var(--rc-primary); }
  .rc-section--featured .rc-order { color: var(--rc-on-primary); background: var(--rc-primary); }
  .rc-section--featured .rc-order:hover { color: var(--rc-on-primary); }

  @media (min-width: 768px) {
    .rc-section--featured .rc-features { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 1.5rem; }
  }

  .rc-section--featured .rc-note { color: rgba(255, 255, 255, 0.85); background: rgba(255, 255, 255, 0.06); }

  /* ── Closing ────────────────────────────────────────────────────────── */
  .rc-closing {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem 2rem;
    margin-top: 1rem;
    padding: clamp(1.5rem, 4vw, 2.25rem);
    border-radius: 24px;
    color: var(--rc-on-primary);
    background: var(--rc-primary);
  }

  .rc-closing h2 {
    margin: 0 0 0.35rem;
    color: inherit;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .rc-closing p { max-width: 60ch; margin: 0; line-height: 1.6; }
  .rc-closing .rc-actions { margin-top: 0; }

  @media (max-width: 991.98px) {
    .rc-hero { grid-template-columns: minmax(0, 1fr); }
  }

  @media (max-width: 575.98px) {
    .rc { padding-top: 1rem; }
    .rc-hero { border-radius: 22px; }
    .rc-insight { padding: 0.6rem; border-radius: 18px; }
    .rc-insight dl { gap: 0.5rem; }
    .rc-stat { padding: 0.8rem; border-radius: 14px; }
    .rc-stat dd:not(.rc-stat__hint) { font-size: clamp(1.1rem, 5vw, 1.5rem); overflow-wrap: normal; white-space: nowrap; }
    .rc-section { border-radius: 18px; }
    .rc-packages--single .rc-pkg { flex-direction: column; flex-wrap: nowrap; align-items: stretch; }
    .rc-packages--single .rc-order { align-self: flex-start; }
    .rc-actions .rc-btn { flex: 1 1 auto; justify-content: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rc-btn, .rc-order { transition: none; }
    .rc-btn:hover, .rc-order:hover { transform: none; }
  }
</style>
