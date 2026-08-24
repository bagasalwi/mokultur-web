<script lang="ts">
  export let data;

  $: posts = data.posts;
  $: totalPages = Math.max(1, Math.ceil(data.total / data.perPage));

  const filters = [
    { key: 'all', label: 'Semua' },
    { key: 'published', label: 'Tayang' },
    { key: 'draft', label: 'Draf' },
  ];

  function href(filter: string, page = 1): string {
    const q = new URLSearchParams();
    if (filter !== 'all') q.set('status', filter);
    if (page > 1) q.set('page', String(page));
    const s = q.toString();
    return s ? `/dashboard/artikel?${s}` : '/dashboard/artikel';
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatNumber(n: number): string {
    return new Intl.NumberFormat('id-ID').format(n);
  }
</script>

<svelte:head>
  <title>Artikel Saya — Mokultur</title>
</svelte:head>

<header class="art-head">
  <div>
    <h1>Artikel Saya</h1>
    <p>{formatNumber(data.total)} artikel atas nama kamu.</p>
  </div>
</header>

<div class="art-filters">
  {#each filters as f}
    <a href={href(f.key)} class="art-filter" class:art-filter--active={data.filter === f.key}>
      {f.label}
    </a>
  {/each}
</div>

{#if data.failed}
  <div class="art-panel">
    <p>Daftar artikel belum bisa dimuat. Coba muat ulang halaman.</p>
  </div>
{:else if posts.length === 0}
  <div class="art-panel">
    <p>
      {#if data.filter === 'draft'}
        Belum ada draf tersimpan.
      {:else if data.filter === 'published'}
        Belum ada artikel yang tayang.
      {:else}
        Kamu belum punya artikel.
      {/if}
    </p>
  </div>
{:else}
  <ul class="art-list">
    {#each posts as post}
      <li class="art-item">
        <img class="art-thumb" src={post.image} alt="" width="96" height="64" loading="lazy" />

        <div class="art-body">
          <a class="art-title" href="/article/{post.id}/{post.slug}">{post.title}</a>

          <div class="art-meta">
            <span class="art-status" class:art-status--live={post.isPublished}>
              {post.isPublished ? 'Tayang' : 'Draf'}
            </span>
            {#if post.categoryName}
              <span>{post.categoryName}</span>
            {/if}
            <span>{formatDate(post.publishDate)}</span>
            <span><i class="bi bi-eye"></i> {formatNumber(post.views)}</span>
          </div>
        </div>
      </li>
    {/each}
  </ul>

  {#if totalPages > 1}
    <nav class="art-pager">
      {#if data.page > 1}
        <a href={href(data.filter, data.page - 1)}><i class="bi bi-chevron-left"></i> Sebelumnya</a>
      {/if}
      <span>Halaman {data.page} dari {totalPages}</span>
      {#if data.page < totalPages}
        <a href={href(data.filter, data.page + 1)}>Berikutnya <i class="bi bi-chevron-right"></i></a>
      {/if}
    </nav>
  {/if}
{/if}

<style>
  .art-head { margin-bottom: 16px; }
  .art-head h1 { font-size: 24px; margin: 0; }
  .art-head p { color: #6b7280; margin: 4px 0 0; font-size: 14px; }

  .art-filters { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }

  .art-filter {
    padding: 6px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }
  .art-filter--active { background: var(--site-dark, #0a0a0a); color: #fff; }

  .art-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 32px 20px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }
  .art-panel p { margin: 0; }

  .art-list {
    list-style: none;
    padding: 0;
    margin: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    overflow: hidden;
  }

  .art-item {
    display: flex;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid #f3f4f6;
  }
  .art-item:last-child { border-bottom: 0; }

  .art-thumb {
    width: 96px;
    height: 64px;
    object-fit: cover;
    border-radius: 8px;
    background: #f3f4f6;
    flex-shrink: 0;
  }

  /* Without this the long title refuses to wrap and pushes the row wider than
     the viewport on mobile. */
  .art-body { min-width: 0; flex: 1; }

  .art-title {
    display: block;
    font-size: 14.5px;
    font-weight: 700;
    color: #111;
    text-decoration: none;
    line-height: 1.4;
  }
  .art-title:hover { text-decoration: underline; }

  .art-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
    font-size: 12px;
    color: #9ca3af;
  }

  .art-status {
    padding: 2px 8px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #6b7280;
    font-weight: 700;
  }
  .art-status--live { background: #f0fdf4; color: #166534; }

  .art-pager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
    font-size: 13px;
    color: #6b7280;
  }
  .art-pager a { color: #111; font-weight: 700; text-decoration: none; }
  .art-pager a:hover { text-decoration: underline; }

  @media (max-width: 540px) {
    .art-thumb { width: 72px; height: 52px; }
  }
</style>
