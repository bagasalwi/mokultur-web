<script lang="ts">
  import type { PageData } from './$types';
  import { formatRelative, initials, imgUrl, threadUrl } from '$lib/threads';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: isAdmin = data.user?.role === 'admin';
  $: pages = Math.max(1, Math.ceil(data.meta.total / data.meta.perPage));
  $: me = data.user;
  $: top = data.topThreads;
</script>

<svelte:head>
  <title>MokuThreads · {siteName}</title>
  <meta name="description" content="Posting singkat tentang anime, manga, dan kultur Jepang di {siteName}." />
</svelte:head>

<section class="mt-page">
  <div class="container-xl mt-grid">
    <main class="mt-main">
      <header class="mt-head">
        <div>
          <h1>MokuThreads</h1>
          <p>Posting cepat, share gambar, ngobrolin anime favorit.</p>
        </div>
        {#if isAdmin}
          <a class="mt-btn mt-btn--primary" href="/threads/new">
            <i class="bi bi-pencil-square"></i> Posting Baru
          </a>
        {/if}
      </header>

      {#if data.threads.length === 0}
        <div class="mt-empty">
          <i class="bi bi-chat-square-dots"></i>
          <p>Belum ada thread.</p>
          {#if isAdmin}
            <a class="mt-btn mt-btn--primary" href="/threads/new">Posting Pertama</a>
          {/if}
        </div>
      {:else}
        <ul class="mt-feed">
          {#each data.threads as t (t.id)}
            <li class="mt-card" class:mt-card--pinned={t.isPinned}>
              <a class="mt-card__link" href={threadUrl(t)}>
                <div class="mt-card__avatar">
                  {#if t.authorImg}
                    <img src={imgUrl(t.authorImg)} alt={t.authorName ?? ''} />
                  {:else}
                    <span>{initials(t.authorName)}</span>
                  {/if}
                </div>

                <div class="mt-card__body">
                  <div class="mt-card__head">
                    <strong>{t.authorName ?? 'Admin'}</strong>
                    {#if t.authorUsername}<span class="mt-card__handle">@{t.authorUsername}</span>{/if}
                    <span class="mt-card__time">· {formatRelative(t.createdAt)}</span>
                    {#if t.isPinned}<span class="mt-pill mt-pill--pin">📌</span>{/if}
                    {#if t.animeTitle}<span class="mt-pill">{t.animeTitle}</span>{/if}
                  </div>

                  {#if t.body}
                    <p class="mt-card__text">{t.body.slice(0, 280)}{t.body.length > 280 ? '…' : ''}</p>
                  {/if}

                  {#if t.imagePath}
                    <div class="mt-card__media">
                      <img src={imgUrl(t.imagePath)} alt="" loading="lazy" />
                    </div>
                  {/if}

                  <div class="mt-card__stats">
                    <span><i class="bi bi-chat"></i> {t.replyCount}</span>
                    <span><i class="bi bi-eye"></i> {t.viewCount}</span>
                    {#if t.lastReplyAt}
                      <span><i class="bi bi-clock"></i> {formatRelative(t.lastReplyAt)}</span>
                    {/if}
                  </div>
                </div>
              </a>
            </li>
          {/each}
        </ul>

        {#if pages > 1}
          <nav class="mt-pager" aria-label="Pagination">
            {#if data.meta.page > 1}
              <a href="?page={data.meta.page - 1}">← Sebelumnya</a>
            {/if}
            <span>Halaman {data.meta.page} dari {pages}</span>
            {#if data.meta.hasMore}
              <a href="?page={data.meta.page + 1}">Selanjutnya →</a>
            {/if}
          </nav>
        {/if}
      {/if}
    </main>

    <aside class="mt-aside">
      <!-- My Profile Card -->
      <div class="mt-side-card">
        {#if me}
          <a href="/account" class="mt-side-profile">
            <div class="mt-side-profile__avatar">
              {#if me.img}
                <img src={imgUrl(me.img)} alt={me.name} />
              {:else}
                <span>{initials(me.name)}</span>
              {/if}
            </div>
            <div class="mt-side-profile__info">
              <strong>{me.name}</strong>
              {#if me.username}<small>@{me.username}</small>{/if}
            </div>
          </a>
          {#if me.description}
            <p class="mt-side-profile__bio">{me.description}</p>
          {/if}
          <a href="/account" class="mt-side-link">
            <i class="bi bi-pencil"></i> Edit Profil
          </a>
        {:else}
          <h3 class="mt-side-card__title">Gabung diskusi</h3>
          <p class="mt-side-card__hint">Masuk untuk ikut balas thread & share post.</p>
          <div class="mt-side-card__cta">
            <a href="/auth/login?redirect=/threads" class="mt-btn mt-btn--primary mt-btn--block">Masuk</a>
            <a href="/auth/register" class="mt-btn mt-btn--ghost mt-btn--block">Daftar</a>
          </div>
        {/if}
      </div>

      <!-- Top Threads Card -->
      {#if top.length}
        <div class="mt-side-card">
          <h3 class="mt-side-card__title">
            <i class="bi bi-fire"></i> Top Threads
          </h3>
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

<style>
  .mt-page { padding: 24px 0 60px; }

  .mt-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 32px;
    align-items: start;
  }

  @media (max-width: 991.98px) {
    .mt-grid { grid-template-columns: 1fr; gap: 0; }
    .mt-aside { display: none; }
  }

  .mt-main { min-width: 0; }

  .mt-head {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 18px;
  }
  .mt-head h1 { font-size: 26px; margin: 0; }
  .mt-head p { color: #6b7280; margin: 2px 0 0; font-size: 14px; }

  .mt-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 14px; border-radius: 999px;
    text-decoration: none; font-weight: 600; font-size: 14px;
    border: 1px solid transparent; cursor: pointer;
    line-height: 1.2;
  }
  .mt-btn--primary { background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); }
  .mt-btn--primary:hover { filter: brightness(0.95); }
  .mt-btn--ghost { background: transparent; color: #111; border-color: #d1d5db; }
  .mt-btn--ghost:hover { background: #f3f4f6; }
  .mt-btn--block { width: 100%; padding: 9px 14px; }

  .mt-empty { text-align: center; padding: 50px 20px; color: #6b7280; }
  .mt-empty i { font-size: 40px; display: block; margin-bottom: 10px; }
  .mt-empty p { margin: 0 0 14px; font-size: 15px; }

  .mt-feed {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }
  .mt-card { border-bottom: 1px solid #e5e7eb; transition: background 0.1s; }
  .mt-card:last-child { border-bottom: none; }
  .mt-card:hover { background: #fafafa; }
  .mt-card--pinned { background: #fffef0; }

  .mt-card__link {
    display: flex; gap: 12px;
    padding: 14px 16px;
    text-decoration: none; color: inherit;
  }
  .mt-card__avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 14px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .mt-card__avatar img { width: 100%; height: 100%; object-fit: cover; }

  .mt-card__body { flex: 1; min-width: 0; }
  .mt-card__head {
    display: flex; flex-wrap: wrap; align-items: baseline;
    gap: 5px; font-size: 13px; color: #6b7280;
    margin-bottom: 4px;
  }
  .mt-card__head strong { color: #111; font-weight: 600; }
  .mt-card__handle { color: #6b7280; }
  .mt-card__time { font-size: 12px; }

  .mt-pill {
    background: #f3f4f6; color: #374151;
    padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 500;
  }
  .mt-pill--pin { background: #fef3c7; color: #92400e; padding: 2px 6px; }

  .mt-card__text {
    color: #111;
    font-size: 14.5px; line-height: 1.5;
    margin: 4px 0 8px;
    white-space: pre-wrap; word-wrap: break-word;
  }

  .mt-card__media {
    margin: 4px 0 8px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    max-height: 420px;
  }
  .mt-card__media img {
    width: 100%; max-height: 420px;
    object-fit: cover;
    display: block;
  }

  .mt-card__stats {
    display: flex; gap: 16px;
    font-size: 12.5px; color: #6b7280;
  }
  .mt-card__stats i { margin-right: 4px; }

  .mt-pager {
    margin-top: 18px;
    display: flex; align-items: center; justify-content: center;
    gap: 14px; font-size: 13px; color: #4b5563;
  }
  .mt-pager a { color: var(--site-dark, #111); font-weight: 600; }

  /* Sidebar */
  .mt-aside {
    display: flex; flex-direction: column; gap: 14px;
    position: sticky; top: 90px;
  }
  .mt-side-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
  }
  .mt-side-card__title {
    font-size: 14px; font-weight: 700; margin: 0 0 10px;
    color: #111; display: flex; align-items: center; gap: 6px;
  }
  .mt-side-card__title i { color: #f59e0b; }
  .mt-side-card__hint { color: #6b7280; font-size: 13px; margin: 0 0 12px; }
  .mt-side-card__cta { display: flex; flex-direction: column; gap: 8px; }

  .mt-side-profile {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none; color: inherit;
    margin-bottom: 8px;
  }
  .mt-side-profile__avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 18px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .mt-side-profile__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-side-profile__info { display: flex; flex-direction: column; min-width: 0; }
  .mt-side-profile__info strong { font-size: 14px; color: #111; }
  .mt-side-profile__info small { color: #6b7280; font-size: 12px; }
  .mt-side-profile__bio {
    font-size: 13px; color: #4b5563;
    line-height: 1.4; margin: 6px 0 12px;
  }
  .mt-side-link {
    font-size: 13px; color: #4b5563;
    text-decoration: none; font-weight: 500;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .mt-side-link:hover { color: #111; }

  .mt-top-list {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 10px;
  }
  .mt-top-item {
    display: flex; gap: 10px;
    text-decoration: none; color: inherit;
    padding: 4px 0;
  }
  .mt-top-num {
    flex-shrink: 0;
    width: 22px; height: 22px;
    background: #f3f4f6; color: #6b7280;
    border-radius: 50%;
    font-size: 11px; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center;
    margin-top: 2px;
  }
  .mt-top-content { flex: 1; min-width: 0; }
  .mt-top-text {
    font-size: 13px; color: #111;
    line-height: 1.4; margin: 0 0 2px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .mt-top-item small { color: #6b7280; font-size: 11px; }
  .mt-top-item small i { margin-right: 3px; }
  .mt-top-item:hover .mt-top-text { color: var(--site-dark, #111); text-decoration: underline; }

  @media (max-width: 540px) {
    .mt-head h1 { font-size: 22px; }
    .mt-card__link { padding: 12px 14px; gap: 10px; }
    .mt-card__avatar { width: 38px; height: 38px; font-size: 13px; }
    .mt-card__text { font-size: 14px; }
    .mt-card__media { max-height: 340px; }
    .mt-card__media img { max-height: 340px; }
  }
</style>
