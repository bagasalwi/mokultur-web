<script lang="ts">
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import type { SearchArticle } from '$lib/api';
  import Pagination from '$components/common/Pagination.svelte';
  import LatestList from '$components/home/LatestList.svelte';
  import { absoluteUrl } from '$lib/seo';
  import { imgFallback, timeAgo } from '$lib/format';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { highlight, queryWords, rememberSearch, reportSearch, searchHref } from '$lib/search';

  export let data: PageData;

  const SORTS = [
    { id: 'relevance', label: 'Paling relevan' },
    { id: 'latest', label: 'Terbaru' },
    { id: 'popular', label: 'Terpopuler' },
  ] as const;
  const PERIODS = [
    { id: '', label: 'Kapan saja' },
    { id: 'week', label: '7 hari' },
    { id: 'month', label: '30 hari' },
    { id: 'year', label: 'Setahun' },
  ] as const;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: result = data.result;
  $: total = result?.meta.total ?? 0;
  $: words = result?.tokens?.length ? result.tokens : queryWords(data.q);
  $: hasFilters = !!(data.period || data.category || data.author || data.tag);
  $: entities = result?.entities;
  $: shortcuts = entities
    ? [
        ...entities.authors.map((a) => ({ href: `/@${encodeURIComponent(a.username)}`, icon: 'bi-person', img: a.img ?? null, name: a.name, meta: `Penulis · @${a.username} · ${a.count} artikel` })),
        ...entities.topics.map((t) => ({ href: t.href, icon: 'bi-compass', img: null, name: t.label, meta: 'Topik' })),
        ...entities.categories.map((c) => ({ href: `/category/${c.slug}`, icon: 'bi-folder2', img: null, name: c.name, meta: `Kategori · ${c.count}` })),
        ...entities.tags.map((t) => ({ href: `/tag/${t.slug}`, icon: 'bi-hash', img: null, name: t.name, meta: `Tag · ${t.count}` })),
      ].slice(0, 8)
    : [];
  $: firstShown = total ? (data.page - 1) * (result?.meta.perPage ?? 12) + 1 : 0;
  $: lastShown = total ? firstShown + (result?.data.length ?? 0) - 1 : 0;
  $: categoryName = result?.facets.categories.find((c) => c.slug === data.category)?.name ?? data.category;
  $: authorName = result?.facets.authors.find((a) => a.username === data.author)?.name ?? data.author;
  $: title = data.q ? `Cari “${data.q}”` : 'Pencarian';
  // The popular-tags endpoint can repeat a slug (Spatie near-duplicates).
  $: popularTags = data.popularTags.filter((t, i, list) => list.findIndex((x) => x.slug === t.slug) === i);

  type Changes = Partial<Record<'q' | 'sort' | 'period' | 'category' | 'author' | 'tag' | 'page', string | number | null>>;

  /** The current search with some parameters changed; any change but paging returns to page 1. */
  function link(changes: Changes): string {
    const state: Record<string, string | number | null> = {
      q: data.q,
      sort: data.sort === 'relevance' ? null : data.sort,
      period: data.period || null,
      category: data.category || null,
      author: data.author || null,
      tag: data.tag || null,
      page: null,
      ...changes,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
      if (value !== null && value !== '' && !(key === 'sort' && value === 'relevance') && !(key === 'page' && Number(value) <= 1)) {
        params.set(key, String(value));
      }
    }
    return `/search?${params}`;
  }
  const buildUrl = (page: number) => link({ page });
  const articleHref = (a: SearchArticle) => `/article/${a.id}/${a.slug}`;

  // A finished search, reported once per query (not per filter or page).
  let reported = '';
  $: if (browser && result && data.q && reported !== data.q.toLowerCase()) {
    reported = data.q.toLowerCase();
    rememberSearch(data.q);
    if (data.page === 1) reportSearch(data.q, 'page');
  }
</script>

<svelte:head>
  <title>{title} - {siteName}</title>
  <meta name="description" content="Cari artikel {siteName} berdasarkan judul, topik, tag, kategori, atau penulis." />
  <meta name="robots" content="noindex, follow" />
  <link rel="canonical" href={absoluteUrl('/search')} />
