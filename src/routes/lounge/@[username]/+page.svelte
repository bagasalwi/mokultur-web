<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { formatRelative, initials, imgUrl, threadUrl, authorHandle, type Thread } from '$lib/threads';
  import ShareMenu from '$components/threads/ShareMenu.svelte';

  export let data: PageData;
  export let form: ActionData;

  $: profile = data.profile;
  $: threads = data.threads as (Thread & { topReply?: { authorImg: string | null; authorName: string | null; body: string | null; imagePath: string | null; likeCount: number } | null })[];
  $: meta = data.meta;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: me = data.user;
  $: pages = Math.max(1, Math.ceil(meta.total / meta.perPage));

  $: topPosts = [...threads].sort((a, b) => b.replyCount - a.replyCount).slice(0, 5);

  let origin = '';
  onMount(() => { origin = location.origin; });

  let likeOverride: Record<number, { liked: boolean; count: number }> = {};
  const likeOf = (t: { id: number; likeCount: number }) =>
    likeOverride[t.id] ?? { liked: false, count: t.likeCount };
</script>

<svelte:head>
  <title>@{profile.username} · Culture Lounge · {siteName}</title>
  <meta name="description" content="Postingan {profile.name} di Culture Lounge {siteName}." />
</svelte:head>

<section class="lp-page">
  <div class="container-xl">
    <a href="/lounge" class="lp-back"><i class="bi bi-arrow-left"></i> Culture Lounge</a>

    <!-- Profile Header -->
    <div class="lp-header">
      <div class="lp-header__avatar">
        {#if profile.img}
          <img src={imgUrl(profile.img)} alt={profile.name} />
        {:else}
          <span>{initials(profile.name)}</span>
        {/if}
      </div>
      <div class="lp-header__info">
        <h1 class="lp-header__name">{profile.name}</h1>
        <p class="lp-header__handle">@{profile.username}</p>
        {#if profile.description}
          <p class="lp-header__bio">{profile.description}</p>
        {/if}
        <p class="lp-header__stats">
          <i class="bi bi-stars"></i>
          {meta.total} postingan di Culture Lounge
        </p>
        {#if profile.instagram || profile.facebook}
          <div class="lp-header__socials">
            {#if profile.instagram}
              <a href="https://instagram.com/{profile.instagram}" target="_blank" rel="noopener noreferrer" class="lp-social-link lp-social-link--ig">
                <i class="bi bi-instagram"></i>
                <span>@{profile.instagram}</span>
              </a>
            {/if}
            {#if profile.facebook}
              <a href="https://facebook.com/{profile.facebook}" target="_blank" rel="noopener noreferrer" class="lp-social-link lp-social-link--fb">
                <i class="bi bi-facebook"></i>
                <span>{profile.facebook}</span>
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- 2-col grid -->
    <div class="lp-grid">
      <main class="lp-main">
        {#if threads.length === 0}
          <div class="lp-empty">
            <i class="bi bi-chat-square-dots"></i>
            <p>Belum ada postingan dari @{profile.username}.</p>
          </div>
        {:else}
          <ul class="mt-feed">
            {#each threads as t (t.id)}
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
                    <a class="mt-act" href="/auth/login?redirect=/lounge/@{profile.username}" aria-label="Suka"><i class="bi bi-heart"></i> {likeOf(t).count}</a>
                  {/if}
                  <ShareMenu url={`${origin}${threadUrl(t)}`} title={`${profile.name} di Culture Lounge · ${siteName}`} compact />
                  <span class="mt-act mt-act--view"><i class="bi bi-eye"></i> {t.viewCount}</span>
                </div>
              </li>
            {/each}
          </ul>

          {#if pages > 1}
            <nav class="lp-pager" aria-label="Pagination">
              {#if meta.page > 1}
                <a href="?page={meta.page - 1}">← Sebelumnya</a>
              {/if}
              <span>Halaman {meta.page} dari {pages}</span>
              {#if meta.hasMore}
                <a href="?page={meta.page + 1}">Selanjutnya →</a>
              {/if}
            </nav>
          {/if}
        {/if}
      </main>

      <aside class="lp-aside">
        <!-- Profile mini card -->
        <div class="lp-side-card">
          <div class="lp-mini-profile">
            <div class="lp-mini-profile__avatar">
              {#if profile.img}
                <img src={imgUrl(profile.img)} alt={profile.name} />
              {:else}
                <span>{initials(profile.name)}</span>
              {/if}
            </div>
            <div>
              <strong>{profile.name}</strong>
              <small>@{profile.username}</small>
            </div>
          </div>
          {#if profile.description}
            <p class="lp-mini-profile__bio">{profile.description.slice(0, 120)}{profile.description.length > 120 ? '…' : ''}</p>
          {/if}
          {#if profile.instagram || profile.facebook}
            <div class="lp-mini-socials">
              {#if profile.instagram}
                <a href="https://instagram.com/{profile.instagram}" target="_blank" rel="noopener noreferrer" class="lp-mini-social lp-mini-social--ig" title="Instagram @{profile.instagram}">
                  <i class="bi bi-instagram"></i>
                </a>
              {/if}
              {#if profile.facebook}
                <a href="https://facebook.com/{profile.facebook}" target="_blank" rel="noopener noreferrer" class="lp-mini-social lp-mini-social--fb" title="Facebook {profile.facebook}">
                  <i class="bi bi-facebook"></i>
                </a>
              {/if}
            </div>
          {/if}
          <p class="lp-mini-profile__count"><i class="bi bi-stars"></i> {meta.total} postingan</p>
          <a href="/lounge" class="lp-back-link"><i class="bi bi-arrow-left"></i> Semua postingan</a>
        </div>

        <!-- Top Posts dari user ini -->
        {#if topPosts.length > 0}
          <div class="lp-side-card">
            <h3 class="lp-side-title"><i class="bi bi-fire"></i> Top Posts</h3>
            <ol class="lp-top-list">
              {#each topPosts as t, i (t.id)}
                <li>
                  <a href={threadUrl(t)} class="lp-top-item">
                    <span class="lp-top-num">{i + 1}</span>
                    <div class="lp-top-content">
                      <p class="lp-top-text">{(t.body ?? '').slice(0, 70)}{(t.body ?? '').length > 70 ? '…' : ''}</p>
                      <small><i class="bi bi-chat"></i> {t.replyCount} · <i class="bi bi-heart"></i> {t.likeCount}</small>
                    </div>
                  </a>
                </li>
              {/each}
            </ol>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</section>

<style>
  .lp-page { padding: 20px 0 60px; }

  .lp-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: #4b5563; text-decoration: none; margin-bottom: 16px;
  }
  .lp-back:hover { color: #111; text-decoration: underline; }

  /* Profile header */
  .lp-header {
    display: flex; align-items: flex-start; gap: 20px;
    background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;
    padding: 24px; margin-bottom: 24px;
    box-shadow: 0 4px 16px rgba(15,23,42,0.05);
    position: relative; overflow: hidden;
  }
  .lp-header::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, var(--site-primary, #f1ff32), #7dd3fc);
  }
  .lp-header__avatar {
    width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
    background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 28px; overflow: hidden;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .lp-header__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .lp-header__info { flex: 1; min-width: 0; }
  .lp-header__name { font-size: 22px; font-weight: 700; margin: 0 0 2px; color: #111; }
  .lp-header__handle { font-size: 14px; color: #6b7280; margin: 0 0 6px; }
  .lp-header__bio { font-size: 14px; color: #374151; margin: 0 0 8px; line-height: 1.5; }
  .lp-header__stats { font-size: 13px; color: #6b7280; margin: 0; display: flex; align-items: center; gap: 5px; }
  .lp-header__stats i { color: var(--site-primary, #f1ff32); font-size: 14px; }
  .lp-header__socials { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .lp-social-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 500; padding: 4px 12px; border-radius: 999px; text-decoration: none; border: 1px solid; transition: opacity 0.15s; }
  .lp-social-link:hover { opacity: 0.75; }
  .lp-social-link--ig { color: #e1306c; border-color: #e1306c; background: #fff0f4; }
  .lp-social-link--fb { color: #1877f2; border-color: #1877f2; background: #f0f5ff; }

  /* 2-column grid */
  .lp-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 28px;
    align-items: start;
  }
  @media (max-width: 991.98px) {
    .lp-grid { grid-template-columns: 1fr; }
    .lp-aside { display: none; }
  }
  .lp-main { min-width: 0; }

  /* Feed: individual cards */
  .mt-feed { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 10px; }
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

  /* Content area */
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

  /* Actions */
  .mt-card__actions { display: flex; align-items: center; gap: 2px; padding: 4px 10px 12px 60px; border-top: 1px solid #f3f4f6; margin-top: 4px; }
  .mt-card__actions form { margin: 0; }
  .mt-act { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; color: #6b7280; font-size: 13px; font-weight: 500; text-decoration: none; padding: 5px 10px; border-radius: 999px; }
  .mt-act:hover { background: #f3f4f6; color: #374151; }
  .mt-act--like.is-liked { color: #e11d48; }
  .mt-act--like:hover { color: #e11d48; background: #fff0f3; }
  .mt-act--view { margin-left: auto; color: #9ca3af; font-size: 12px; cursor: default; }
  .mt-act--view:hover { background: none; color: #9ca3af; }

  /* Empty state */
  .lp-empty { text-align: center; padding: 50px 20px; color: #6b7280; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
  .lp-empty i { font-size: 40px; display: block; margin-bottom: 10px; }
  .lp-empty p { margin: 0; font-size: 15px; }

  /* Pagination */
  .lp-pager { display: flex; align-items: center; justify-content: center; gap: 14px; font-size: 13px; color: #4b5563; margin-top: 4px; }
  .lp-pager a { color: #111; font-weight: 600; text-decoration: none; }
  .lp-pager a:hover { text-decoration: underline; }

  /* Sidebar */
  .lp-aside { position: sticky; top: 90px; display: flex; flex-direction: column; gap: 14px; }
  .lp-side-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; }
  .lp-side-title { font-size: 14px; font-weight: 700; margin: 0 0 10px; color: #111; display: flex; align-items: center; gap: 6px; }
  .lp-side-title i { color: #f59e0b; }

  .lp-mini-profile { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .lp-mini-profile__avatar { width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0; overflow: hidden; background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); font-weight: 700; font-size: 15px; display: inline-flex; align-items: center; justify-content: center; }
  .lp-mini-profile__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .lp-mini-profile strong { display: block; font-size: 14px; color: #111; font-weight: 600; }
  .lp-mini-profile small { font-size: 12px; color: #6b7280; }
  .lp-mini-profile__bio { font-size: 12.5px; color: #6b7280; line-height: 1.4; margin: 0 0 8px; }
  .lp-mini-socials { display: flex; gap: 6px; margin-bottom: 10px; }
  .lp-mini-social { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-size: 13px; border: 1px solid; transition: opacity 0.15s; }
  .lp-mini-social:hover { opacity: 0.75; }
  .lp-mini-social--ig { color: #e1306c; border-color: #e1306c; background: #fff0f4; }
  .lp-mini-social--fb { color: #1877f2; border-color: #1877f2; background: #f0f5ff; }
  .lp-mini-profile__count { font-size: 12px; color: #6b7280; margin: 0 0 10px; display: flex; align-items: center; gap: 4px; }
  .lp-mini-profile__count i { color: var(--site-primary, #f1ff32); }
  .lp-back-link { font-size: 13px; color: #4b5563; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; }
  .lp-back-link:hover { color: #111; }

  .lp-top-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .lp-top-item { display: flex; gap: 10px; text-decoration: none; color: inherit; padding: 4px 0; }
  .lp-top-num { flex-shrink: 0; width: 22px; height: 22px; background: #f3f4f6; color: #6b7280; border-radius: 50%; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-top: 2px; }
  .lp-top-content { flex: 1; min-width: 0; }
  .lp-top-text { font-size: 13px; color: #111; line-height: 1.4; margin: 0 0 2px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .lp-top-item small { color: #6b7280; font-size: 11px; }
  .lp-top-item:hover .lp-top-text { text-decoration: underline; }

  /* Mobile tweaks */
  @media (max-width: 540px) {
    .lp-header { padding: 16px; gap: 14px; }
    .lp-header__avatar { width: 60px; height: 60px; font-size: 22px; }
    .lp-header__name { font-size: 18px; }
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
</style>
