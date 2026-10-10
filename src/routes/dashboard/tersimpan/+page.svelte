<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { timeAgo } from '$lib/format';
  import ReaderItem from '$components/reader/ReaderItem.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  let reloading = false;
  async function reload() { reloading = true; try { await invalidateAll(); } finally { reloading = false; } }
  $: page = data.collection.meta.page;
  $: total = data.collection.meta.total;
  $: lastPage = Math.max(1, Math.ceil(total / data.collection.meta.perPage));
  const href = (n: number) => `/dashboard/tersimpan?page=${n}`;
</script>

<svelte:head><title>Tersimpan | {data.settings?.site_name ?? 'Mokultur'}</title></svelte:head>

<section aria-labelledby="me-saved-heading">
  <div class="me-head">
    <div>
      <h2 id="me-saved-heading">Tersimpan</h2>
      <p>{total ? `${total} artikel yang kamu simpan untuk dibaca nanti.` : 'Artikel yang kamu simpan untuk dibaca nanti.'}</p>
    </div>
  </div>

  {#if data.readerError}
    <div class="me-empty" role="alert">
      <i class="bi bi-wifi-off" aria-hidden="true"></i>
      <h3>Belum dapat dimuat</h3>
      <p>{data.readerError}</p>
      <button class="theme-btn theme-btn--primary theme-btn--sm" on:click={reload} disabled={reloading}>{reloading ? 'Memuat…' : 'Coba lagi'}</button>
    </div>
  {:else if data.collection.data.length}
    <div class="me-list" aria-busy={reloading}>
      {#each data.collection.data as article (article.id)}
        <ReaderItem {article} loggedIn collection note={article.reader.bookmarkedAt ? `Disimpan ${timeAgo(article.reader.bookmarkedAt).toLowerCase()}` : null} on:updated={reload} />
      {/each}
    </div>
    {#if lastPage > 1}
      <nav class="me-pager" aria-label="Halaman artikel tersimpan">
        {#if page > 1}<a class="theme-btn theme-btn--see-all theme-btn--sm" href={href(page - 1)}><i class="bi bi-arrow-left" aria-hidden="true"></i> Sebelumnya</a>{/if}
        <span>Halaman {page} dari {lastPage}</span>
        {#if page < lastPage}<a class="theme-btn theme-btn--see-all theme-btn--sm" href={href(page + 1)}>Berikutnya <i class="bi bi-arrow-right" aria-hidden="true"></i></a>{/if}
      </nav>
    {/if}
  {:else}
    <div class="me-empty">
      <i class="bi bi-bookmark-heart" aria-hidden="true"></i>
      <h3>{page > 1 ? 'Halaman ini kosong' : 'Belum ada artikel tersimpan'}</h3>
      <p>Tekan <strong>Simpan</strong> di halaman artikel. Semua artikel pilihanmu akan terkumpul di sini.</p>
      {#if page > 1}<a class="theme-btn theme-btn--see-all theme-btn--sm" href={href(1)}>Ke halaman pertama</a>
      {:else}<a class="theme-btn theme-btn--primary theme-btn--sm" href="/index-article">Jelajahi artikel</a>{/if}
    </div>
  {/if}
</section>
