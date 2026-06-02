<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { fetchThreads, formatRelative, initials, imgUrl, threadUrl, authorHandle, type AnimeOption, type ArticleOption, type Thread } from '$lib/threads';
  import ShareMenu from '$components/threads/ShareMenu.svelte';

  export let data: PageData;
  export let form: ActionData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: me = data.user;
  $: top = data.topThreads;

  let origin = '';

  // ---- Infinite scroll ----
  let items: Thread[] = [];
  let page = 1;
  let hasMore = false;
  let loading = false;
  let sentinel: HTMLElement;
  let observer: IntersectionObserver | null = null;
  let lastKey = '';

  $: {
    const key = `${data.animeId ?? ''}:${data.meta.page}:${data.threads.length}`;
    if (key !== lastKey) {
      lastKey = key;
      items = [...data.threads];
      page = data.meta.page;
      hasMore = data.meta.hasMore;
    }
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    try {
      const res = await fetchThreads(fetch, { page: page + 1, perPage: data.meta.perPage, animeId: data.animeId });
      items = [...items, ...res.data];
      page = res.meta.page;
      hasMore = res.meta.hasMore;
    } catch {
      hasMore = false;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    origin = location.origin;
    observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: '600px 0px' },
    );
    if (sentinel) observer.observe(sentinel);
  });
  onDestroy(() => observer?.disconnect());
  $: if (observer && sentinel) { observer.disconnect(); observer.observe(sentinel); }

  // ---- Composer ----
  let body = '';
  let posting = false;
  let imagePreview: string | null = null;
  function onImage(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    imagePreview = f ? URL.createObjectURL(f) : null;
  }
  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    imagePreview = null;
    const el = document.getElementById('composer-image') as HTMLInputElement | null;
    if (el) el.value = '';
  }

  // ---- Anime combobox ----
  let animeOpen = false;
  let animeQuery = '';
  let animeResults: AnimeOption[] = data.animeOptions ?? [];
  let selectedAnimeId: number | null = null;
  let selectedAnimeLabel = '';
  let animeTimer: ReturnType<typeof setTimeout>;
  function toggleAnime(e: MouseEvent) { e.stopPropagation(); animeOpen = !animeOpen; articleOpen = false; }
  function onAnimeInput() {
    clearTimeout(animeTimer);
    const q = animeQuery;
    animeTimer = setTimeout(async () => {
      const res = await fetch(`${PUBLIC_API_URL}/api/threads/anime-options?q=${encodeURIComponent(q)}`);
      if (res.ok) animeResults = (await res.json()).data;
    }, 250);
  }
  function pickAnime(a: AnimeOption) {
    selectedAnimeId = a.id;
    selectedAnimeLabel = a.title + (a.season && a.seasonYear ? ` (${a.season} ${a.seasonYear})` : '');
    animeOpen = false; animeQuery = '';
  }
  function clearAnime() { selectedAnimeId = null; selectedAnimeLabel = ''; animeQuery = ''; }

  // ---- Article combobox ----
  let articleOpen = false;
  let articleQuery = '';
  let articleResults: ArticleOption[] = [];
  let selectedArticleId: number | null = null;
  let selectedArticleLabel = '';
  let articleTimer: ReturnType<typeof setTimeout>;
  function toggleArticle(e: MouseEvent) { e.stopPropagation(); articleOpen = !articleOpen; animeOpen = false; }
  function onArticleInput() {
    clearTimeout(articleTimer);
    const q = articleQuery;
    articleTimer = setTimeout(async () => {
      const res = await fetch(`${PUBLIC_API_URL}/api/threads/article-options?q=${encodeURIComponent(q)}`);
      if (res.ok) articleResults = (await res.json()).data;
    }, 250);
  }
  function pickArticle(a: ArticleOption) {
    selectedArticleId = a.id;
    selectedArticleLabel = a.title;
    articleOpen = false; articleQuery = '';
  }
  function clearArticle() { selectedArticleId = null; selectedArticleLabel = ''; articleQuery = ''; }

  function onWindowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.mt-tag--anime')) animeOpen = false;
    if (!target.closest('.mt-tag--article')) articleOpen = false;
  }

  function resetComposer() {
    body = ''; clearImage(); clearAnime(); clearArticle(); animeOpen = false; articleOpen = false;
  }

  // ---- Likes (feed) ----
  let likeOverride: Record<number, { liked: boolean; count: number }> = {};
  const likeOf = (t: { id: number; likeCount: number }) =>
    likeOverride[t.id] ?? { liked: false, count: t.likeCount };

  // ---- Guest join popup ----
  let joinPopup = false;
  let joinDismissTimer: ReturnType<typeof setTimeout>;

  onMount(() => {
    if (!me && !sessionStorage.getItem('lounge_join_shown')) {
      const showTimer = setTimeout(() => {
        joinPopup = true;
        sessionStorage.setItem('lounge_join_shown', '1');
        joinDismissTimer = setTimeout(() => { joinPopup = false; }, 5000);
      }, 1500);
      return () => { clearTimeout(showTimer); clearTimeout(joinDismissTimer); };
    }
  });

  function closeJoinPopup() {
    joinPopup = false;
    clearTimeout(joinDismissTimer);
  }
