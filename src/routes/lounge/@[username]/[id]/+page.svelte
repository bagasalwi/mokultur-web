<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { formatRelative, initials, imgUrl, articleUrl, type ThreadReply } from '$lib/threads';
  import { invalidateAll } from '$app/navigation';
  import ShareMenu from '$components/threads/ShareMenu.svelte';

  export let data: PageData;
  export let form: ActionData;

  $: thread = data.thread;
  $: user = data.user;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: snippet = (thread.body ?? '').slice(0, 160);
  $: handle = thread.authorUsername || (thread.authorId ? `u${thread.authorId}` : 'user');
  $: ogTitle = `${thread.authorName ?? 'Thread'} di Culture Lounge`;
  $: ogImage = thread.imagePath ? imgUrl(thread.imagePath) : null;
  $: pageUrl = $page.url.href;
  $: artUrl = articleUrl(thread);

  let liked = data.thread.liked ?? false;
  let likeCount = data.thread.likeCount;
  let lastId = data.thread.id;
  $: if (data.thread.id !== lastId) {
    lastId = data.thread.id;
    liked = data.thread.liked ?? false;
    likeCount = data.thread.likeCount;
  }

  let replyLikeOverride: Record<number, { liked: boolean; count: number }> = {};
  const replyLikeOf = (r: ThreadReply) =>
    replyLikeOverride[r.id] ?? { liked: r.likedByMe ?? false, count: r.likeCount };

  let replyTo: ThreadReply | null = null;
  function setReplyTo(r: ThreadReply) { replyTo = r; document.getElementById('reply-body')?.focus(); }
  function clearReplyTo() { replyTo = null; }

  let replyImagePreview: string | null = null;
  function onReplyImage(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (replyImagePreview) URL.revokeObjectURL(replyImagePreview);
    replyImagePreview = f ? URL.createObjectURL(f) : null;
  }
  function clearReplyImage() {
    if (replyImagePreview) URL.revokeObjectURL(replyImagePreview);
    replyImagePreview = null;
    const el = document.getElementById('reply-image') as HTMLInputElement | null;
    if (el) el.value = '';
  }

  onMount(() => {
    const flat: number[] = [];
    for (const p of thread.replies) {
      flat.push(p.id);
      for (const c of p.children ?? []) flat.push(c.id);
    }
    for (const id of flat) {
      fetch(`${PUBLIC_API_URL}/api/threads/replies/${id}/view`, { method: 'POST' }).catch(() => {});
    }
  });
</script>

<svelte:head>
  <title>{ogTitle} · {siteName}</title>
  <meta name="description" content={snippet || 'Thread di Culture Lounge'} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={snippet || 'Thread di Culture Lounge'} />
  <meta property="og:url" content={pageUrl} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImage} />
  {:else}
    <meta name="twitter:card" content="summary" />
  {/if}
  <meta name="twitter:title" content={ogTitle} />
  <meta name="twitter:description" content={snippet || 'Thread di Culture Lounge'} />
</svelte:head>

