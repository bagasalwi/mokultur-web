<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { formatRelative, initials } from '$lib/forum';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  $: thread = data.thread;
  $: user = data.user;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
</script>

<svelte:head>
  <title>{thread.title} · Forum {siteName}</title>
  <meta name="description" content={thread.body?.slice(0, 160) ?? thread.title} />
</svelte:head>

<section class="thread-page">
  <div class="container-xl">
    <a href="/forum" class="thread-back">← Kembali ke forum</a>

    <article class="thread-card">
      <header class="thread-head">
        {#if thread.animeImg}
          <img class="thread-head__anime" src={thread.animeImg} alt={thread.animeTitle ?? ''} loading="lazy" />
        {/if}
        <div>
          {#if thread.animeTitle}
            <div class="thread-pill">{thread.animeTitle}</div>
          {/if}
          <h1>{thread.title}</h1>
          <div class="thread-meta">
            <span class="thread-avatar">{initials(thread.authorName)}</span>
            <span>{thread.authorName ?? 'Admin'}</span>
            <span>·</span>
            <span>{formatRelative(thread.createdAt)}</span>
            <span>·</span>
            <span><i class="bi bi-eye"></i> {thread.viewCount}</span>
          </div>
        </div>
      </header>

      {#if thread.body}
        <div class="thread-body">{thread.body}</div>
      {/if}
    </article>

    <h2 class="reply-heading">
      {thread.replyCount} Balasan
    </h2>

    <ul class="reply-list">
      {#each thread.replies as r (r.id)}
        <li class="reply-item">
          <span class="reply-avatar">{initials(r.authorName)}</span>
          <div class="reply-body">
            <div class="reply-meta">
              <strong>{r.authorName ?? 'User'}</strong>
              <span>· {formatRelative(r.createdAt)}</span>
            </div>
            <p class="reply-text">{r.body}</p>
          </div>
        </li>
      {:else}
        <li class="reply-empty">Belum ada balasan. Jadilah yang pertama!</li>
      {/each}
    </ul>

    {#if thread.status === 'locked' || thread.status === 'archived'}
      <div class="reply-locked">
        <i class="bi bi-lock"></i> Thread ini terkunci. Tidak menerima balasan baru.
      </div>
    {:else if user}
      <form
        method="POST"
        action="?/reply"
        class="reply-form"
        use:enhance={() => async ({ result, update }) => {
          await update({ reset: result.type === 'success' });
          if (result.type === 'success') await invalidateAll();
        }}
      >
        <input type="hidden" name="thread_id" value={thread.id} />
        {#if form?.error}
          <div class="reply-alert">{form.error}</div>
        {/if}
        <textarea
          name="body"
          rows="3"
          maxlength="5000"
          placeholder="Tulis balasanmu..."
          required
        ></textarea>
        <button type="submit" class="forum-btn forum-btn--primary">
          <i class="bi bi-send"></i> Kirim Balasan
        </button>
      </form>
    {:else}
      <div class="reply-cta">
        <p>Mau ikut diskusi? <a href="/auth/login?redirect=/forum/{thread.slug}">Masuk dulu</a> ya.</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .thread-page { padding: 24px 0 60px; }
  .thread-back {
    display: inline-block;
    margin-bottom: 16px;
    font-size: 13px;
    color: #4b5563;
    text-decoration: none;
  }
  .thread-back:hover { text-decoration: underline; }

  .thread-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 24px;
  }
  .thread-head {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  .thread-head__anime {
    width: 80px; height: 110px;
    object-fit: cover; border-radius: 8px;
    flex-shrink: 0;
  }
  .thread-head h1 { font-size: 22px; margin: 4px 0 8px; line-height: 1.3; }
  .thread-pill {
    display: inline-block;
    background: #f3f4f6;
    color: #374151;
    padding: 2px 10px;
    font-size: 12px;
    border-radius: 999px;
    font-weight: 500;
  }
  .thread-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;
    flex-wrap: wrap;
  }
  .thread-avatar {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 11px;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .thread-body {
    color: #1f2937;
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .reply-heading { font-size: 18px; margin: 28px 0 16px; }

  .reply-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
  .reply-item {
    display: flex;
    gap: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .reply-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 13px;
    flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .reply-body { flex: 1; min-width: 0; }
  .reply-meta { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
  .reply-meta strong { color: #111; font-weight: 600; }
  .reply-text { color: #1f2937; font-size: 14px; line-height: 1.5; margin: 0; white-space: pre-wrap; }
  .reply-empty {
    text-align: center; color: #6b7280;
    padding: 20px; font-size: 14px;
    background: #f9fafb; border-radius: 10px;
  }

  .reply-locked {
    margin-top: 20px; padding: 14px;
    background: #fff7ed; color: #9a3412;
    border: 1px solid #fed7aa; border-radius: 10px;
    text-align: center; font-size: 14px;
  }
  .reply-cta {
    margin-top: 20px; padding: 14px 16px;
    background: #f9fafb; border: 1px solid #e5e7eb;
    border-radius: 10px; text-align: center;
  }
  .reply-cta p { margin: 0; font-size: 14px; color: #4b5563; }
  .reply-cta a { color: var(--site-dark, #111); font-weight: 600; }

  .reply-form {
    margin-top: 20px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .reply-form textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    outline: none;
  }
  .reply-form textarea:focus {
    border-color: var(--site-primary, #f1ff32);
    box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25);
  }
  .reply-alert {
    background: #fef2f2; color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 8px; padding: 8px 12px; font-size: 13px;
  }

  .forum-btn {
    align-self: flex-end;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .forum-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
  }
</style>