</svelte:head>

<div class="srch container-xl">
  <header class="srch-head">
    <nav class="srch-crumbs" aria-label="Breadcrumb">
      <a href="/">Beranda</a><i class="bi bi-chevron-right" aria-hidden="true"></i>
      {#if data.q}<a href="/search">Pencarian</a><i class="bi bi-chevron-right" aria-hidden="true"></i><span aria-current="page">“{data.q}”</span>{:else}<span aria-current="page">Pencarian</span>{/if}
    </nav>
    <h1>{#if data.q}Hasil untuk “{data.q}”{:else}Cari di {siteName}{/if}</h1>

    <form class="srch-form" role="search" action="/search" method="GET">
      <label class="visually-hidden" for="srch-q">Kata kunci</label>
      <i class="bi bi-search" aria-hidden="true"></i>
      <input
        id="srch-q"
        name="q"
        type="search"
        value={data.q}
        placeholder="Cari artikel, topik, atau penulis…"
        autocomplete="off"
        enterkeyhint="search"
        maxlength="100"
        required
        minlength="2"
      />
      <button type="submit" class="srch-form__go">Cari</button>
    </form>

    {#if !data.q}
      <p class="srch-head__lead">Judul, isi artikel, tag, kategori, sampai nama penulis ikut dicari. Tekan <kbd>/</kbd> dari halaman mana pun untuk langsung mencari.</p>
    {:else if result?.didYouMean}
      <p class="srch-notice">
        Mungkin maksud kamu <a href={searchHref(result.didYouMean)}><strong>{result.didYouMean}</strong></a>?
      </p>
    {/if}
    {#if result?.mode === 'any' && total > 0}
      <p class="srch-notice srch-notice--soft">Tidak ada artikel yang memuat semua kata “{data.q}”. Berikut yang paling mendekati.</p>
    {/if}
  </header>

  {#if data.error}
    <div class="srch-empty" role="alert">
      <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
      <h2>Pencarian belum bisa ditampilkan</h2>
      <p>{data.error}</p>
      <a class="theme-btn theme-btn--see-all theme-btn--sm" href={link({})}><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Coba lagi</a>
    </div>
  {:else if result}
    {#if shortcuts.length}
      <nav class="srch-shortcuts" aria-label="Langsung ke topik, kategori, atau penulis">
        <ul>
          {#each shortcuts as item (item.icon + item.href)}
            <li>
              <a href={item.href}>
                <span class="srch-shortcuts__icon" class:srch-shortcuts__icon--face={!!item.img} aria-hidden="true">
                  {#if item.img}<img src={imgUrl(item.img, 96) ?? item.img} alt="" loading="lazy" decoding="async" on:error={imgFallback} />{:else}<i class="bi {item.icon}"></i>{/if}
                </span>
                <span class="srch-shortcuts__text"><strong>{item.name}</strong><small>{item.meta}</small></span>
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}

    <div class="srch-grid" class:srch-grid--solo={!!total || !(data.trending.length || popularTags.length)}>
      <section class="srch-main" aria-labelledby="srch-results-heading">
        <h2 id="srch-results-heading" class="visually-hidden">Artikel</h2>

        <div class="srch-filters">
          <div class="srch-filter" role="group" aria-label="Waktu terbit">
            <span class="srch-filter__label">Waktu</span>
            <ul>
              {#each PERIODS as p (p.id)}
                <li><a href={link({ period: p.id || null })} class:is-active={data.period === p.id} aria-current={data.period === p.id ? 'true' : undefined}>{p.label}</a></li>
              {/each}
            </ul>
          </div>
          {#if result.facets.categories.length > 1 || data.category}
            <div class="srch-filter" role="group" aria-label="Kategori">
              <span class="srch-filter__label">Kategori</span>
              <ul>
                <li><a href={link({ category: null })} class:is-active={!data.category} aria-current={!data.category ? 'true' : undefined}>Semua</a></li>
                {#if data.category && !result.facets.categories.some((c) => c.slug === data.category)}
                  <li><a href={link({ category: null })} class="is-active" aria-current="true">{categoryName} <span aria-hidden="true">·</span> 0</a></li>
                {/if}
                {#each result.facets.categories as c (c.slug)}
                  <li><a href={link({ category: c.slug })} class:is-active={data.category === c.slug} aria-current={data.category === c.slug ? 'true' : undefined}>{c.name} <span class="srch-filter__count">{c.count}</span></a></li>
                {/each}
              </ul>
            </div>
          {/if}
          {#if result.facets.authors.length > 1 || data.author}
            <div class="srch-filter" role="group" aria-label="Penulis">
              <span class="srch-filter__label">Penulis</span>
              <ul>
                <li><a href={link({ author: null })} class:is-active={!data.author} aria-current={!data.author ? 'true' : undefined}>Semua</a></li>
                {#if data.author && !result.facets.authors.some((a) => a.username === data.author)}
                  <li><a href={link({ author: null })} class="is-active" aria-current="true">{authorName} <span aria-hidden="true">·</span> 0</a></li>
                {/if}
                {#each result.facets.authors as a (a.username)}
                  <li><a href={link({ author: a.username })} class:is-active={data.author === a.username} aria-current={data.author === a.username ? 'true' : undefined}>{a.name} <span class="srch-filter__count">{a.count}</span></a></li>
                {/each}
              </ul>
            </div>
          {/if}
          {#if data.tag}
            <div class="srch-filter" role="group" aria-label="Tag">
              <span class="srch-filter__label">Tag</span>
              <ul><li><a href={link({ tag: null })} class="is-active" aria-label="Hapus filter tag {data.tag}">#{data.tag} <i class="bi bi-x" aria-hidden="true"></i></a></li></ul>
            </div>
          {/if}
        </div>

        {#if total > 0}
          <div class="srch-bar">
            <p class="srch-bar__count">
              <strong>{total.toLocaleString('id-ID')}</strong> artikel{#if result.meta.totalPages > 1}<span class="srch-bar__range">menampilkan {firstShown}–{lastShown}</span>{/if}
            </p>
            <div class="srch-sort" role="group" aria-label="Urutkan">
              {#each SORTS as s (s.id)}
                <a href={link({ sort: s.id })} class:is-active={data.sort === s.id} aria-current={data.sort === s.id ? 'true' : undefined}>{s.label}</a>
              {/each}
            </div>
          </div>

          <ol class="srch-list">
            {#each result.data as a (a.id)}
              <li class="srch-hit">
                <a class="srch-hit__thumb" href={articleHref(a)} tabindex="-1" aria-hidden="true">
                  <img src={imgUrl(a.image, 480) ?? '/images/noimage.png'} srcset={imgSrcset(a.image, 200)} sizes="(max-width: 575px) 104px, 200px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
                </a>
                <div class="srch-hit__body">
                  <h3 class="srch-hit__title">
                    <a href={articleHref(a)}>{#each highlight(a.title, words) as part}{#if part.hit}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</a>
                  </h3>
                  {#if a.snippet}
                    <p class="srch-hit__snippet">{#each highlight(a.snippet, words) as part}{#if part.hit}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</p>
                  {/if}
                  <p class="srch-hit__meta">
                    {#if a.category}<a class="srch-hit__cat" href="/category/{a.category.slug}">{a.category.name}</a>{/if}
                    {#if a.isReview}<span class="srch-hit__flag">Review</span>{/if}
                    <time datetime={a.publishDate ?? ''}>{timeAgo(a.publishDate)}</time>
                    {#if a.author?.name}
                      {#if a.author.username}<a class="srch-hit__author" href="/@{encodeURIComponent(a.author.username)}">{a.author.name}</a>{:else}<span class="srch-hit__author">{a.author.name}</span>{/if}
                    {/if}
                  </p>
                </div>
              </li>
            {/each}
          </ol>

          {#if result.meta.totalPages > 1}
            <div class="srch-pager">
              <Pagination currentPage={data.page} totalPages={result.meta.totalPages} {buildUrl} />
            </div>
          {/if}
        {:else}
          <div class="srch-empty">
            <i class="bi bi-search" aria-hidden="true"></i>
            <h2>Belum ada artikel untuk “{data.q}”{#if hasFilters} dengan filter ini{/if}</h2>
            {#if result.didYouMean}
              <p>Mungkin maksud kamu <a href={searchHref(result.didYouMean)}><strong>{result.didYouMean}</strong></a>?</p>
            {:else}
              <p>Periksa ejaannya, atau pakai kata yang lebih umum: misalnya judul anime atau nama game saja, tanpa embel-embel.</p>
            {/if}
            {#if hasFilters}
              <a class="theme-btn theme-btn--see-all theme-btn--sm" href={link({ period: null, category: null, author: null, tag: null })}><i class="bi bi-x-lg" aria-hidden="true"></i> Hapus semua filter</a>
            {/if}
          </div>
        {/if}
      </section>

      {#if !total && (data.trending.length || popularTags.length)}
        <aside class="srch-aside" aria-label="Coba cari">
          {@render discover()}
        </aside>
      {/if}
    </div>
  {:else}
    <div class="srch-start">
      {@render discover()}
      {#if data.categories?.length}
        <section class="srch-block" aria-labelledby="srch-cats">
          <h2 id="srch-cats">Jelajahi kategori</h2>
          <ul class="srch-chips">
            {#each data.categories as c (c.slug)}
              <li><a href="/category/{c.slug}">{c.name}</a></li>
            {/each}
          </ul>
        </section>
      {/if}
      {#if data.latest.length}
        <section class="srch-block srch-block--wide" aria-labelledby="srch-latest">
          <h2 id="srch-latest">Baru terbit</h2>
          <LatestList articles={data.latest} />
        </section>
      {/if}
    </div>
  {/if}
</div>

{#snippet discover()}
  {#if data.trending.length}
    <section class="srch-block" aria-labelledby="srch-trending">
      <h2 id="srch-trending">Lagi dicari</h2>
      <ul class="srch-chips">
        {#each data.trending as q (q)}
          <li><a href={searchHref(q)}><i class="bi bi-graph-up-arrow" aria-hidden="true"></i> {q}</a></li>
        {/each}
      </ul>
    </section>
  {/if}
  {#if popularTags.length}
    <section class="srch-block" aria-labelledby="srch-tags">
      <h2 id="srch-tags">Topik populer</h2>
      <ul class="srch-chips">
        {#each popularTags as t (t.slug)}
          <li><a href="/tag/{t.slug}">#{t.name}</a></li>
        {/each}
      </ul>
    </section>
  {/if}
{/snippet}

<style>
  .srch { padding-top: 1.5rem; padding-bottom: 3.5rem; }

  .srch-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-bottom: 0.75rem; font-size: 0.8125rem; color: #6b7280; }
  .srch-crumbs a { color: #4b5563; text-decoration: none; }
  .srch-crumbs a:hover { color: #1a1a1a; text-decoration: underline; }
  .srch-crumbs i { font-size: 0.65rem; }
  .srch-crumbs span { min-width: 0; overflow: hidden; color: #1a1a1a; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }

  .srch-head { max-width: 860px; margin-bottom: 1.5rem; }
  .srch-head h1 {
    margin: 0 0 1rem;
    font-size: clamp(1.625rem, 3vw, 2.25rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.12;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }
  .srch-head__lead { margin: 0.85rem 0 0; max-width: 62ch; color: #4b5563; font-size: 0.9375rem; line-height: 1.55; }

  .srch-form {
    position: relative;
    display: flex;
    align-items: center;
    height: 56px;
    border: 2px solid var(--site-dark, #111);
    border-radius: 14px;
    background: #fff;
    transition: box-shadow 160ms ease;
  }
  .srch-form:focus-within { box-shadow: 0 0 0 4px color-mix(in srgb, var(--site-primary, #f1ff32) 70%, transparent); }
  .srch-form > i { position: absolute; left: 1.1rem; color: #4b5563; font-size: 1.1rem; }
  .srch-form input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 0.75rem 0 3rem;
    border: 0;
    background: transparent;
    color: #111;
    font-size: 1.0625rem;
    font-weight: 600;
    outline: none;
  }
  .srch-form input::placeholder { color: #8b919a; font-weight: 500; }
  .srch-form input::selection { background: var(--site-primary, #f1ff32); color: #111; }
  .srch-form__go {
    align-self: stretch;
    margin: 5px;
    padding: 0 1.4rem;
    border: 0;
    border-radius: 9px;
    background: var(--site-dark, #111);
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 800;
    transition: background-color 160ms ease, color 160ms ease;
  }
  .srch-form__go:hover,
  .srch-form__go:focus-visible { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .srch-notice { margin: 0.85rem 0 0; color: #1a1a1a; font-size: 0.9375rem; }
  .srch-notice a { color: inherit; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 3px; text-underline-offset: 3px; }
  .srch-notice--soft { color: #4b5563; font-size: 0.875rem; }

  .srch kbd {
    display: inline-grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    padding: 0 0.3rem;
    border: 1px solid #d1d5db;
    border-bottom-width: 2px;
    border-radius: 5px;
    background: #fff;
    color: #111;
    font: 700 0.75rem/1 inherit;
  }

  .srch mark { padding: 0 0.08em; border-radius: 3px; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  /* Shortcuts: the tag, category or author the query names, one tap away. */
  .srch-shortcuts { margin-bottom: 1.75rem; }
  .srch-shortcuts ul { display: flex; gap: 0.5rem; margin: 0; padding: 0 0 0.25rem; list-style: none; overflow-x: auto; scrollbar-width: none; }
  .srch-shortcuts ul::-webkit-scrollbar { display: none; }
  .srch-shortcuts a {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 52px;
    padding: 0.4rem 1rem 0.4rem 0.45rem;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    background: #fff;
    color: #1a1a1a;
    text-decoration: none;
    white-space: nowrap;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }
  .srch-shortcuts a:hover { border-color: var(--site-dark, #111); box-shadow: 0 6px 16px rgba(10, 10, 10, 0.08); }
  .srch-shortcuts__icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--site-dark, #111); color: var(--site-primary, #f1ff32); }
  .srch-shortcuts__icon--face { overflow: hidden; border-radius: 50%; background: #eef0f2; }
  .srch-shortcuts__icon--face img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .srch-shortcuts__text { display: grid; line-height: 1.2; }
  .srch-shortcuts__text strong { font-size: 0.875rem; font-weight: 800; }
  .srch-shortcuts__text small { color: #6b7280; font-size: 0.75rem; font-variant-numeric: tabular-nums; }

  .srch-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 320px); gap: 2.5rem; align-items: start; }
  .srch-grid--solo { grid-template-columns: minmax(0, 880px); }
  .srch-main { min-width: 0; grid-column: 1; }

  .srch-filters { display: grid; gap: 0.6rem; padding-bottom: 1.1rem; margin-bottom: 0.25rem; border-bottom: 1px solid #ececec; }
  .srch-filter { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
  .srch-filter__label { flex: 0 0 4.5rem; color: #6b7280; font-size: 0.75rem; font-weight: 700; }
  .srch-filter ul { display: flex; gap: 0.35rem; min-width: 0; margin: 0; padding: 0; list-style: none; overflow-x: auto; scrollbar-width: none; }
  .srch-filter ul::-webkit-scrollbar { display: none; }
  .srch-filter a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 34px;
    padding: 0 0.8rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #fff;
    color: #374151;
    font-size: 0.8125rem;
    font-weight: 700;
    white-space: nowrap;
    text-decoration: none;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .srch-filter a:hover { border-color: var(--site-dark, #111); color: #111; }
  .srch-filter a.is-active { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .srch-filter__count { color: #6b7280; font-weight: 600; font-variant-numeric: tabular-nums; }
  .srch-filter a.is-active .srch-filter__count { color: inherit; }

  .srch-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem 1rem; padding: 1rem 0 0.25rem; }
  .srch-bar__count { margin: 0; color: #4b5563; font-size: 0.875rem; font-variant-numeric: tabular-nums; }
  .srch-bar__count strong { color: #111; font-weight: 800; }
  .srch-bar__range::before { content: '·'; margin: 0 0.4rem; color: #9ca3af; }

  .srch-sort { display: inline-flex; gap: 0.2rem; padding: 0.2rem; border-radius: 999px; background: #f3f4f6; }
  .srch-sort a {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 0.85rem;
    border-radius: 999px;
    color: #4b5563;
    font-size: 0.8125rem;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 160ms ease, color 160ms ease;
  }
  .srch-sort a:hover { color: #111; }
  .srch-sort a.is-active { background: var(--site-dark, #111); color: #fff; }

  .srch-list { margin: 0; padding: 0; list-style: none; }
  .srch-hit { display: flex; gap: 1.25rem; padding: 1.1rem 0; border-bottom: 1px solid #ececec; }
  .srch-hit__thumb { flex: 0 0 200px; align-self: flex-start; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 10px; background: #f0f0f0; }
  .srch-hit__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .srch-hit__body { display: grid; align-content: start; gap: 0.4rem; min-width: 0; }
  .srch-hit__title { margin: 0; font-size: 1.125rem; font-weight: 800; line-height: 1.32; letter-spacing: -0.01em; overflow-wrap: anywhere; }
  .srch-hit__title a { color: #1a1a1a; text-decoration: none; }
  .srch-hit__title a:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .srch-hit__snippet {
    margin: 0;
    max-width: 75ch;
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .srch-hit__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem; margin: 0.1rem 0 0; color: #6b7280; font-size: 0.75rem; }
  .srch-hit__cat {
    padding: 0.125rem 0.4rem;
    border-radius: 4px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-badge-text, #111);
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
  }
  .srch-hit__flag { padding: 0.1rem 0.4rem; border-radius: 4px; background: #111; color: #fff; font-size: 0.6875rem; font-weight: 800; }
  .srch-hit__author { color: #4b5563; text-decoration: none; }
  .srch-hit__author::before { content: 'oleh '; color: #6b7280; }
  a.srch-hit__author:hover { color: #111; text-decoration: underline; }

  .srch-pager { display: flex; justify-content: center; margin-top: 2rem; }

  .srch-empty { margin-top: 1.25rem; padding: 2.5rem 1.5rem; border: 1px dashed #d1d5db; border-radius: 18px; text-align: center; }
  .srch-empty > i { display: block; margin-bottom: 0.5rem; font-size: 1.75rem; color: #9ca3af; }
  .srch-empty h2 { margin: 0 0 0.4rem; font-size: 1.125rem; font-weight: 800; overflow-wrap: anywhere; }
  .srch-empty p { max-width: 52ch; margin: 0 auto 1rem; color: #4b5563; font-size: 0.9rem; line-height: 1.55; }
  .srch-empty p a { color: #111; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 3px; text-underline-offset: 3px; }

  .srch-aside { position: sticky; top: 80px; display: grid; gap: 1.5rem; }

  .srch-start { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem 2.5rem; max-width: 1100px; }
  .srch-block h2 { margin: 0 0 0.75rem; font-size: 1.0625rem; font-weight: 800; letter-spacing: -0.01em; }
  .srch-block--wide { grid-column: 1 / -1; }
  .srch-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .srch-chips a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 36px;
    padding: 0 0.9rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #fff;
    color: #1a1a1a;
    font-size: 0.8125rem;
    font-weight: 700;
    text-decoration: none;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .srch-chips a:hover { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .srch-chips i { color: #6b7280; font-size: 0.75rem; }

  .srch :is(a, button):focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  @media (max-width: 991px) {
    .srch-grid { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
    .srch-aside { position: static; }
  }
  @media (max-width: 575px) {
    .srch { padding-top: 1.1rem; }
    .srch-form { height: 52px; }
    .srch-form input { font-size: 1rem; padding-left: 2.6rem; }
    .srch-form > i { left: 0.9rem; }
    .srch-form__go { padding: 0 1rem; }
    .srch-filter { align-items: flex-start; flex-direction: column; gap: 0.35rem; }
    .srch-filter__label { flex: none; }
    .srch-filter ul { width: 100%; }
    .srch-hit { gap: 0.85rem; padding: 0.9rem 0; }
    .srch-hit__thumb { flex-basis: 104px; }
    .srch-hit__title { font-size: 1rem; }
    .srch-hit__snippet { -webkit-line-clamp: 3; line-clamp: 3; font-size: 0.8125rem; }
    .srch-start { grid-template-columns: minmax(0, 1fr); }
  }
</style>
