<script lang="ts">
  import type { PageData } from './$types';
  import LatestList from '$components/home/LatestList.svelte';
  import Pagination from '$components/common/Pagination.svelte';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';
  import { compactNumber, imgFallback, timeAgo } from '$lib/format';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { paginationPath } from '$lib/pagination';
  import { initials } from '$lib/user';

  export let data: PageData;

  $: ({ profile, username, page, sort } = data);
  $: ({ user, stats, achievements, articles, beats } = profile);
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: base = `/@${encodeURIComponent(username)}`;
  $: firstName = user.name.split(' ')[0];

  const BADGES: Record<string, { icon: string; label: string; title: string }> = {
    admin: { icon: 'bi-shield-check', label: 'Redaksi', title: 'Bagian dari tim redaksi' },
    '15_articles': { icon: 'bi-pencil-fill', label: 'Penulis produktif', title: 'Sudah menerbitkan 15 artikel atau lebih' },
    '5_articles': { icon: 'bi-pencil', label: 'Penulis aktif', title: 'Sudah menerbitkan 5 artikel atau lebih' },
    '1k_views': { icon: 'bi-eye', label: '1.000+ pembaca', title: 'Tulisannya sudah dibaca lebih dari 1.000 kali' },
    '100_likes': { icon: 'bi-heart', label: '100+ suka', title: 'Lebih dari 100 suka dari pembaca' },
    '1_year': { icon: 'bi-calendar-check', label: 'Setahun lebih', title: 'Bergabung lebih dari setahun' },
  };
  // "Produktif" already implies "aktif"; show the higher tier only.
  $: badges = Object.keys(BADGES)
    .filter((key) => achievements.includes(key))
    .filter((key) => !(key === '5_articles' && achievements.includes('15_articles')))
    .map((key) => BADGES[key]);

  const SHADES = ['var(--site-dark, #111)', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb'];
  $: beatTotal = beats.reduce((sum, b) => sum + b.count, 0);
  $: topBeats = beats.slice(0, 4);
  $: otherCount = beats.slice(4).reduce((sum, b) => sum + b.count, 0);
  $: segments = [
    ...topBeats.map((b, i) => ({ label: b.name, href: `/category/${b.slug}`, count: b.count, color: SHADES[i] })),
    ...(otherCount ? [{ label: 'Lainnya', href: null, count: otherCount, color: SHADES[4] }] : []),
  ].map((s) => ({ ...s, pct: beatTotal ? Math.round((s.count / beatTotal) * 100) : 0 }));

  const social = (value: string | null, host: string) =>
    !value ? null : /^https?:\/\//i.test(value) ? value : `https://www.${host}/${value.replace(/^@/, '')}`;
  $: instagram = social(user.instagram, 'instagram.com');
  $: facebook = social(user.facebook, 'facebook.com');

  function memberSince(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  function href(p: number, s = sort): string {
    const q = new URLSearchParams();
    if (s === 'popular') q.set('sort', 'popular');
    if (p > 1) q.set('page', String(p));
    return `${base}${q.size ? `?${q}` : ''}`;
  }
  const buildUrl = (p: number) => href(p);

  $: canonicalUrl = absoluteUrl(paginationPath(base, sort === 'popular' ? 1 : page));
  $: description = user.description ?? `Artikel dan liputan ${user.name} di ${siteName}${beats[0] ? `, kebanyakan tentang ${beats[0].name}` : ''}.`;
  $: listItems = articles.data.map((a) => ({ ...a, author: null }));
</script>

<svelte:head>
  <title>{user.name} (@{username}){page > 1 ? ` · Halaman ${page}` : ''} - {siteName}</title>
  <meta name="description" content={description} />
  <meta name="robots" content={sort === 'popular' ? 'noindex, follow' : 'index, follow'} />
  <link rel="canonical" href={canonicalUrl} />
  {#if sort === 'latest' && page > 1}<link rel="prev" href={absoluteUrl(href(page - 1))} />{/if}
  {#if sort === 'latest' && page < articles.meta.totalPages}<link rel="next" href={absoluteUrl(href(page + 1))} />{/if}
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="{user.name} (@{username}) — {siteName}" />
  <meta property="og:description" content={description} />
  {#if user.img}<meta property="og:image" content={user.img} />{/if}
  <meta property="og:url" content={canonicalUrl} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{user.name} (@{username}) — {siteName}" />
  <meta name="twitter:description" content={description} />
  {#if user.img}<meta name="twitter:image" content={user.img} />{/if}
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: absoluteUrl(base),
    ...(user.createdAt ? { dateCreated: user.createdAt } : {}),
    mainEntity: {
      '@type': 'Person',
      name: user.name,
      alternateName: `@${username}`,
      url: absoluteUrl(base),
      ...(user.img ? { image: user.img } : {}),
      ...(user.description ? { description: user.description } : {}),
      ...(instagram || facebook ? { sameAs: [instagram, facebook].filter(Boolean) } : {}),
      ...(beats.length ? { knowsAbout: beats.slice(0, 4).map((b) => b.name) } : {}),
      interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WriteAction', userInteractionCount: stats.totalArticles },
    },
  })}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(
    buildBreadcrumb([{ name: 'Penulis', path: '/author' }, { name: user.name, path: base }]),
  )}<\/script>`}
</svelte:head>

<div class="pf container-xl">
  <nav class="pf-crumbs" aria-label="Breadcrumb">
    <a href="/">Beranda</a><i class="bi bi-chevron-right" aria-hidden="true"></i>
    <a href="/author">Penulis</a><i class="bi bi-chevron-right" aria-hidden="true"></i>
    <span aria-current="page">{user.name}</span>
  </nav>

  <header class="pf-head">
    <div class="pf-avatar" aria-hidden="true">
      {#if user.img}
        <img src={imgUrl(user.img, 320) ?? user.img} srcset={imgSrcset(user.img, 120)} sizes="120px" alt="" decoding="async" on:error={imgFallback} />
      {:else}
        <span>{initials(user.name)}</span>
      {/if}
    </div>
    <div class="pf-head__text">
      <h1>{user.name}</h1>
      <p class="pf-handle">@{username}</p>
      {#if badges.length}
        <ul class="pf-badges" aria-label="Pencapaian">
          {#each badges as b (b.label)}
            <li title={b.title}><i class="bi {b.icon}" aria-hidden="true"></i>{b.label}</li>
          {/each}
        </ul>
      {/if}
      <p class="pf-bio">{user.description ?? `Menulis untuk ${siteName}${beats[0] ? `, paling sering tentang ${beats[0].name}` : ''}.`}</p>
      {#if instagram || facebook}
        <div class="pf-social">
          {#if instagram}<a href={instagram} target="_blank" rel="noopener me"><i class="bi bi-instagram" aria-hidden="true"></i> Instagram</a>{/if}
          {#if facebook}<a href={facebook} target="_blank" rel="noopener me"><i class="bi bi-facebook" aria-hidden="true"></i> Facebook</a>{/if}
        </div>
      {/if}
    </div>
  </header>

  <dl class="pf-stats">
    <div><dt>Artikel</dt><dd>{stats.totalArticles.toLocaleString('id-ID')}</dd></div>
    <div><dt>Dibaca</dt><dd title="{stats.totalViews.toLocaleString('id-ID')} kali">{compactNumber(stats.totalViews)}</dd></div>
    {#if stats.totalLikes > 0}<div><dt>Disukai</dt><dd>{stats.totalLikes.toLocaleString('id-ID')}</dd></div>{/if}
    <div><dt>Terakhir terbit</dt><dd>{profile.latestPublishDate ? timeAgo(profile.latestPublishDate) : '—'}</dd></div>
    <div><dt>Bergabung</dt><dd>{memberSince(user.createdAt)}</dd></div>
  </dl>

  <div class="pf-grid">
    <section class="pf-main" aria-labelledby="pf-articles">
      <div class="pf-bar">
        <h2 id="pf-articles">{sort === 'popular' ? `Tulisan ${firstName} yang paling dibaca` : `Tulisan terbaru ${firstName}`}</h2>
        <div class="pf-sort" role="group" aria-label="Urutkan artikel">
          <a href={href(1, 'latest')} class:is-active={sort === 'latest'} aria-current={sort === 'latest' ? 'true' : undefined}>Terbaru</a>
          <a href={href(1, 'popular')} class:is-active={sort === 'popular'} aria-current={sort === 'popular' ? 'true' : undefined}>Terpopuler</a>
        </div>
      </div>

      {#if listItems.length}
        <LatestList articles={listItems} showAuthor={false} />
        {#if articles.meta.totalPages > 1}
          <div class="pf-pager"><Pagination currentPage={page} totalPages={articles.meta.totalPages} {buildUrl} /></div>
        {/if}
      {:else}
        <div class="pf-empty">
          <i class="bi bi-journal-text" aria-hidden="true"></i>
          <h3>Belum ada artikel terbit</h3>
          <p>Tulisan {user.name} akan muncul di sini begitu diterbitkan.</p>
        </div>
      {/if}
    </section>

    <aside class="pf-aside" aria-label="Tentang tulisan {user.name}">
      {#if segments.length}
        <section class="pf-beats" aria-labelledby="pf-beats-h">
          <h2 id="pf-beats-h">Sering menulis tentang</h2>
          <div class="pf-beats__bar" aria-hidden="true">
            {#each segments as s (s.label)}<span style:width="{Math.max(s.pct, 2)}%" style:background={s.color}></span>{/each}
          </div>
          <ul class="pf-beats__legend">
            {#each segments as s (s.label)}
              <li>
                <span class="pf-beats__dot" style:background={s.color} aria-hidden="true"></span>
                {#if s.href}<a href={s.href}>{s.label}</a>{:else}<span>{s.label}</span>{/if}
                <span class="pf-beats__pct">{s.pct}% · {s.count}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if stats.totalArticles > 0}
        <form class="pf-find" role="search" action="/search" method="GET">
          <label for="pf-find-q">Cari di tulisan {firstName}</label>
          <input type="hidden" name="author" value={username} />
          <div class="pf-find__field">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input id="pf-find-q" name="q" type="search" placeholder="Judul, game, anime…" autocomplete="off" minlength="2" required enterkeyhint="search" />
            <button type="submit" aria-label="Cari"><i class="bi bi-arrow-right" aria-hidden="true"></i></button>
          </div>
        </form>
      {/if}

      <a class="pf-all" href="/author">Lihat semua penulis <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
    </aside>
  </div>
</div>

<style>
  .pf { padding-top: 1.5rem; padding-bottom: 3.5rem; }

  .pf-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-bottom: 1.25rem; font-size: 0.8125rem; color: #6b7280; }
  .pf-crumbs a { color: #4b5563; text-decoration: none; }
  .pf-crumbs a:hover { color: #1a1a1a; text-decoration: underline; }
  .pf-crumbs i { font-size: 0.65rem; }
  .pf-crumbs span { color: #1a1a1a; font-weight: 600; }

  .pf-head { display: flex; align-items: flex-start; gap: 1.75rem; }
  .pf-avatar { flex: 0 0 120px; width: 120px; height: 120px; overflow: hidden; border-radius: 50%; background: var(--site-primary, #f1ff32); box-shadow: 0 0 0 4px #fff, 0 0 0 5px #ececec; }
  .pf-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pf-avatar span { display: grid; place-items: center; width: 100%; height: 100%; color: var(--site-primary-contrast, #111); font-size: 2.5rem; font-weight: 900; letter-spacing: -0.03em; }
  .pf-head__text { min-width: 0; padding-top: 0.25rem; }
  .pf-head h1 { margin: 0; font-size: clamp(1.875rem, 3.4vw, 2.625rem); font-weight: 900; letter-spacing: -0.035em; line-height: 1.05; overflow-wrap: anywhere; }
  .pf-handle { margin: 0.3rem 0 0; color: #6b7280; font-size: 0.9375rem; font-weight: 600; }
  .pf-badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.75rem 0 0; padding: 0; list-style: none; }
  .pf-badges li { display: inline-flex; align-items: center; gap: 0.35rem; min-height: 28px; padding: 0 0.65rem; border-radius: 999px; background: #f3f4f6; color: #1f2937; font-size: 0.75rem; font-weight: 700; }
  .pf-badges li:first-child { background: var(--site-dark, #111); color: #fff; }
  .pf-badges li:first-child i { color: var(--site-primary, #f1ff32); }
  .pf-bio { max-width: 62ch; margin: 0.85rem 0 0; color: #374151; font-size: 0.9375rem; line-height: 1.6; }
  .pf-social { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.85rem; }
  .pf-social a { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 36px; padding: 0 0.85rem; border: 1px solid #e5e7eb; border-radius: 999px; color: #111; font-size: 0.8125rem; font-weight: 700; text-decoration: none; }
  .pf-social a:hover { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .pf-stats { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; margin: 1.75rem 0 2rem; padding: 0.9rem 0; border-top: 1px solid #ececec; border-bottom: 1px solid #ececec; }
  .pf-stats div { padding: 0 1.25rem; }
  .pf-stats div:first-child { padding-left: 0; }
  .pf-stats div + div { border-left: 1px solid #ececec; }
  .pf-stats dt { color: #6b7280; font-size: 0.75rem; font-weight: 600; }
  .pf-stats dd { margin: 0.15rem 0 0; color: #111; font-size: 1.125rem; font-weight: 800; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; white-space: nowrap; }

  .pf-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 320px); gap: 2.5rem; align-items: start; }
  .pf-main { min-width: 0; }
  .pf-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1rem; }
  .pf-bar h2 { margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.015em; }
  .pf-sort { display: inline-flex; gap: 0.2rem; padding: 0.2rem; border-radius: 999px; background: #f3f4f6; }
  .pf-sort a { display: inline-flex; align-items: center; min-height: 32px; padding: 0 0.85rem; border-radius: 999px; color: #4b5563; font-size: 0.8125rem; font-weight: 700; text-decoration: none; transition: background-color 160ms ease, color 160ms ease; }
  .pf-sort a:hover { color: #111; }
  .pf-sort a.is-active { background: var(--site-dark, #111); color: #fff; }
  .pf-pager { display: flex; justify-content: center; margin-top: 2rem; }

  .pf-empty { padding: 2.5rem 1.5rem; border: 1px dashed #d1d5db; border-radius: 18px; text-align: center; }
  .pf-empty > i { display: block; margin-bottom: 0.5rem; font-size: 1.75rem; color: #9ca3af; }
  .pf-empty h3 { margin: 0 0 0.35rem; font-size: 1.0625rem; font-weight: 800; }
  .pf-empty p { margin: 0; color: #6b7280; font-size: 0.875rem; }

  .pf-aside { position: sticky; top: 80px; display: grid; gap: 1.75rem; }
  .pf-beats h2, .pf-find label { display: block; margin: 0 0 0.75rem; font-size: 1rem; font-weight: 800; }
  .pf-beats__bar { display: flex; gap: 2px; height: 10px; overflow: hidden; border-radius: 999px; }
  .pf-beats__bar span { display: block; height: 100%; }
  .pf-beats__legend { display: grid; gap: 0.15rem; margin: 0.85rem 0 0; padding: 0; list-style: none; }
  .pf-beats__legend li { display: flex; align-items: center; gap: 0.55rem; min-height: 32px; font-size: 0.875rem; }
  .pf-beats__legend a { color: #111; font-weight: 700; text-decoration: none; }
  .pf-beats__legend a:hover { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .pf-beats__legend > li > span:not(.pf-beats__dot):not(.pf-beats__pct) { color: #4b5563; font-weight: 700; }
  .pf-beats__dot { flex: 0 0 10px; width: 10px; height: 10px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
  .pf-beats__pct { margin-left: auto; color: #6b7280; font-size: 0.75rem; font-variant-numeric: tabular-nums; }

  .pf-find__field { position: relative; display: flex; align-items: center; height: 42px; border: 1px solid #d1d5db; border-radius: 999px; background: #fff; transition: border-color 160ms ease, box-shadow 160ms ease; }
  .pf-find__field:focus-within { border-color: var(--site-dark, #111); box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-primary, #f1ff32) 55%, transparent); }
  .pf-find__field > i { position: absolute; left: 0.9rem; color: #9ca3af; font-size: 0.875rem; }
  .pf-find__field input { flex: 1; min-width: 0; height: 100%; padding: 0 0.5rem 0 2.25rem; border: 0; background: transparent; font-size: 0.875rem; color: #1a1a1a; outline: none; }
  .pf-find__field button { display: grid; place-items: center; width: 34px; height: 34px; margin-right: 4px; border: 0; border-radius: 50%; background: var(--site-dark, #111); color: #fff; }
  .pf-find__field button:hover, .pf-find__field button:focus-visible { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .pf-all { justify-self: start; color: #111; font-size: 0.875rem; font-weight: 700; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }

  .pf :is(a, button):focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  @media (max-width: 991px) {
    .pf-grid { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
    .pf-aside { position: static; }
    .pf-stats { grid-auto-flow: row; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.85rem 1rem; }
    .pf-stats div, .pf-stats div:first-child { padding: 0; border-left: 0; }
    .pf-stats div + div { border-left: 0; }
  }
  @media (max-width: 575px) {
    .pf { padding-top: 1rem; }
    .pf-head { flex-direction: column; gap: 1rem; }
    .pf-avatar { flex-basis: auto; width: 88px; height: 88px; }
    .pf-avatar span { font-size: 1.875rem; }
    .pf-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
