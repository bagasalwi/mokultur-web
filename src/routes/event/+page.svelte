<script lang="ts">
  import type { PageData } from './$types';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';
  import { monthKey, monthLabel } from '$lib/event';
  import type { EventItem } from '$lib/api';
  import EventSpotlight from '$components/event/EventSpotlight.svelte';
  import EventAgendaRow from '$components/event/EventAgendaRow.svelte';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: pageTitle = buildPageTitle('Jadwal Event', siteName);
  $: description = `Jadwal event anime, game, cosplay, dan pop culture terdekat di Indonesia — lengkap dengan tanggal, lokasi, dan link tiket dari ${siteName}.`;

  // Filters run on the client: the whole schedule is already on the page, and
  // without JS every event simply stays visible.
  let city = 'all';
  let month = 'all';

  $: cities = [...new Set(data.upcoming.map((e) => e.city).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'id'));
  $: months = [...new Set(data.upcoming.map((e) => monthKey(e.startDate)))].sort();
  $: filtering = city !== 'all' || month !== 'all';
  $: spotlight = data.upcoming[0] ?? null;
  $: matches = data.upcoming.filter((e) => (city === 'all' || e.city === city) && (month === 'all' || monthKey(e.startDate) === month));
  // The spotlight already shows the next event; repeat it only inside a filter.
  $: listed = filtering ? matches : matches.filter((e) => e !== spotlight);
  $: groups = listed.reduce<{ key: string; events: EventItem[] }[]>((acc, e) => {
    const key = monthKey(e.startDate);
    const last = acc[acc.length - 1];
    if (last?.key === key) last.events.push(e);
    else acc.push({ key, events: [e] });
    return acc;
  }, []);

</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={absoluteUrl('/event')} />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={absoluteUrl('/event')} />
  {#if spotlight?.poster}<meta property="og:image" content={spotlight.poster} />{/if}
  <meta name="twitter:card" content="summary_large_image" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jadwal Event',
    itemListElement: data.upcoming.slice(0, 20).map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/event/${e.slug}`), name: e.name })),
  })}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Jadwal Event', path: '/event' }]))}<\/script>`}
</svelte:head>

