<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { formatRelative, initials, imgUrl } from '$lib/threads';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  $: thread = data.thread;
  $: user = data.user;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: snippet = (thread.body ?? '').slice(0, 160);
</script>

<svelte:head>
  <title>{thread.authorName ?? 'Thread'} · MokuThreads · {siteName}</title>
  <meta name="description" content={snippet || (thread.title ?? 'Thread di MokuThreads')} />
</svelte:head>

<section class="mt-detail">
  <div class="container-xl">
    <a href="/threads" class="mt-back">← Kembali ke feed</a>

    <article class="mt-thread">
      <div class="mt-thread__avatar">
        {#if thread.authorImg}
          <img src={imgUrl(thread.authorImg)} alt={thread.authorName ?? ''} />
        {:else}
          <span>{initials(thread.authorName)}</span>
        {/if}
      </div>

      <div class="mt-thread__body">
        <div class="mt-thread__head">
          <strong>{thread.authorName ?? 'Admin'}</strong>
          <span>· {formatRelative(thread.createdAt)}</span>
          {#if thread.animeTitle}<span class="mt-pill">{thread.animeTitle}</span>{/if}
          <span class="mt-thread__views"><i class="bi bi-eye"></i> {thread.viewCount}</span>
        </div>

        {#if thread.body}
          <div class="mt-thread__text">{thread.body}</div>
        {/if}

        {#if thread.imagePath}
          <div class="mt-thread__media">
            <img src={imgUrl(thread.imagePath)} alt="" />
          </div>
        {/if}
      </div>
    </article>

    <h2 class="mt-reply-heading">{thread.replyCount} Balasan</h2>

    <ul class="mt-reply-list">
      {#each thread.replies as r (r.id)}
        <li class="mt-reply">
          <div class="mt-reply__avatar">
            {#if r.authorImg}
              <img src={imgUrl(r.authorImg)} alt={r.authorName ?? ''} />
            {:else}
              <span>{initials(r.authorName)}</span>
            {/if}
          </div>
          <div class="mt-reply__body">
            <div class="mt-reply__meta">
              <strong>{r.authorName ?? 'User'}</strong>
              <span>· {formatRelative(r.createdAt)}</span>
            </div>
            <p class="mt-reply__text">{r.body}</p>
          </div>
        </li>
      {:else}
        <li class="mt-reply-empty">Belum ada balasan. Jadilah yang pertama!</li>
      {/each}
    </ul>

    {#if thread.status === 'locked' || thread.status === 'archived'}
      <div class="mt-locked">
        <i class="bi bi-lock"></i> Thread terkunci. Tidak menerima balasan baru.
      </div>
    {:else if user}
      <form
        method="POST"
        action="?/reply"
        class="mt-reply-form"
        use:enhance={() => async ({ result, update }) => {
          await update({ reset: result.type === 'success' });
          if (result.type === 'success') await invalidateAll();
        }}
      >
        <input type="hidden" name="thread_id" value={thread.id} />
        {#if form?.error}
          <div class="mt-reply-alert">{form.error}</div>
        {/if}
        <textarea
          name="body"
          rows="3"
          maxlength="5000"
          placeholder="Tulis balasanmu..."
          required
        ></textarea>
        <button type="submit" class="mt-btn mt-btn--primary">
          <i class="bi bi-send"></i> Kirim Balasan
        </button>
      </form>
    {:else}
      <div class="mt-reply-cta">
        <p>Mau ikut diskusi? <a href="/auth/login?redirect=/threads/{thread.slug}">Masuk dulu</a> ya.</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .mt-detail { padding: 24px 0 60px; }
  .mt-back {
    display: inline-block; margin-bottom: 16px;
    font-size: 13px; color: #4b5563; text-decoration: none;
  }
  .mt-back:hover { text-decoration: underline; }

  .mt-thread {
    display: flex; gap: 14px;
    background: #fff;
    border-radius: 14px;
    padding: 22px;
    max-width: 720px; margin: 0 auto;
    border: 1px solid #e5e7eb;
  }
  .mt-thread__avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 17px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .mt-thread__avatar img { width: 100%; height: 100%; object-fit: cover; }

  .mt-thread__body { flex: 1; min-width: 0; }
  .mt-thread__head {
    display: flex; flex-wrap: wrap; align-items: center;
    gap: 8px; font-size: 13px; color: #6b7280;
    margin-bottom: 10px;
  }
  .mt-thread__head strong { color: #111; font-weight: 600; font-size: 15px; }
  .mt-thread__views { margin-left: auto; font-size: 12px; }
  .mt-thread__views i { margin-right: 4px; }
  .mt-thread__text {
    color: #111; font-size: 17px; line-height: 1.6;
    white-space: pre-wrap; word-wrap: break-word;
    margin-bottom: 14px;
  }
  .mt-thread__media {
    border-radius: 14px; overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .mt-thread__media img {
    width: 100%; max-height: 600px;
    object-fit: cover; display: block;
  }

  .mt-pill {
    background: #f3f4f6; color: #374151;
    padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 500;
  }

  .mt-reply-heading {
    font-size: 17px; margin: 32px auto 16px;
    max-width: 720px;
  }
  .mt-reply-list {
    list-style: none; padding: 0; margin: 0;
    max-width: 720px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 10px;
  }
  .mt-reply {
    display: flex; gap: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 14px;
  }
  .mt-reply__avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 13px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .mt-reply__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-reply__body { flex: 1; min-width: 0; }
  .mt-reply__meta { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
  .mt-reply__meta strong { color: #111; font-weight: 600; }
  .mt-reply__text {
    color: #1f2937; font-size: 14px; line-height: 1.5;
    margin: 0; white-space: pre-wrap; word-wrap: break-word;
  }
  .mt-reply-empty {
    text-align: center; color: #6b7280;
    padding: 20px; font-size: 14px;
    background: #f9fafb; border-radius: 10px;
    max-width: 720px; margin: 0 auto;
  }

  .mt-locked, .mt-reply-cta {
    margin: 20px auto; max-width: 720px;
    padding: 14px 16px;
    border-radius: 10px; text-align: center; font-size: 14px;
  }
  .mt-locked { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
  .mt-reply-cta { background: #f9fafb; color: #4b5563; border: 1px solid #e5e7eb; }
  .mt-reply-cta a { color: var(--site-dark, #111); font-weight: 600; }

  .mt-reply-form {
    margin: 20px auto 0; max-width: 720px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .mt-reply-form textarea {
    width: 100%;
    border: 1px solid #d1d5db; border-radius: 8px;
    padding: 10px 12px; font-size: 14px;
    font-family: inherit; resize: vertical; outline: none;
  }
  .mt-reply-form textarea:focus {
    border-color: var(--site-primary, #f1ff32);
    box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25);
  }
  .mt-reply-alert {
    background: #fef2f2; color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 8px; padding: 8px 12px; font-size: 13px;
  }
  .mt-btn {
    align-self: flex-end;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 999px;
    text-decoration: none; font-weight: 600; font-size: 14px;
    border: 1px solid transparent; cursor: pointer;
  }
  .mt-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
  }
</style>
