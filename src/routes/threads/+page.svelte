<script lang="ts">
  import type { PageData } from './$types';
  import { formatRelative, initials, imgUrl } from '$lib/threads';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: isAdmin = data.user?.role === 'admin';
  $: pages = Math.max(1, Math.ceil(data.meta.total / data.meta.perPage));
</script>

<svelte:head>
  <title>MokuThreads · {siteName}</title>
  <meta name="description" content="Posting singkat tentang anime, manga, dan kultur Jepang di {siteName}." />
</svelte:head>

<section class="mt-page">
  <div class="container-xl">
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
            <a class="mt-card__link" href="/threads/{t.slug}">
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
  </div>
</section>

<style>
  .mt-page { padding: 32px 0 60px; }
  .mt-head {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
  }
  .mt-head h1 { font-size: 28px; margin: 0; }
  .mt-head p { color: #6b7280; margin: 4px 0 0; }

  .mt-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 999px;
    text-decoration: none; font-weight: 600; font-size: 14px;
    border: 1px solid transparent;
  }
  .mt-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
  }
  .mt-btn--primary:hover { filter: brightness(0.95); }

  .mt-empty { text-align: center; padding: 60px 20px; color: #6b7280; }
  .mt-empty i { font-size: 40px; display: block; margin-bottom: 12px; }
  .mt-empty p { margin: 0 0 14px; font-size: 15px; }

  .mt-feed {
    list-style: none; padding: 0;
    max-width: 640px; margin: 0 auto;
    display: flex; flex-direction: column;
  }
  .mt-card {
    border-bottom: 1px solid #e5e7eb;
    background: #fff;
    transition: background 0.1s;
  }
  .mt-card:first-child { border-top: 1px solid #e5e7eb; }
  .mt-card:hover { background: #fafafa; }
  .mt-card--pinned { background: #fffef0; }

  .mt-card__link {
    display: flex; gap: 12px;
    padding: 16px 18px;
    text-decoration: none; color: inherit;
  }
  .mt-card__avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 15px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .mt-card__avatar img { width: 100%; height: 100%; object-fit: cover; }

  .mt-card__body { flex: 1; min-width: 0; }
  .mt-card__head {
    display: flex; flex-wrap: wrap; align-items: center;
    gap: 6px; font-size: 13px; color: #6b7280;
    margin-bottom: 4px;
  }
  .mt-card__head strong { color: #111; font-weight: 600; }
  .mt-card__time { font-size: 12px; }

  .mt-pill {
    background: #f3f4f6; color: #374151;
    padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 500;
  }
  .mt-pill--pin { background: #fef3c7; color: #92400e; padding: 2px 6px; }

  .mt-card__text {
    color: #111;
    font-size: 15px; line-height: 1.5;
    margin: 4px 0 10px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .mt-card__media {
    margin: 4px 0 10px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    max-height: 480px;
  }
  .mt-card__media img {
    width: 100%; max-height: 480px;
    object-fit: cover;
    display: block;
  }

  .mt-card__stats {
    display: flex; gap: 18px;
    font-size: 13px; color: #6b7280;
  }
  .mt-card__stats i { margin-right: 4px; }

  .mt-pager {
    margin-top: 24px;
    display: flex; align-items: center; justify-content: center;
    gap: 16px; font-size: 14px; color: #4b5563;
  }
  .mt-pager a { color: var(--site-dark, #111); font-weight: 600; }

  @media (max-width: 540px) {
    .mt-card__link { padding: 12px 14px; gap: 10px; }
    .mt-card__avatar { width: 40px; height: 40px; }
  }
</style>