<div class="agenda container-xl">
  <header class="agenda-head">
    <div>
      <h1>Jadwal Event</h1>
      <p class="agenda-head__sub">Event anime, game, cosplay, dan pop culture yang bisa kamu datangi. Tambahkan ke kalender supaya tidak terlewat.</p>
    </div>
    <p class="agenda-head__count">
      <strong>{data.upcoming.length}</strong> event mendatang
    </p>
  </header>

  {#if spotlight}
    <EventSpotlight event={spotlight} />
  {/if}

  {#if data.upcoming.length > 1}
    <div class="agenda-filters" role="group" aria-label="Saring jadwal">
      {#if cities.length > 1}
        <div class="agenda-filters__set">
          <span class="agenda-filters__label">Kota</span>
          <button type="button" class:is-on={city === 'all'} aria-pressed={city === 'all'} on:click={() => (city = 'all')}>Semua</button>
          {#each cities as name}
            <button type="button" class:is-on={city === name} aria-pressed={city === name} on:click={() => (city = name)}>{name}</button>
          {/each}
        </div>
      {/if}
      {#if months.length > 1}
        <div class="agenda-filters__set">
          <span class="agenda-filters__label">Bulan</span>
          <button type="button" class:is-on={month === 'all'} aria-pressed={month === 'all'} on:click={() => (month = 'all')}>Semua</button>
          {#each months as key}
            <button type="button" class:is-on={month === key} aria-pressed={month === key} on:click={() => (month = key)}>{monthLabel(key)}</button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <section class="agenda-list" aria-label="Agenda event" aria-live="polite">
    {#if groups.length}
      {#each groups as group (group.key)}
        <h2 class="agenda-month">{monthLabel(group.key)}</h2>
        {#each group.events as event (event.slug)}
          <EventAgendaRow {event} />
        {/each}
      {/each}
    {:else if filtering}
      <div class="agenda-empty">
        <p>Belum ada event untuk pilihan ini.</p>
        <button type="button" class="theme-btn theme-btn--see-all theme-btn--sm" on:click={() => { city = 'all'; month = 'all'; }}>Tampilkan semua</button>
      </div>
    {:else if !spotlight}
      <div class="agenda-empty">
        <i class="bi bi-calendar2-week" aria-hidden="true"></i>
        <p>Belum ada event mendatang. Pantau terus, jadwal baru ditambahkan setiap minggu.</p>
      </div>
    {/if}
  </section>

  <aside class="agenda-cta">
    <div>
      <h2>Punya event?</h2>
      <p>Kirim detail event-mu. Kami bantu masukkan ke jadwal dan bicarakan liputannya.</p>
    </div>
    <a class="theme-btn theme-btn--primary" href="/contact?type=event"><i class="bi bi-send" aria-hidden="true"></i> Daftarkan event</a>
  </aside>

  {#if data.past.length}
    <details class="agenda-past">
      <summary>
        <span>Sudah lewat</span>
        <small>{data.past.length} event</small>
        <i class="bi bi-chevron-down" aria-hidden="true"></i>
      </summary>
      <div class="agenda-past__list">
        {#each data.past as event (event.slug)}
          <EventAgendaRow {event} past />
        {/each}
      </div>
    </details>
  {/if}
</div>

<style>
  .agenda { padding-top: 2rem; padding-bottom: 4rem; }

  .agenda-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 0.75rem 2rem; margin-bottom: 1.5rem; }
  .agenda-head h1 { margin: 0; font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 900; letter-spacing: -0.03em; }
  .agenda-head__sub { margin: 0.5rem 0 0; max-width: 60ch; color: #4b5563; font-size: 0.9375rem; }
  .agenda-head__count { margin: 0; color: #6b7280; font-size: 0.875rem; }
  .agenda-head__count strong { font-size: 1.5rem; color: #1a1a1a; font-variant-numeric: tabular-nums; margin-right: 0.15rem; }

  .agenda-filters { display: grid; gap: 0.6rem; margin: 2rem 0 0.5rem; }
  .agenda-filters__set { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
  .agenda-filters__label { min-width: 3.5rem; font-size: 0.8125rem; font-weight: 700; color: #6b7280; }
  .agenda-filters button {
    min-height: 36px;
    padding: 0 0.9rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #fff;
    color: #374151;
    font-size: 0.8125rem;
    font-weight: 700;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .agenda-filters button:hover { border-color: var(--site-dark, #111); }
  .agenda-filters button.is-on { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .agenda-filters button:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  .agenda-list { margin-top: 0.5rem; }
  .agenda-month {
    position: sticky;
    top: 0;
    z-index: 2;
    margin: 1.75rem 0 0;
    padding: 0.6rem 0;
    background: #fff;
    border-bottom: 2px solid #1a1a1a;
    font-size: 1.125rem;
    font-weight: 900;
    letter-spacing: -0.01em;
  }

  .agenda-empty { padding: 2.5rem 1rem; text-align: center; color: #6b7280; }
  .agenda-empty i { display: block; font-size: 1.75rem; margin-bottom: 0.5rem; color: #9ca3af; }
  .agenda-empty p { margin: 0 0 0.75rem; }

  .agenda-cta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem 2rem;
    margin: 2.5rem 0 0;
    padding: 1.25rem 1.5rem;
    border: 1px dashed #d1d5db;
    border-radius: 18px;
  }
  .agenda-cta h2 { margin: 0; font-size: 1.125rem; font-weight: 800; }
  .agenda-cta p { margin: 0.2rem 0 0; color: #6b7280; font-size: 0.875rem; }
  .agenda-cta .theme-btn { box-shadow: none; }

  .agenda-past { margin-top: 2rem; }
  .agenda-past summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 0;
    border-bottom: 1px solid #ececec;
    cursor: pointer;
    list-style: none;
    font-size: 1rem;
    font-weight: 800;
  }
  .agenda-past summary::-webkit-details-marker { display: none; }
  .agenda-past summary small { color: #6b7280; font-weight: 600; font-size: 0.8125rem; }
  .agenda-past summary i { margin-left: auto; transition: transform 200ms ease; }
  .agenda-past[open] summary i { transform: rotate(180deg); }
  .agenda-past summary:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; border-radius: 6px; }

  @media (max-width: 575px) {
    .agenda { padding-top: 1.25rem; }
    .agenda-filters__label { min-width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) { .agenda-past summary i { transition: none; } }
</style>