</script>

<svelte:head>
  <title>Culture Lounge · {siteName}</title>
  <meta name="description" content="Mokultur Culture Lounge — lounge culture buat para wibukiawan: ngobrolin kultur yang lagi ramai, anime, event, dan lainnya." />
</svelte:head>

<svelte:window on:click={onWindowClick} />

<section class="mt-page">
  <div class="container-xl mt-grid">
    <main class="mt-main">
      <header class="mt-head">
        <div>
          <h1><em>Culture Lounge</em></h1>
          <p>Lounge culture buat para wibukiawan. Ngobrolin kultur yang lagi ramai, anime, event, dan lainnya.</p>
        </div>
      </header>

      <!-- Mobile-only profile card, attached to the feed -->
      {#if me}
        <a href="/account" class="mt-mobile-profile">
          <div class="mt-mobile-profile__avatar">
            {#if me.img}<img src={imgUrl(me.img)} alt={me.name} />{:else}<span>{initials(me.name)}</span>{/if}
          </div>
          <div class="mt-mobile-profile__info">
            <strong>{me.name}</strong>
            {#if me.username}<small>@{me.username}</small>{/if}
          </div>
          <i class="bi bi-pencil"></i>
        </a>
      {:else}
        <div class="mt-mobile-profile mt-mobile-profile--guest">
          <span>Masuk untuk ikut ngobrol di Culture Lounge.</span>
          <a href="/auth/login?redirect=/lounge" class="mt-btn mt-btn--primary">Masuk</a>
        </div>
      {/if}

      {#if me}
        <form
          method="POST"
          action="?/create"
          enctype="multipart/form-data"
          class="mt-composer"
          use:enhance={() => {
            posting = true;
            return async ({ result, update }) => {
              posting = false;
              if (result.type === 'redirect') { await invalidateAll(); }
              await update();
              if (result.type === 'redirect' || result.type === 'success') resetComposer();
            };
          }}
        >
          <input type="hidden" name="animeCacheId" value={selectedAnimeId ?? ''} />
          <input type="hidden" name="articlePostId" value={selectedArticleId ?? ''} />

          <div class="mt-composer__top">
            <div class="mt-composer__avatar">
              {#if me.img}<img src={imgUrl(me.img)} alt={me.name} />{:else}<span>{initials(me.name)}</span>{/if}
            </div>
            <textarea name="body" bind:value={body} rows="2" maxlength="5000" placeholder="Apa yang lagi kamu pikirkan, {me.name}?"></textarea>
          </div>

          {#if form?.error}<div class="mt-composer__alert">{form.error}</div>{/if}

          {#if imagePreview}
            <div class="mt-composer__preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" class="mt-composer__preview-x" on:click={clearImage} aria-label="Hapus gambar"><i class="bi bi-x-lg"></i></button>
            </div>
          {/if}

          {#if selectedAnimeLabel || selectedArticleLabel}
            <div class="mt-chips">
              {#if selectedAnimeLabel}
                <span class="mt-chip"><i class="bi bi-collection-play"></i> {selectedAnimeLabel}
                  <button type="button" on:click={clearAnime} aria-label="Hapus tag anime"><i class="bi bi-x"></i></button>
                </span>
              {/if}
              {#if selectedArticleLabel}
                <span class="mt-chip mt-chip--article"><i class="bi bi-newspaper"></i> {selectedArticleLabel.slice(0, 40)}{selectedArticleLabel.length > 40 ? '…' : ''}
                  <button type="button" on:click={clearArticle} aria-label="Hapus tag artikel"><i class="bi bi-x"></i></button>
                </span>
              {/if}
            </div>
          {/if}

          <div class="mt-composer__actions">
            <div class="mt-composer__tools">
              <label class="mt-icon-btn" for="composer-image" title="Tambah gambar">
                <i class="bi bi-image"></i><span class="d-none d-sm-inline">Gambar</span>
              </label>
              <input id="composer-image" type="file" name="image" accept="image/jpeg,image/png,image/webp" on:change={onImage} class="mt-visually-hidden" />

              <div class="mt-tag mt-tag--anime">
                <button type="button" class="mt-icon-btn" class:is-active={selectedAnimeId} on:click={toggleAnime} title="Tag anime">
                  <i class="bi bi-collection-play"></i><span class="d-none d-sm-inline">Anime</span>
                </button>
                {#if animeOpen}
                  <div class="mt-tag__pop" on:click|stopPropagation on:keydown>
                    <input type="text" bind:value={animeQuery} on:input={onAnimeInput} placeholder="Cari anime..." autocomplete="off" autofocus />
                    {#if animeResults.length}
                      <ul>{#each animeResults.slice(0, 10) as a (a.id)}<li><button type="button" on:click={() => pickAnime(a)}>{a.title}{a.season && a.seasonYear ? ` (${a.season} ${a.seasonYear})` : ''}</button></li>{/each}</ul>
                    {:else}<p class="mt-tag__empty">Ketik untuk mencari.</p>{/if}
                  </div>
                {/if}
              </div>

              <div class="mt-tag mt-tag--article">
                <button type="button" class="mt-icon-btn" class:is-active={selectedArticleId} on:click={toggleArticle} title="Tag artikel">
                  <i class="bi bi-newspaper"></i><span class="d-none d-sm-inline">Artikel</span>
                </button>
                {#if articleOpen}
                  <div class="mt-tag__pop" on:click|stopPropagation on:keydown>
                    <input type="text" bind:value={articleQuery} on:input={onArticleInput} placeholder="Cari artikel..." autocomplete="off" autofocus />
                    {#if articleResults.length}
                      <ul>{#each articleResults.slice(0, 10) as a (a.id)}<li><button type="button" on:click={() => pickArticle(a)}>{a.title}</button></li>{/each}</ul>
                    {:else}<p class="mt-tag__empty">Ketik untuk mencari.</p>{/if}
                  </div>
                {/if}
              </div>
            </div>

            <button type="submit" class="mt-btn mt-btn--primary" disabled={posting}>
              <i class="bi bi-send"></i> {posting ? 'Memposting…' : 'Posting'}
            </button>
          </div>
        </form>
      {/if}

      {#if items.length === 0}
        <div class="mt-empty">
          <i class="bi bi-chat-square-dots"></i>
          <p>Belum ada thread.</p>
          {#if !me}<a class="mt-btn mt-btn--primary" href="/auth/login?redirect=/lounge">Masuk untuk posting</a>{/if}
        </div>
      {:else}
        <ul class="mt-feed">
          {#each items as t (t.id)}
            <li class="mt-card" class:mt-card--pinned={t.isPinned}>
              <!-- Author header: link ke profil -->
              <div class="mt-card__header">
                <a href="/lounge/@{authorHandle(t)}" class="mt-card__author">
                  <div class="mt-card__avatar">
                    {#if t.authorImg}<img src={imgUrl(t.authorImg)} alt={t.authorName ?? ''} />{:else}<span>{initials(t.authorName)}</span>{/if}
                  </div>
                  <div class="mt-card__meta">
                    <span class="mt-card__author-name">{t.authorName ?? 'User'}</span>
                    {#if t.authorUsername}<span class="mt-card__handle">@{t.authorUsername}</span>{/if}
                    <span class="mt-card__time">· {formatRelative(t.createdAt)}</span>
                  </div>
                </a>
                <div class="mt-card__pills">
                  {#if t.isPinned}<span class="mt-pill mt-pill--pin">📌 Pinned</span>{/if}
                  {#if t.animeTitle}<span class="mt-pill">{t.animeTitle}</span>{/if}
                  {#if t.articleTitle}<span class="mt-pill mt-pill--article"><i class="bi bi-newspaper"></i> {t.articleTitle.slice(0, 30)}{t.articleTitle.length > 30 ? '…' : ''}</span>{/if}
                </div>
              </div>

              <!-- Konten: link ke thread detail -->
              <a href={threadUrl(t)} class="mt-card__content">
                {#if t.body}<p class="mt-card__text">{t.body.slice(0, 280)}{t.body.length > 280 ? '…' : ''}</p>{/if}
                {#if t.imagePath}<div class="mt-card__media"><img src={imgUrl(t.imagePath)} alt="" loading="lazy" /></div>{/if}
              </a>

              {#if t.topReply}
                <a class="mt-topreply" href={threadUrl(t)}>
                  <div class="mt-topreply__avatar">
                    {#if t.topReply.authorImg}<img src={imgUrl(t.topReply.authorImg)} alt="" />{:else}<span>{initials(t.topReply.authorName)}</span>{/if}
                  </div>
                  <div class="mt-topreply__body">
                    <div class="mt-topreply__head">
                      <strong>{t.topReply.authorName ?? 'User'}</strong>
                      {#if t.topReply.likeCount > 0}<span class="mt-topreply__likes"><i class="bi bi-heart-fill"></i> {t.topReply.likeCount}</span>{/if}
                    </div>
                    {#if t.topReply.body}<p class="mt-topreply__text">{t.topReply.body.slice(0, 140)}{t.topReply.body.length > 140 ? '…' : ''}</p>{/if}
                    {#if t.topReply.imagePath}<span class="mt-topreply__hasimg"><i class="bi bi-image"></i> Gambar</span>{/if}
                  </div>
                </a>
              {/if}

              <div class="mt-card__actions">
                <a class="mt-act" href={threadUrl(t)}><i class="bi bi-chat"></i> {t.replyCount}</a>
                {#if me}
                  <form method="POST" action="?/like" use:enhance={() => async ({ result }) => {
                    if (result.type === 'success' && result.data && 'likeCount' in result.data) {
                      likeOverride[t.id] = { liked: !!result.data.liked, count: Number(result.data.likeCount) };
                      likeOverride = likeOverride;
                    }
                  }}>
                    <input type="hidden" name="thread_id" value={t.id} />
                    <button type="submit" class="mt-act mt-act--like" class:is-liked={likeOf(t).liked} aria-label="Suka">
                      <i class="bi {likeOf(t).liked ? 'bi-heart-fill' : 'bi-heart'}"></i> {likeOf(t).count}
                    </button>
                  </form>
                {:else}
                  <a class="mt-act" href="/auth/login?redirect=/lounge" aria-label="Suka"><i class="bi bi-heart"></i> {likeOf(t).count}</a>
                {/if}
                <ShareMenu url={`${origin}${threadUrl(t)}`} title={`Culture Lounge · ${siteName}`} compact />
                <span class="mt-act mt-act--view"><i class="bi bi-eye"></i> {t.viewCount}</span>
              </div>
            </li>
          {/each}
        </ul>

        {#if hasMore}
          <div bind:this={sentinel} class="mt-sentinel">
            {#if loading}<i class="bi bi-arrow-repeat mt-spin"></i> Memuat…{/if}
          </div>
        {:else}
          <p class="mt-end">Sudah sampai bawah ✦</p>
        {/if}
      {/if}
    </main>

    <aside class="mt-aside">
      <div class="mt-side-card">
        {#if me}
          <a href="/account" class="mt-side-profile">
            <div class="mt-side-profile__avatar">
              {#if me.img}<img src={imgUrl(me.img)} alt={me.name} />{:else}<span>{initials(me.name)}</span>{/if}
            </div>
            <div class="mt-side-profile__info">
              <strong>{me.name}</strong>
              {#if me.username}<small>@{me.username}</small>{/if}
            </div>
          </a>
          {#if me.description}<p class="mt-side-profile__bio">{me.description}</p>{/if}
          <a href="/account" class="mt-side-link"><i class="bi bi-pencil"></i> Edit Profil</a>
        {:else}
          <h3 class="mt-side-card__title">Gabung diskusi</h3>
          <p class="mt-side-card__hint">Masuk untuk posting, balas thread & share post.</p>
          <div class="mt-side-card__cta">
            <a href="/auth/login?redirect=/lounge" class="mt-btn mt-btn--primary mt-btn--block">Masuk</a>
            <a href="/auth/register" class="mt-btn mt-btn--ghost mt-btn--block">Daftar</a>
          </div>
        {/if}
      </div>

      {#if top.length}
        <div class="mt-side-card">
          <h3 class="mt-side-card__title"><i class="bi bi-fire"></i> Top Threads</h3>
          <ol class="mt-top-list">
            {#each top as t, i (t.id)}
              <li>
                <a href={threadUrl(t)} class="mt-top-item">
                  <span class="mt-top-num">{i + 1}</span>
                  <div class="mt-top-content">
                    <p class="mt-top-text">{(t.body ?? t.title ?? 'Untitled').slice(0, 80)}{(t.body ?? t.title ?? '').length > 80 ? '…' : ''}</p>
                    <small><i class="bi bi-chat"></i> {t.replyCount} · {t.authorName ?? 'User'}</small>
                  </div>
                </a>
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    </aside>
  </div>
</section>

{#if joinPopup}
  <div class="mt-join-popup" role="dialog" aria-label="Gabung Culture Lounge">
    <button class="mt-join-popup__close" on:click={closeJoinPopup} aria-label="Tutup">
      <i class="bi bi-x-lg"></i>
    </button>
    <p class="mt-join-popup__title"><i class="bi bi-stars"></i> Culture Lounge</p>
    <p class="mt-join-popup__body">Masuk untuk ikut ngobrol, post, dan balas thread.</p>
    <div class="mt-join-popup__cta">
      <a href="/auth/login?redirect=/lounge" class="mt-btn mt-btn--primary">Masuk</a>
      <a href="/auth/register" class="mt-btn mt-btn--ghost">Daftar</a>
    </div>
  </div>
{/if}

<style>
  .mt-page { padding: 24px 0 60px; }
  .mt-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 32px; align-items: start; }
  @media (max-width: 991.98px) { .mt-grid { grid-template-columns: 1fr; gap: 0; } .mt-aside { display: none; } }
  .mt-main { min-width: 0; }

  .mt-head { margin-bottom: 16px; }
  .mt-head h1 { font-size: 26px; margin: 0; }
  .mt-head h1 em { font-style: italic; }
  .mt-head p { color: #6b7280; margin: 2px 0 0; font-size: 14px; }

  .mt-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 14px; border-radius: 999px; text-decoration: none;
    font-weight: 600; font-size: 14px; border: 1px solid transparent; cursor: pointer; line-height: 1.2;
  }
  .mt-btn--primary { background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); }
  .mt-btn--primary:hover { filter: brightness(0.95); }
  .mt-btn--primary:disabled { opacity: 0.6; cursor: default; }
  .mt-btn--ghost { background: transparent; color: #111; border-color: #d1d5db; }
  .mt-btn--block { width: 100%; padding: 9px 14px; }

  .mt-mobile-profile { display: none; }
  @media (max-width: 991.98px) {
    .mt-mobile-profile {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border: 1px solid #e5e7eb;
      border-radius: 14px 14px 0 0; border-bottom: none;
      padding: 12px 14px; text-decoration: none; color: inherit;
    }
    .mt-mobile-profile--guest { justify-content: space-between; font-size: 13.5px; color: #4b5563; }
    .mt-mobile-profile__avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
      background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a);
      font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; justify-content: center;
    }
    .mt-mobile-profile__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .mt-mobile-profile__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .mt-mobile-profile__info strong { font-size: 14px; color: #111; }
    .mt-mobile-profile__info small { color: #6b7280; font-size: 12px; }
    .mt-mobile-profile > i { color: #6b7280; }
    .mt-mobile-profile + .mt-composer { border-top-left-radius: 0; border-top-right-radius: 0; }
    .mt-mobile-profile + .mt-feed { border-top-left-radius: 0; border-top-right-radius: 0; }
  }

  .mt-composer { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 12px; }
  .mt-composer__top { display: flex; gap: 12px; }
  .mt-composer__avatar { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; overflow: hidden; background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
  .mt-composer__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-composer__top textarea { flex: 1; min-width: 0; border: none; outline: none; resize: vertical; font-family: inherit; font-size: 15px; line-height: 1.5; padding: 8px 0; background: transparent; }
  .mt-composer__alert { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 13px; }
  .mt-composer__preview { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; max-height: 320px; }
  .mt-composer__preview img { width: 100%; max-height: 320px; object-fit: cover; display: block; }
  .mt-composer__preview-x { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; border: none; cursor: pointer; }
  .mt-composer__actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .mt-composer__tools { display: flex; align-items: center; gap: 4px; }

  .mt-icon-btn { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #4b5563; font-size: 14px; font-weight: 500; padding: 6px 10px; border-radius: 8px; background: none; border: none; }
  .mt-icon-btn:hover { background: #f3f4f6; }
  .mt-icon-btn.is-active { color: var(--site-dark, #111); background: #eef2ff; }
  .mt-icon-btn i { font-size: 18px; }

  .mt-tag { position: relative; }
  .mt-tag__pop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 25; width: 260px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 8px; }
  .mt-tag__pop input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; font-size: 14px; font-family: inherit; outline: none; }
  .mt-tag__pop ul { list-style: none; margin: 6px 0 0; padding: 0; max-height: 220px; overflow-y: auto; }
  .mt-tag__pop li button { width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 8px 10px; font-size: 13.5px; border-radius: 6px; color: #111; }
  .mt-tag__pop li button:hover { background: #f3f4f6; }
  .mt-tag__empty { margin: 8px 4px 2px; font-size: 12px; color: #9ca3af; }

  .mt-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .mt-chip { display: inline-flex; align-items: center; gap: 6px; background: #f3f4f6; color: #374151; padding: 4px 6px 4px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 500; }
  .mt-chip--article { background: #eef2ff; color: #4338ca; }
  .mt-chip button { background: none; border: none; cursor: pointer; color: inherit; display: inline-flex; padding: 2px; border-radius: 50%; }
  .mt-chip button:hover { background: rgba(0,0,0,0.08); }

  .mt-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

  .mt-empty { text-align: center; padding: 50px 20px; color: #6b7280; }
  .mt-empty i { font-size: 40px; display: block; margin-bottom: 10px; }
  .mt-empty p { margin: 0 0 14px; font-size: 15px; }

  /* Feed: individual cards with gap */
  .mt-feed { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .mt-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; transition: box-shadow 0.15s, border-color 0.15s; }
  .mt-card:hover { border-color: #d1d5db; box-shadow: 0 2px 12px rgba(15,23,42,0.07); }
  .mt-card--pinned { border-color: #fcd34d; background: #fffef0; }

  /* Author header */
  .mt-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 14px 16px 0; }
  .mt-card__author { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; flex: 1; min-width: 0; }
  .mt-card__author:hover .mt-card__author-name { text-decoration: underline; }
  .mt-card__avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
  .mt-card__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-card__meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px; font-size: 13px; min-width: 0; }
  .mt-card__author-name { color: #111; font-weight: 600; }
  .mt-card__handle { color: #6b7280; font-size: 12px; }
  .mt-card__time { color: #9ca3af; font-size: 12px; }
  .mt-card__pills { display: flex; flex-wrap: wrap; gap: 4px; flex-shrink: 0; align-items: flex-start; padding-top: 2px; }

  .mt-pill { background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
  .mt-pill--pin { background: #fef3c7; color: #92400e; }
  .mt-pill--article { background: #eef2ff; color: #4338ca; }

  /* Content area: link ke thread detail */
  .mt-card__content { display: block; padding: 8px 16px 6px 68px; text-decoration: none; color: inherit; }
  .mt-card__content:hover { opacity: 0.92; }
  .mt-card__text { color: #111; font-size: 14.5px; line-height: 1.55; margin: 0 0 8px; white-space: pre-wrap; word-wrap: break-word; }
  .mt-card__media { border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; max-height: 420px; margin-bottom: 4px; }
  .mt-card__media img { width: 100%; max-height: 420px; object-fit: cover; display: block; }

  /* Top reply */
  .mt-topreply { display: flex; gap: 10px; margin: 2px 14px 10px 68px; padding: 10px 12px; border-radius: 12px; background: #f8fafc; border: 1px solid #eef0f3; text-decoration: none; color: inherit; }
  .mt-topreply:hover { background: #f1f5f9; }
  .mt-topreply__avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; overflow: hidden; background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; }
  .mt-topreply__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-topreply__body { flex: 1; min-width: 0; }
  .mt-topreply__head { display: flex; align-items: baseline; gap: 8px; font-size: 12.5px; }
  .mt-topreply__head strong { color: #111; font-weight: 600; }
  .mt-topreply__likes { color: #e11d48; font-size: 11.5px; }
  .mt-topreply__text { margin: 2px 0 0; font-size: 13px; color: #374151; line-height: 1.4; }
  .mt-topreply__hasimg { font-size: 11px; color: #6b7280; }

  /* Actions bar */
  .mt-card__actions { display: flex; align-items: center; gap: 2px; padding: 4px 10px 12px 60px; border-top: 1px solid #f3f4f6; margin-top: 4px; }
  .mt-card__actions form { margin: 0; }
  .mt-act { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; color: #6b7280; font-size: 13px; font-weight: 500; text-decoration: none; padding: 5px 10px; border-radius: 999px; }
  .mt-act:hover { background: #f3f4f6; color: #374151; }
  .mt-act--like.is-liked { color: #e11d48; }
  .mt-act--like:hover { color: #e11d48; background: #fff0f3; }
  .mt-act--view { margin-left: auto; color: #9ca3af; font-size: 12px; cursor: default; }
  .mt-act--view:hover { background: none; color: #9ca3af; }

  @media (max-width: 540px) {
    .mt-card__header { padding: 12px 12px 0; gap: 8px; }
    .mt-card__content { padding: 8px 12px 6px 60px; }
    .mt-card__actions { padding: 4px 8px 10px 52px; }
    .mt-topreply { margin: 2px 10px 10px 60px; }
    .mt-card__avatar { width: 38px; height: 38px; font-size: 12px; }
    .mt-card__text { font-size: 14px; }
    .mt-card__media { max-height: 340px; }
    .mt-card__media img { max-height: 340px; }
    .mt-act { padding: 5px 8px; font-size: 12.5px; }
  }

  .mt-sentinel { text-align: center; padding: 18px; color: #6b7280; font-size: 13px; }
  .mt-spin { display: inline-block; animation: mt-spin 0.8s linear infinite; }
  @keyframes mt-spin { to { transform: rotate(360deg); } }
  .mt-end { text-align: center; padding: 18px; color: #9ca3af; font-size: 12.5px; }

  .mt-aside { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 90px; }
  .mt-side-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; }
  .mt-side-card__title { font-size: 14px; font-weight: 700; margin: 0 0 10px; color: #111; display: flex; align-items: center; gap: 6px; }
  .mt-side-card__title i { color: #f59e0b; }
  .mt-side-card__hint { color: #6b7280; font-size: 13px; margin: 0 0 12px; }
  .mt-side-card__cta { display: flex; flex-direction: column; gap: 8px; }
  .mt-side-profile { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; margin-bottom: 8px; }
  .mt-side-profile__avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); font-weight: 700; font-size: 18px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
  .mt-side-profile__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-side-profile__info { display: flex; flex-direction: column; min-width: 0; }
  .mt-side-profile__info strong { font-size: 14px; color: #111; }
  .mt-side-profile__info small { color: #6b7280; font-size: 12px; }
  .mt-side-profile__bio { font-size: 13px; color: #4b5563; line-height: 1.4; margin: 6px 0 12px; }
  .mt-side-link { font-size: 13px; color: #4b5563; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 5px; }
  .mt-side-link:hover { color: #111; }
  .mt-top-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .mt-top-item { display: flex; gap: 10px; text-decoration: none; color: inherit; padding: 4px 0; }
  .mt-top-num { flex-shrink: 0; width: 22px; height: 22px; background: #f3f4f6; color: #6b7280; border-radius: 50%; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-top: 2px; }
  .mt-top-content { flex: 1; min-width: 0; }
  .mt-top-text { font-size: 13px; color: #111; line-height: 1.4; margin: 0 0 2px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
  .mt-top-item small { color: #6b7280; font-size: 11px; }
  .mt-top-item small i { margin-right: 3px; }
  .mt-top-item:hover .mt-top-text { color: var(--site-dark, #111); text-decoration: underline; }

  @media (max-width: 540px) {
    .mt-head h1 { font-size: 22px; }
    .mt-card__link { padding: 12px 14px 6px; gap: 10px; }
    .mt-card__avatar { width: 38px; height: 38px; font-size: 13px; }
    .mt-card__text { font-size: 14px; }
    .mt-card__media { max-height: 340px; }
    .mt-card__media img { max-height: 340px; }
    .mt-card__actions { padding: 2px 8px 10px 60px; gap: 2px; }
    .mt-topreply { margin: 0 12px 10px 60px; }
    .mt-act { padding: 5px 8px; }
  }

  /* Guest join popup */
  .mt-join-popup {
    position: fixed; bottom: 24px; right: 24px; z-index: 1060;
    background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.16);
    padding: 20px 22px 18px; max-width: 290px; width: calc(100vw - 48px);
    animation: popup-in 0.3s ease;
  }
  .mt-join-popup__close {
    position: absolute; top: 10px; right: 12px;
    background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px; padding: 4px;
  }
  .mt-join-popup__close:hover { color: #374151; }
  .mt-join-popup__title { font-weight: 700; font-size: 15px; margin: 0 0 6px; color: #111; }
  .mt-join-popup__title i { color: var(--site-primary, #f1ff32); margin-right: 4px; }
  .mt-join-popup__body { color: #6b7280; font-size: 13px; margin: 0 0 14px; line-height: 1.4; }
  .mt-join-popup__cta { display: flex; gap: 8px; }
  @keyframes popup-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 540px) {
    .mt-join-popup { bottom: 16px; right: 16px; left: 16px; max-width: none; width: auto; }
  }
</style>
