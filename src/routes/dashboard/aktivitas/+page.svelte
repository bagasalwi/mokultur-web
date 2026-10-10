<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { timeAgo } from '$lib/format';
  import type { PageData } from './$types';

  export let data: PageData;
  let reloading = false;
  async function reload() { reloading = true; try { await invalidateAll(); } finally { reloading = false; } }
</script>

<svelte:head><title>Aktivitas | {data.settings?.site_name ?? 'Mokultur'}</title></svelte:head>

<section aria-labelledby="me-activity-heading">
  <div class="me-head">
    <div>
      <h2 id="me-activity-heading">Aktivitas</h2>
      <p>Komentar dan artikel yang kamu sukai, terbaru di atas.</p>
    </div>
  </div>

  {#if data.activityError}
    <div class="me-empty" role="alert">
      <i class="bi bi-wifi-off" aria-hidden="true"></i>
      <h3>Belum dapat dimuat</h3>
      <p>{data.activityError}</p>
      <button class="theme-btn theme-btn--primary theme-btn--sm" on:click={reload} disabled={reloading}>{reloading ? 'Memuat…' : 'Coba lagi'}</button>
    </div>
  {:else if data.activity.length}
    <ol class="activity">
      {#each data.activity as item (`${item.type}-${item.id}`)}
        <li class="activity__item">
          <span class="activity__icon activity__icon--{item.type}" aria-hidden="true">
            <i class="bi {item.type === 'comment' ? 'bi-chat-dots-fill' : 'bi-heart-fill'}"></i>
          </span>
          <div class="activity__body">
            <p class="activity__what">
              {item.type === 'comment' ? 'Kamu berkomentar di' : 'Kamu menyukai'}
              <a href="/article/{item.postId}/{item.postSlug}{item.type === 'comment' ? '#komentar' : ''}">{item.postTitle ?? 'artikel'}</a>
            </p>
            {#if item.excerpt}<blockquote class="activity__quote">{item.excerpt}</blockquote>{/if}
            <time datetime={item.createdAt ?? ''}>{timeAgo(item.createdAt)}</time>
          </div>
        </li>
      {/each}
    </ol>
  {:else}
    <div class="me-empty">
      <i class="bi bi-lightning-charge" aria-hidden="true"></i>
      <h3>Belum ada aktivitas</h3>
      <p>Mulai dengan berkomentar atau menyukai artikel yang kamu baca.</p>
      <a class="theme-btn theme-btn--primary theme-btn--sm" href="/dashboard">Buka feed Untuk Kamu</a>
    </div>
  {/if}
</section>

<style>
  .activity { list-style: none; margin: 0; padding: 0; max-width: 760px; }
  .activity__item { display: flex; gap: 0.9rem; padding: 1rem 0; border-bottom: 1px solid #ececec; }
  .activity__item:first-child { padding-top: 0; }
  .activity__icon {
    display: grid;
    place-items: center;
    flex: 0 0 30px;
    height: 30px;
    border-radius: 50%;
    font-size: 0.9rem;
  }
  .activity__icon--comment { background: var(--site-dark, #111); color: var(--site-primary, #f1ff32); }
  .activity__icon--like { background: #fde8e8; color: #dc2626; }
  .activity__body { min-width: 0; }
  .activity__what { margin: 0; font-size: 0.8125rem; color: #4b5563; }
  .activity__what a { color: #1a1a1a; font-weight: 700; text-decoration: none; }
  .activity__what a:hover { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .activity__quote {
    margin: 0.5rem 0 0;
    padding: 0.6rem 0.85rem;
    border-radius: 0 12px 12px 12px;
    background: #f6f7f9;
    color: #374151;
    font-size: 0.8125rem;
    line-height: 1.5;
  }
  .activity time { display: block; margin-top: 0.3rem; font-size: 0.6875rem; color: #6b7280; }
</style>
