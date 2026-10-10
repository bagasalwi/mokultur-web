<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import type { Category, SearchSuggestions } from '$lib/api';
  import { getTrendingSearches, searchSuggest } from '$lib/api';
  import { imgFallback, timeAgo } from '$lib/format';
  import { imgUrl } from '$lib/img';
  import {
    clearRecent,
    highlight,
    loadRecent,
    queryWords,
    rememberSearch,
    reportSearch,
    searchHref,
  } from '$lib/search';
  import { closeSearchPalette, openSearchPalette, searchPalette } from '$lib/stores/search-palette';

  /** Shown as "Jelajahi kategori" before anything is typed. */
  export let categories: Category[] = [];

  type Kind = 'article' | 'topic' | 'tag' | 'category' | 'author' | 'all' | 'recent' | 'trending' | 'browse';
  type Option = {
    index: number;
    kind: Kind;
    href: string;
    label: string;
    meta?: string;
    image?: string | null;
    /** What gets saved to recent searches when this is chosen. */
    remember?: string;
  };
  type Group = { id: string; title: string; options: Option[]; layout?: 'chips' };

  const ICONS: Record<Kind, string> = {
    article: 'bi-file-earmark-text',
    topic: 'bi-compass',
    tag: 'bi-hash',
    category: 'bi-folder2',
    author: 'bi-person',
    all: 'bi-search',
    recent: 'bi-clock-history',
    trending: 'bi-graph-up-arrow',
    browse: 'bi-folder2',
  };

  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let query = '';
  let results: SearchSuggestions | null = null;
  let loading = false;
  let failed = false;
  let active = -1;
  let recent: string[] = [];
  let trending: string[] = [];
  let trendingRequested = false;
  let previousFocus: HTMLElement | null = null;
  let previousOverflow = '';
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cache = new Map<string, SearchSuggestions>();

  $: term = query.trim().replace(/\s+/g, ' ');
  $: key = term.toLowerCase();
  $: words = queryWords(term);
  $: typing = key.length >= 2;

  function suggest(next: string) {
    clearTimeout(timer);
    controller?.abort();
    failed = false;
    if (next.length < 2) {
      results = null;
      loading = false;
      return;
    }
    const hit = cache.get(next);
    if (hit) {
      results = hit;
      loading = false;
      return;
    }
    loading = true;
    timer = setTimeout(async () => {
      const own = new AbortController();
      controller = own;
      try {
        const data = await searchSuggest(next, own.signal);
        cache.set(next, data);
        if (key === next) results = data;
      } catch (error) {
        if ((error as Error).name !== 'AbortError' && key === next) failed = true;
      } finally {
        if (key === next) loading = false;
      }
    }, 150);
  }
  $: suggest(key);

  function build(r: SearchSuggestions | null, typed: boolean, recentList: string[], trendList: string[]): Group[] {
    let index = 0;
    const out: Group[] = [];
    const push = (id: string, title: string, items: Omit<Option, 'index'>[], layout?: 'chips') => {
      if (items.length) out.push({ id, title, layout, options: items.map((item) => ({ ...item, index: index++ })) });
    };
    if (typed) {
      if (r && r.query === key) {
        push('articles', 'Artikel', r.articles.map((a) => ({
          kind: 'article' as const,
          href: `/article/${a.id}/${a.slug}`,
          label: a.title,
          meta: [a.category, timeAgo(a.publishDate)].filter(Boolean).join(' · '),
          image: a.image,
          remember: term,
        })));
        push('entities', 'Topik, kategori & penulis', [
          ...r.topics.map((t) => ({ kind: 'topic' as const, href: t.href, label: t.label, meta: 'Topik', remember: term })),
          ...r.categories.map((c) => ({ kind: 'category' as const, href: `/category/${c.slug}`, label: c.name, meta: `Kategori · ${c.count} artikel`, remember: term })),
          ...r.tags.map((t) => ({ kind: 'tag' as const, href: `/tag/${t.slug}`, label: t.name, meta: `Tag · ${t.count} artikel`, remember: term })),
          ...r.authors.map((a) => ({ kind: 'author' as const, href: `/@${encodeURIComponent(a.username)}`, label: a.name, meta: `Penulis · @${a.username} · ${a.count} artikel`, remember: term })),
        ]);
      }
      const total = r && r.query === key ? r.total ?? 0 : 0;
      push('all', 'Pencarian', [{
        kind: 'all',
        href: searchHref(term),
        label: total > 5 ? `Lihat semua ${total.toLocaleString('id-ID')} hasil untuk “${term}”` : `Cari “${term}”`,
        remember: term,
      }]);
    } else {
      push('recent', 'Pencarian terakhir', recentList.map((q) => ({ kind: 'recent' as const, href: searchHref(q), label: q, remember: q })));
      push('trending', 'Lagi dicari', trendList.map((q) => ({ kind: 'trending' as const, href: searchHref(q), label: q, remember: q })), 'chips');
      push('browse', 'Jelajahi kategori', categories.slice(0, 10).map((c) => ({ kind: 'browse' as const, href: `/category/${c.slug}`, label: c.name })), 'chips');
    }
    return out;
  }

  $: groups = build(results, typing, recent, trending);
  $: options = groups.flatMap((g) => g.options);
  $: if (active >= options.length) active = options.length - 1;
  $: activeId = active >= 0 ? `sp-opt-${active}` : undefined;
  $: noMatches = typing && !loading && !failed && results?.query === key && !results.articles.length
    && !results.tags.length && !results.categories.length && !results.authors.length && !results.topics.length;
  $: status = !typing
    ? ''
    : loading
      ? 'Mencari…'
      : failed
        ? 'Saran tidak bisa dimuat.'
        : noMatches
          ? `Tidak ada saran untuk ${term}.`
          : `${options.length - 1} saran tersedia.`;

  function move(step: number) {
    if (!options.length) return;
    active = active + step < -1 ? options.length - 1 : active + step >= options.length ? -1 : active + step;
    if (active >= 0) document.getElementById(`sp-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }

  function chosen(option: Option) {
    if (option.remember) recent = rememberSearch(option.remember);
    // Picking a suggestion is a finished search; the results page reports its own.
    if (option.kind !== 'all' && option.kind !== 'recent' && option.kind !== 'trending' && option.kind !== 'browse') {
      reportSearch(option.remember ?? term, 'suggest');
    }
    closeSearchPalette();
  }

  function onKey(event: KeyboardEvent) {
    // A search input swallows Escape to clear itself, so the dialog never sees it.
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearchPalette();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      const option = active >= 0 ? options[active] : typing ? options.find((o) => o.kind === 'all') : undefined;
      if (!option) return;
      chosen(option);
      goto(option.href);
    }
  }

  function clearHistory() {
    recent = clearRecent();
    input?.focus();
  }

  async function sync(open: boolean) {
    if (!dialog) return;
    if (open && !dialog.open) {
      previousFocus = document.activeElement as HTMLElement | null;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      recent = loadRecent();
      if ($searchPalette.query) query = $searchPalette.query;
      active = -1;
      dialog.showModal();
      await tick();
      input?.focus();
      input?.select();
      if (!trendingRequested) {
        trendingRequested = true;
        getTrendingSearches().then((r) => (trending = r.data)).catch(() => {});
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }
  $: sync($searchPalette.open);

  function onClose() {
    document.documentElement.style.overflow = previousOverflow;
    previousFocus?.focus?.();
    if ($searchPalette.open) closeSearchPalette();
  }

  // A click on the backdrop lands on the <dialog> element itself.
  function onBackdrop(event: MouseEvent) {
    if (event.target === dialog) closeSearchPalette();
  }

  function isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  onMount(() => {
    const onGlobalKey = (event: KeyboardEvent) => {
      if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey) && !event.altKey) {
        event.preventDefault();
        if ($searchPalette.open) closeSearchPalette();
        else openSearchPalette();
      } else if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target) && !$searchPalette.open) {
        event.preventDefault();
        openSearchPalette();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => {
      window.removeEventListener('keydown', onGlobalKey);
      clearTimeout(timer);
      controller?.abort();
    };
  });

  afterNavigate(() => {
    if ($searchPalette.open) closeSearchPalette();
  });
</script>

<dialog class="sp" bind:this={dialog} on:close={onClose} on:click={onBackdrop} aria-label="Cari di situs">
  <div class="sp__panel">
    <form class="sp__bar" role="search" action="/search" method="GET" on:submit|preventDefault>
      <i class="bi bi-search sp__lens" aria-hidden="true"></i>
      <input
        bind:this={input}
        bind:value={query}
        on:keydown={onKey}
        on:input={() => (active = -1)}
        name="q"
        type="search"
        role="combobox"
        aria-expanded={options.length > 0}
        aria-controls="sp-list"
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        placeholder="Cari artikel, topik, atau penulis…"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="search"
        maxlength="100"
      />
      {#if loading}<span class="sp__spinner" aria-hidden="true"></span>{/if}
      <button type="button" class="sp__close" on:click={closeSearchPalette}>
        <span class="sp__close-key">Esc</span><span class="sp__close-word">Batal</span>
      </button>
    </form>

    <p class="visually-hidden" aria-live="polite">{status}</p>

    <div class="sp__body" id="sp-list" role="listbox" aria-label="Saran pencarian">
      {#if failed}
        <p class="sp__note"><i class="bi bi-wifi-off" aria-hidden="true"></i> Saran tidak bisa dimuat. Tekan Enter untuk langsung mencari.</p>
      {:else if noMatches}
        <p class="sp__note">Belum ada judul, topik, atau penulis yang cocok dengan “{term}”. Coba cari lengkap, siapa tahu ada di isi artikel.</p>
      {/if}

      {#each groups as group (group.id)}
        <div class="sp__group" role="group" aria-labelledby="sp-g-{group.id}">
          <div class="sp__group-head">
            <span id="sp-g-{group.id}">{group.title}</span>
            {#if group.id === 'recent'}
              <button type="button" class="sp__clear" on:click={clearHistory}>Hapus</button>
            {/if}
          </div>
          <div class:sp__chips={group.layout === 'chips'}>
            {#each group.options as option (option.index)}
              <a
                id="sp-opt-{option.index}"
                role="option"
                aria-selected={active === option.index}
                class="sp__opt sp__opt--{option.kind}"
                class:is-active={active === option.index}
                href={option.href}
                tabindex="-1"
                on:click={() => chosen(option)}
                on:mousemove={() => (active = option.index)}
              >
                {#if option.kind === 'article'}
                  <span class="sp__thumb" aria-hidden="true">
                    {#if option.image}<img src={imgUrl(option.image, 160) ?? option.image} alt="" loading="lazy" decoding="async" on:error={imgFallback} />{/if}
                  </span>
                {:else if group.layout !== 'chips'}
                  <span class="sp__icon" aria-hidden="true"><i class="bi {ICONS[option.kind]}"></i></span>
                {/if}
                <span class="sp__text">
                  <span class="sp__label">
                    {#each highlight(option.label, option.kind === 'recent' || option.kind === 'all' ? [] : words) as part}{#if part.hit}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}
                  </span>
                  {#if option.meta}<span class="sp__meta">{option.meta}</span>{/if}
                </span>
                {#if option.kind === 'all'}<i class="bi bi-arrow-right sp__go" aria-hidden="true"></i>{/if}
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <footer class="sp__foot" aria-hidden="true">
      <span><kbd>↑</kbd><kbd>↓</kbd> pilih</span>
      <span><kbd>↵</kbd> buka</span>
      <span><kbd>Esc</kbd> tutup</span>
      <span class="sp__foot-tip"><kbd>/</kbd> atau <kbd>Ctrl</kbd><kbd>K</kbd> untuk mencari dari mana saja</span>
    </footer>
  </div>
</dialog>

<style>
  .sp {
    width: min(680px, calc(100% - 32px));
    max-width: none;
    max-height: min(640px, 80vh);
    margin: 10vh auto auto;
    padding: 0;
    border: 0;
    border-radius: 18px;
    background: #fff;
    color: #1a1a1a;
    box-shadow: 0 24px 64px rgba(10, 10, 10, 0.28), 0 4px 12px rgba(10, 10, 10, 0.08);
    overflow: hidden;
  }
  .sp[open] { display: flex; animation: sp-in 200ms cubic-bezier(0.16, 1, 0.3, 1); }
  .sp::backdrop { background: rgba(10, 10, 10, 0.55); }
  @keyframes sp-in {
    from { opacity: 0; transform: translateY(-10px) scale(0.985); }
  }

  .sp__panel { display: flex; flex-direction: column; width: 100%; min-height: 0; }

  .sp__bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem 0.6rem 1.1rem;
    border-bottom: 1px solid #ececec;
  }
  .sp__lens { color: #6b7280; font-size: 1.05rem; }
  .sp__bar input {
    flex: 1;
    min-width: 0;
    height: 48px;
    border: 0;
    background: transparent;
    color: #111;
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    outline: none;
    caret-color: var(--site-dark, #111);
  }
  .sp__bar input::placeholder { color: #8b919a; font-weight: 500; }
  .sp__bar input::-webkit-search-cancel-button { display: none; }
  .sp__bar input::selection { background: var(--site-primary, #f1ff32); color: #111; }

  .sp__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid #e5e7eb;
    border-top-color: var(--site-dark, #111);
    border-radius: 50%;
    animation: sp-spin 700ms linear infinite;
  }
  @keyframes sp-spin { to { transform: rotate(360deg); } }

  .sp__close {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 0.55rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    color: #4b5563;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }
  .sp__close:hover { border-color: var(--site-dark, #111); color: #111; }
  .sp__close-word { display: none; }

  .sp__body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0.4rem 0.5rem 0.75rem; scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }

  .sp__note { display: flex; gap: 0.5rem; margin: 0.6rem 0.65rem 0.2rem; color: #4b5563; font-size: 0.875rem; line-height: 1.5; }

  .sp__group { padding-top: 0.5rem; }
  .sp__group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 0.65rem 0.35rem;
    color: #6b7280;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .sp__clear { padding: 0.15rem 0.35rem; border: 0; border-radius: 6px; background: none; color: #4b5563; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
  .sp__clear:hover { color: #111; text-decoration: underline; }

  .sp__opt {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
    padding: 0.4rem 0.65rem;
    border-radius: 10px;
    color: #1a1a1a;
    text-decoration: none;
  }
  .sp__opt.is-active { background: #f3f4f6; }
  .sp__opt.is-active .sp__label { text-decoration: underline; text-decoration-color: var(--site-primary-contrast, #111); text-decoration-thickness: 1px; text-underline-offset: 3px; }

  .sp__thumb { flex: 0 0 64px; width: 64px; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 8px; background: #eef0f2; }
  .sp__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sp__icon { display: grid; place-items: center; flex: 0 0 32px; width: 32px; height: 32px; border-radius: 8px; background: #f3f4f6; color: #374151; font-size: 0.9rem; }
  .sp__opt.is-active .sp__icon { background: var(--site-dark, #111); color: var(--site-primary, #f1ff32); }

  .sp__text { display: grid; gap: 0.1rem; min-width: 0; flex: 1; }
  .sp__label { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; font-size: 0.9375rem; font-weight: 700; line-height: 1.35; }
  .sp__meta { color: #6b7280; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
  .sp__go { color: #6b7280; }
  .sp__opt--all { font-weight: 700; }
  .sp__opt--all .sp__label { font-weight: 800; }
  .sp__opt--recent .sp__label { font-weight: 600; }

  .sp mark { padding: 0 0.08em; border-radius: 3px; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }

  .sp__chips { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.1rem 0.65rem 0.25rem; }
  .sp__chips .sp__opt {
    min-height: 36px;
    padding: 0 0.85rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    font-size: 0.8125rem;
  }
  .sp__chips .sp__opt .sp__label { font-size: 0.8125rem; font-weight: 700; -webkit-line-clamp: 1; line-clamp: 1; }
  .sp__chips .sp__opt.is-active { border-color: var(--site-dark, #111); background: #fff; }
  .sp__chips .sp__opt.is-active .sp__label { text-decoration: none; }

  .sp__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    padding: 0.6rem 1.1rem;
    border-top: 1px solid #ececec;
    background: #fafafa;
    color: #6b7280;
    font-size: 0.75rem;
  }
  .sp__foot-tip { margin-left: auto; }
  .sp kbd {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    margin-right: 0.2rem;
    padding: 0 0.3rem;
    border: 1px solid #d1d5db;
    border-bottom-width: 2px;
    border-radius: 5px;
    background: #fff;
    color: #374151;
    font: 700 0.6875rem/1 inherit;
  }

  .sp :is(a, button):focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }

  @media (max-width: 575px) {
    .sp {
      width: 100%;
      height: 100dvh;
      max-height: none;
      margin: 0;
      border-radius: 0;
    }
    .sp[open] { animation-name: sp-in-mobile; }
    @keyframes sp-in-mobile { from { opacity: 0; } }
    .sp__bar { padding: 0.5rem 0.5rem 0.5rem 1rem; }
    .sp__bar input { font-size: 1rem; }
    .sp__close { min-height: 44px; border: 0; color: #111; font-size: 0.875rem; }
    .sp__close-key { display: none; }
    .sp__close-word { display: inline; }
    .sp__foot { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sp[open] { animation: none; }
    .sp__spinner { animation-duration: 2s; }
  }
</style>
