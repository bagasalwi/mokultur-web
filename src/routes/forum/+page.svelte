<script lang="ts">
  import type { PageData } from './$types';
  import { formatRelative, initials } from '$lib/forum';

  export let data: PageData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: isAdmin = data.user?.role === 'admin';
  $: pages = Math.max(1, Math.ceil(data.meta.total / data.meta.perPage));
</script>

<svelte:head>
  <title>Forum · {siteName}</title>
  <meta name="description" content="Diskusi anime sedang tayang dan topik kultur lainnya di Mokultur." />
</svelte:head>

<section class="forum-page">
  <div class="container-xl">
    <header class="forum-head">
      <div>
        <h1>Forum Diskusi</h1>
        <p>Ngobrolin anime sedang tayang, manga, kultur Jepang — bareng komunitas {siteName}.</p>
      </div>
      {#if isAdmin}
        <a class="forum-btn forum-btn--primary" href="/forum/new">
          <i class="bi bi-plus-lg"></i> Thread Baru
        </a>
      {/if}
    </header>

    {#if data.threads.length === 0}
      <div class="forum-empty">
        <i class="bi bi-chat-square-dots"></i>
        <p>Belum ada thread aktif.</p>
        {#if isAdmin}
          <a class="forum-btn forum-btn--primary" href="/forum/new">Bikin Thread Pertama</a>
        {/if}
      </div>
    {:else}
      <ul class="forum-list">
        {#each data.threads as t (t.id)}
          <li class="forum-card" class:forum-card--pinned={t.isPinned}>
            <a class="forum-card__link" href="/forum/{t.slug}">
              {#if t.animeImg}
                <img class="forum-card__anime" src={t.animeImg} alt={t.animeTitle ?? ''} loading="lazy" />
              {:else}
                <div class="forum-card__avatar">{initials(t.authorName)}</div>
              {/if}

              <div class="forum-card__body">
                <div class="forum-card__meta">
                  {#if t.isPinned}<span class="forum-pill forum-pill--pin">📌 Pinned</span>{/if}
                  {#if t.animeTitle}<span class="forum-pill">{t.animeTitle}</span>{/if}
                  <span class="forum-card__by">oleh {t.authorName ?? 'Admin'}</span>
                </div>
                <h2 class="forum-card__title">{t.title}</h2>
                {#if t.body}
                  <p class="forum-card__snippet">{t.body.slice(0, 160)}{t.body.length > 160 ? '…' : ''}</p>
                {/if}
                <div class="forum-card__stats">
                  <span><i class="bi bi-chat"></i> {t.replyCount}</span>
                  <span><i class="bi bi-eye"></i> {t.viewCount}</span>
                  <span><i class="bi bi-clock"></i> {formatRelative(t.lastReplyAt ?? t.createdAt)}</span>
                </div>
              </div>
            </a>
          </li>
        {/each}
      </ul>

      {#if pages > 1}
        <nav class="forum-pager" aria-label="Pagination">
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
  .forum-page { padding: 32px 0 60px; }
  .forum-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
  }
  .forum-head h1 { font-size: 28px; margin: 0; }
  .forum-head p { color: #6b7280; margin: 4px 0 0; }

  .forum-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    border: 1px solid transparent;
  }
  .forum-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
  }
  .forum-btn--primary:hover { filter: brightness(0.95); }

  .forum-empty {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }
  .forum-empty i { font-size: 40px; display: block; margin-bottom: 12px; }
  .forum-empty p { margin: 0 0 14px; font-size: 15px; }

  .forum-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .forum-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    transition: border-color 0.15s, transform 0.05s;
  }
  .forum-card:hover { border-color: #c7d2fe; }
  .forum-card--pinned { border-color: #f1ff32; background: #fffef0; }

  .forum-card__link {
    display: flex;
    gap: 16px;
    padding: 16px 18px;
    text-decoration: none;
    color: inherit;
  }
  .forum-card__anime {
    width: 64px;
    height: 88px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
  }
  .forum-card__avatar {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 22px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .forum-card__body { flex: 1; min-width: 0; }
  .forum-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .forum-pill {
    background: #f3f4f6;
    color: #374151;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 500;
  }
  .forum-pill--pin { background: #fef3c7; color: #92400e; }
  .forum-card__by { font-size: 12px; }
  .forum-card__title {
    font-size: 17px;
    font-weight: 700;
    margin: 2px 0 4px;
    line-height: 1.35;
    color: #111;
  }
  .forum-card__snippet {
    color: #4b5563;
    font-size: 13px;
    margin: 0 0 8px;
    line-height: 1.4;
  }
  .forum-card__stats {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #6b7280;
  }
  .forum-card__stats i { margin-right: 4px; }

  .forum-pager {
    margin-top: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-size: 14px;
    color: #4b5563;
  }
  .forum-pager a { color: var(--site-dark, #111); font-weight: 600; }

  @media (max-width: 540px) {
    .forum-card__link { padding: 12px 14px; gap: 12px; }
    .forum-card__anime { width: 52px; height: 72px; }
    .forum-card__avatar { width: 52px; height: 52px; font-size: 18px; }
    .forum-card__title { font-size: 15px; }
  }
</style>