<section class="mt-detail">
  <div class="container-xl mt-detail__wrap">
    <div class="mt-breadcrumb">
      <a href="/lounge" class="mt-breadcrumb__root"><i class="bi bi-stars"></i> Culture Lounge</a>
      <span class="mt-breadcrumb__sep">/</span>
      <a href="/lounge/@{handle}" class="mt-breadcrumb__user">@{handle}</a>
    </div>

    <article class="mt-thread">
      <div class="mt-thread__rail">
        <a href="/lounge/@{handle}" class="mt-thread__avatar-link">
          <div class="mt-thread__avatar">
            {#if thread.authorImg}<img src={imgUrl(thread.authorImg)} alt={thread.authorName ?? ''} />{:else}<span>{initials(thread.authorName)}</span>{/if}
          </div>
        </a>
      </div>

      <div class="mt-thread__body">
        <div class="mt-thread__head">
          <a href="/lounge/@{handle}" class="mt-thread__author">
            <strong>{thread.authorName ?? 'User'}</strong>
            <span class="mt-thread__handle">@{handle}</span>
          </a>
          <span class="mt-thread__time">· {formatRelative(thread.createdAt)}</span>
          {#if thread.animeTitle}<span class="mt-pill">{thread.animeTitle}</span>{/if}
        </div>

        {#if artUrl}
          <a class="mt-article-chip" href={artUrl}>
            {#if thread.articleImg}<img src={thread.articleImg} alt="" />{/if}
            <span><i class="bi bi-newspaper"></i> {thread.articleTitle}</span>
          </a>
        {/if}

        {#if thread.body}<div class="mt-thread__text">{thread.body}</div>{/if}
        {#if thread.imagePath}<div class="mt-thread__media"><img src={imgUrl(thread.imagePath)} alt="" /></div>{/if}

        <div class="mt-thread__stats">
          <span class="mt-stat"><i class="bi bi-chat"></i> {thread.replyCount}</span>
          {#if user}
            <form method="POST" action="?/like" use:enhance={() => async ({ result }) => {
              if (result.type === 'success' && result.data && 'likeCount' in result.data) {
                liked = !!result.data.liked; likeCount = Number(result.data.likeCount);
              }
            }}>
              <button type="submit" class="mt-stat mt-stat--btn" class:is-liked={liked} aria-label="Suka">
                <i class="bi {liked ? 'bi-heart-fill' : 'bi-heart'}"></i> {likeCount}
              </button>
            </form>
          {:else}
            <a class="mt-stat mt-stat--btn" href="/auth/login?redirect=/lounge/@{handle}/{thread.id}" aria-label="Suka">
              <i class="bi bi-heart"></i> {likeCount}
            </a>
          {/if}
          <ShareMenu url={pageUrl} title={ogTitle} />
          <span class="mt-stat mt-stat--muted"><i class="bi bi-eye"></i> {thread.viewCount}</span>
        </div>
      </div>
    </article>

    <h2 class="mt-reply-heading">{thread.replyCount} Balasan</h2>

    <span class="mt-reply-list">
      {#each thread.replies as r (r.id)}
        <span class="mt-reply" class:mt-reply--haschildren={r.children && r.children.length}>
          <div class="mt-reply__rail">
            <div class="mt-reply__avatar">
              {#if r.authorImg}<img src={imgUrl(r.authorImg)} alt={r.authorName ?? ''} />{:else}<span>{initials(r.authorName)}</span>{/if}
            </div>
          </div>
          <div class="mt-reply__body">
            <div class="mt-reply__meta">
              {#if r.authorUsername}
                <a href="/lounge/@{r.authorUsername}" class="mt-reply__author-link">
                  <strong>{r.authorName ?? 'User'}</strong>
                  <span class="mt-reply__handle">@{r.authorUsername}</span>
                </a>
              {:else}
                <strong>{r.authorName ?? 'User'}</strong>
              {/if}
              <span>· {formatRelative(r.createdAt)}</span>
            </div>
            {#if r.body}<p class="mt-reply__text">{r.body}</p>{/if}
            {#if r.imagePath}<div class="mt-reply__media"><img src={imgUrl(r.imagePath)} alt="" loading="lazy" /></div>{/if}

            <div class="mt-reply__actions">
              {#if user}
                <form method="POST" action="?/replyLike" use:enhance={() => async ({ result }) => {
                  if (result.type === 'success' && result.data && 'likeCount' in result.data) {
                    replyLikeOverride[r.id] = { liked: !!result.data.liked, count: Number(result.data.likeCount) };
                    replyLikeOverride = replyLikeOverride;
                  }
                }}>
                  <input type="hidden" name="reply_id" value={r.id} />
                  <button type="submit" class="mt-ract" class:is-liked={replyLikeOf(r).liked} aria-label="Suka balasan">
                    <i class="bi {replyLikeOf(r).liked ? 'bi-heart-fill' : 'bi-heart'}"></i> {replyLikeOf(r).count}
                  </button>
                </form>
                <button type="button" class="mt-ract" on:click={() => setReplyTo(r)}><i class="bi bi-reply"></i> Balas</button>
              {:else}
                <span class="mt-ract mt-ract--muted"><i class="bi bi-heart"></i> {replyLikeOf(r).count}</span>
              {/if}
              <span class="mt-ract mt-ract--muted"><i class="bi bi-eye"></i> {r.viewCount}</span>
            </div>

            {#if r.children && r.children.length}
              <span class="mt-reply-children">
                {#each r.children as c (c.id)}
                  <span class="mt-reply mt-reply--child">
                    <div class="mt-reply__rail">
                      <div class="mt-reply__avatar mt-reply__avatar--sm">
                        {#if c.authorImg}<img src={imgUrl(c.authorImg)} alt={c.authorName ?? ''} />{:else}<span>{initials(c.authorName)}</span>{/if}
                      </div>
                    </div>
                    <div class="mt-reply__body">
                      <div class="mt-reply__meta">
                        {#if c.authorUsername}
                          <a href="/lounge/@{c.authorUsername}" class="mt-reply__author-link">
                            <strong>{c.authorName ?? 'User'}</strong>
                            <span class="mt-reply__handle">@{c.authorUsername}</span>
                          </a>
                        {:else}
                          <strong>{c.authorName ?? 'User'}</strong>
                        {/if}
                        <span>· {formatRelative(c.createdAt)}</span>
                      </div>
                      {#if c.body}<p class="mt-reply__text">{c.body}</p>{/if}
                      {#if c.imagePath}<div class="mt-reply__media"><img src={imgUrl(c.imagePath)} alt="" loading="lazy" /></div>{/if}
                      <div class="mt-reply__actions">
                        {#if user}
                          <form method="POST" action="?/replyLike" use:enhance={() => async ({ result }) => {
                            if (result.type === 'success' && result.data && 'likeCount' in result.data) {
                              replyLikeOverride[c.id] = { liked: !!result.data.liked, count: Number(result.data.likeCount) };
                              replyLikeOverride = replyLikeOverride;
                            }
                          }}>
                            <input type="hidden" name="reply_id" value={c.id} />
                            <button type="submit" class="mt-ract" class:is-liked={replyLikeOf(c).liked} aria-label="Suka balasan">
                              <i class="bi {replyLikeOf(c).liked ? 'bi-heart-fill' : 'bi-heart'}"></i> {replyLikeOf(c).count}
                            </button>
                          </form>
                          <button type="button" class="mt-ract" on:click={() => setReplyTo(r)}><i class="bi bi-reply"></i> Balas</button>
                        {:else}
                          <span class="mt-ract mt-ract--muted"><i class="bi bi-heart"></i> {replyLikeOf(c).count}</span>
                        {/if}
                        <span class="mt-ract mt-ract--muted"><i class="bi bi-eye"></i> {c.viewCount}</span>
                      </div>
                    </div>
                  </span>
                {/each}
              </span>
            {/if}
          </div>
        </span>
      {:else}
        <span class="mt-reply-empty">Belum ada balasan. Jadilah yang pertama!</span>
      {/each}
    </span>

    {#if thread.status === 'locked' || thread.status === 'archived'}
      <div class="mt-locked"><i class="bi bi-lock"></i> Thread terkunci. Tidak menerima balasan baru.</div>
    {:else if user}
      <form
        method="POST"
        action="?/reply"
        enctype="multipart/form-data"
        class="mt-reply-form"
        use:enhance={() => async ({ result, update }) => {
          await update({ reset: result.type === 'success' });
          if (result.type === 'success') { clearReplyImage(); clearReplyTo(); await invalidateAll(); }
        }}
      >
        <input type="hidden" name="parent_reply_id" value={replyTo?.id ?? ''} />
        {#if form?.error}<div class="mt-reply-alert">{form.error}</div>{/if}
        {#if replyTo}
          <div class="mt-replyto">
            <span><i class="bi bi-reply"></i> Membalas <strong>{replyTo.authorName ?? 'User'}</strong></span>
            <button type="button" on:click={clearReplyTo} aria-label="Batal balas"><i class="bi bi-x"></i></button>
          </div>
        {/if}
        <textarea id="reply-body" name="body" rows="3" maxlength="5000" placeholder="Tulis balasanmu..."></textarea>
        {#if replyImagePreview}
          <div class="mt-reply-preview">
            <img src={replyImagePreview} alt="Preview" />
            <button type="button" on:click={clearReplyImage} aria-label="Hapus gambar"><i class="bi bi-x-lg"></i></button>
          </div>
        {/if}
        <div class="mt-reply-form__actions">
          <label class="mt-icon-btn" for="reply-image" title="Tambah gambar">
            <i class="bi bi-image"></i> <span class="d-none d-sm-inline">Gambar</span>
          </label>
          <input id="reply-image" type="file" name="image" accept="image/jpeg,image/png,image/webp" on:change={onReplyImage} class="mt-visually-hidden" />
          <button type="submit" class="mt-btn mt-btn--primary"><i class="bi bi-send"></i> Kirim Balasan</button>
        </div>
      </form>
    {:else}
      <div class="mt-reply-cta">
        <p>Mau ikut diskusi? <a href="/auth/login?redirect=/lounge/@{handle}/{thread.id}">Masuk dulu</a> ya.</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .mt-detail { padding: 20px 0 60px; background: linear-gradient(180deg, #fafbff 0%, transparent 320px); }
  .mt-detail__wrap { max-width: 720px; }

  /* Breadcrumb nav */
  .mt-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 16px; }
  .mt-breadcrumb__root, .mt-breadcrumb__user { color: #4b5563; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
  .mt-breadcrumb__root:hover, .mt-breadcrumb__user:hover { color: #111; text-decoration: underline; }
  .mt-breadcrumb__user { font-weight: 600; }
  .mt-breadcrumb__sep { color: #9ca3af; }

  /* Thread maker — same left rail as replies for alignment */
  .mt-thread { display: flex; gap: 14px; background: #fff; border-radius: 16px; padding: 22px; border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(15,23,42,0.05); position: relative; overflow: hidden; }
  .mt-thread::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--site-primary, #f1ff32), #7dd3fc); }
  .mt-thread__rail { flex-shrink: 0; }
  .mt-thread__avatar-link { display: block; text-decoration: none; }
  .mt-thread__avatar-link:hover .mt-thread__avatar { opacity: 0.85; }
  .mt-thread__avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); font-weight: 700; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; }
  .mt-thread__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-thread__body { flex: 1; min-width: 0; }
  .mt-thread__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; font-size: 13px; color: #6b7280; margin-bottom: 10px; }
  .mt-thread__author { display: inline-flex; align-items: baseline; gap: 6px; min-width: 0; text-decoration: none; color: inherit; }
  .mt-thread__author:hover strong { text-decoration: underline; }
  .mt-thread__head strong { color: #111; font-weight: 600; font-size: 15px; }
  .mt-thread__handle { color: #6b7280; font-size: 13px; }
  .mt-thread__time { font-size: 12px; }
  .mt-thread__text { color: #111; font-size: 16px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; margin-bottom: 12px; }
  .mt-thread__media { border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb; margin-bottom: 12px; }
  .mt-thread__media img { width: 100%; max-height: 600px; object-fit: cover; display: block; }
  .mt-thread__stats { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; }
  .mt-thread__stats form { margin: 0; }
  .mt-thread__stats i { margin-right: 4px; }
  .mt-stat { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; color: #6b7280; text-decoration: none; }
  .mt-stat--btn { background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
  .mt-stat--btn:hover { background: #f3f4f6; color: #111; }
  .mt-stat--btn.is-liked { color: #e11d48; }
  .mt-stat--muted { margin-left: auto; cursor: default; }

  .mt-pill { background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }

  .mt-reply-heading { font-size: 16px; margin: 28px 0 6px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
  .mt-reply-heading::before { content: "\F28A"; font-family: "bootstrap-icons"; color: #9ca3af; font-weight: 400; }

  /* Threads-by-Meta style: borderless rows aligned under a left avatar rail w/ connector line */
  .mt-reply-list { display: block; }
  .mt-reply { display: flex; gap: 14px; padding: 14px 4px 4px; position: relative; }
  .mt-reply__rail { flex-shrink: 0; position: relative; display: flex; flex-direction: column; align-items: center; }
  .mt-reply__avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; z-index: 1; }
  .mt-reply__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-reply__avatar--sm { width: 32px; height: 32px; font-size: 11px; }
  /* connector line running down from avatar to the children below */
  .mt-reply--haschildren > .mt-reply__rail::after {
    content: ''; position: absolute; top: 44px; bottom: -10px; left: 50%;
    width: 2px; transform: translateX(-50%); background: #e5e7eb;
  }
  .mt-reply__body { flex: 1; min-width: 0; padding-bottom: 6px; border-bottom: 1px solid #f1f3f5; }
  .mt-reply--child > .mt-reply__body { border-bottom: none; }
  .mt-reply__meta { font-size: 12px; color: #6b7280; margin-bottom: 2px; display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
  .mt-reply__meta strong { color: #111; font-weight: 600; font-size: 13.5px; }
  .mt-reply__handle { color: #6b7280; }
  .mt-reply__author-link { display: inline-flex; align-items: baseline; gap: 5px; text-decoration: none; color: inherit; }
  .mt-reply__author-link:hover strong { text-decoration: underline; }
  .mt-reply__text { color: #1f2937; font-size: 14px; line-height: 1.5; margin: 0; white-space: pre-wrap; word-wrap: break-word; }
  .mt-reply__media { margin: 6px 0 0; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; max-height: 320px; }
  .mt-reply__media img { width: 100%; max-height: 320px; object-fit: cover; display: block; }
  .mt-reply-empty { display: block; text-align: center; color: #6b7280; padding: 24px; font-size: 14px; }

  .mt-reply__actions { display: flex; align-items: center; gap: 4px; margin-top: 6px; }
  .mt-reply__actions form { margin: 0; }
  .mt-ract { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; color: #6b7280; font-size: 12.5px; font-weight: 500; padding: 4px 8px; border-radius: 999px; text-decoration: none; }
  .mt-ract:hover { background: #f3f4f6; color: #111; }
  .mt-ract.is-liked { color: #e11d48; }
  .mt-ract--muted { cursor: default; }
  .mt-ract--muted:hover { background: none; color: #6b7280; }

  /* children indent under the same rail, with their own connector stubs */
  .mt-reply-children { display: block; margin: 6px 0 0; }
  .mt-reply-children .mt-reply { padding: 12px 0 0; }
  .mt-reply-children .mt-reply__body { border-bottom: none; }

  .mt-locked, .mt-reply-cta { margin: 18px 0; padding: 14px 16px; border-radius: 10px; text-align: center; font-size: 14px; }
  .mt-locked { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
  .mt-reply-cta { background: #f9fafb; color: #4b5563; border: 1px solid #e5e7eb; }
  .mt-reply-cta a { color: var(--site-dark, #111); font-weight: 600; }

  .mt-reply-form { margin: 18px 0 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .mt-reply-form textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit; resize: vertical; outline: none; }
  .mt-reply-form textarea:focus { border-color: var(--site-primary, #f1ff32); box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25); }
  .mt-reply-alert { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 13px; }
  .mt-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid transparent; cursor: pointer; }
  .mt-btn--primary { background: var(--site-primary, #f1ff32); color: var(--site-dark, #0a0a0a); }

  .mt-article-chip { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; text-decoration: none; color: #1f2937; }
  .mt-article-chip:hover { background: #f1f5f9; }
  .mt-article-chip img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
  .mt-article-chip span { font-size: 13px; font-weight: 600; line-height: 1.3; }
  .mt-article-chip i { color: #4338ca; margin-right: 4px; }

  .mt-replyto { display: flex; align-items: center; justify-content: space-between; background: #eef2ff; color: #4338ca; border-radius: 8px; padding: 6px 10px; font-size: 12.5px; }
  .mt-replyto button { background: none; border: none; color: #4338ca; cursor: pointer; }
  .mt-reply-preview { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; max-height: 240px; }
  .mt-reply-preview img { width: 100%; max-height: 240px; object-fit: cover; display: block; }
  .mt-reply-preview button { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; border: none; cursor: pointer; }
  .mt-reply-form__actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .mt-icon-btn { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #4b5563; font-size: 13px; font-weight: 500; padding: 6px 10px; border-radius: 8px; background: none; border: none; }
  .mt-icon-btn:hover { background: #f3f4f6; }
  .mt-icon-btn i { font-size: 17px; }
  .mt-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

  @media (max-width: 540px) {
    .mt-thread { padding: 16px; gap: 12px; }
    .mt-thread__avatar { width: 42px; height: 42px; font-size: 14px; }
    .mt-thread__text { font-size: 15px; }
    .mt-thread__media img { max-height: 420px; }
    .mt-reply { gap: 10px; }
  }
</style>
