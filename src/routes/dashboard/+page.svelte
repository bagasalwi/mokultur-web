<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { imgUrl } from '$lib/img';
  import { timeAgo } from '$lib/format';
  import { articleHref, readerRequest, type ReaderArticle, type ReaderFeed } from '$lib/reader';
  import ReaderItem from '$components/reader/ReaderItem.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let feed: ReaderFeed;
  $: feed = data.feed;
  $: [lead, ...rest] = feed.data;
  $: profile = data.profile;
  $: missing = [
    !profile.username && 'username',
    !profile.description && 'bio singkat',
    !profile.img && 'foto profil',
  ].filter(Boolean) as string[];

  let loading = false;
  let error = '';

  async function more() {
    if (loading) return;
    loading = true;
    error = '';
    const start = feed;
    try {
      const next = await readerRequest<ReaderFeed>(`feed?page=${feed.meta.page + 1}&asOf=${encodeURIComponent(feed.meta.asOf)}`);
      if (feed !== start) return;
      const seen = new Set(feed.data.map((a) => a.id));
      feed = { ...next, data: [...feed.data, ...next.data.filter((a) => !seen.has(a.id))] };
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Artikel berikutnya belum dapat dimuat.';
    } finally {
      loading = false;
    }
  }

  async function reload() {
    loading = true;
    try { await invalidateAll(); } finally { loading = false; }
  }

  const thumb = (a: ReaderArticle) => imgUrl(a.image, 320) ?? a.image;
</script>

<svelte:head><title>Untuk Kamu | {data.settings?.site_name ?? 'Mokultur'}</title></svelte:head>

<div class="me-grid">
  <section aria-labelledby="me-feed-heading">
    <div class="me-head">
      <div>
        <h2 id="me-feed-heading">Untuk Kamu</h2>
        <p>Disusun dari minat dan bacaanmu, dengan sedikit topik baru untuk ditemukan.</p>
      </div>
    </div>

    {#if data.feedError}
      <div class="me-empty" role="alert">
        <i class="bi bi-wifi-off" aria-hidden="true"></i>
        <h3>Feed belum dapat dimuat</h3>
        <p>{data.feedError}</p>
        <button class="theme-btn theme-btn--primary theme-btn--sm" on:click={reload} disabled={loading}>Coba lagi</button>
      </div>
    {:else if lead}
      <div class="me-list" aria-busy={loading}>
        <ReaderItem article={lead} loggedIn lead />
        {#each rest as article (article.id)}<ReaderItem {article} loggedIn />{/each}
      </div>
      {#if error}<p class="reader-error" role="alert">{error}</p>{/if}
      {#if feed.meta.hasMore}
        <div class="me-pager">
          <button class="theme-btn theme-btn--see-all theme-btn--solid" on:click={more} disabled={loading}>
            {loading ? 'Memuat…' : 'Bacaan berikutnya'} <i class="bi bi-arrow-down" aria-hidden="true"></i>
          </button>
        </div>
      {/if}
    {:else}
      <div class="me-empty">
        <i class="bi bi-stars" aria-hidden="true"></i>
        <h3>Belum ada bacaan</h3>
        <p>Coba lagi nanti, atau lihat artikel terbaru dulu.</p>
        <a class="theme-btn theme-btn--primary theme-btn--sm" href="/index-article">Lihat artikel terbaru</a>
      </div>
    {/if}
  </section>

  <aside class="me-aside" aria-label="Pintasan bacaan">
    <section class="me-card">
      <h3><i class="bi bi-clock-history" aria-hidden="true"></i> Lanjutkan membaca</h3>
      {#if data.recentlyRead.length}
        <ul class="me-mini">
          {#each data.recentlyRead as article (article.id)}
            <li><a href={articleHref(article)}>
              {#if article.image}<img src={thumb(article)} alt="" loading="lazy" />{:else}<i class="me-mini__ph"></i>{/if}
              <span><strong>{article.title}</strong><small>Dibaca {timeAgo(article.reader.lastReadAt).toLowerCase()}</small></span>
            </a></li>
          {/each}
        </ul>
        <a class="me-card__more" href="/dashboard/riwayat">Lihat riwayat <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
      {:else}
        <div class="me-empty me-empty--small"><p>Artikel yang kamu buka akan muncul di sini, jadi mudah dilanjutkan.</p></div>
      {/if}
    </section>

    <section class="me-card">
      <h3><i class="bi bi-bookmark" aria-hidden="true"></i> Baru disimpan</h3>
      {#if data.recentlySaved.length}
        <ul class="me-mini">
          {#each data.recentlySaved as article (article.id)}
            <li><a href={articleHref(article)}>
              {#if article.image}<img src={thumb(article)} alt="" loading="lazy" />{:else}<i class="me-mini__ph"></i>{/if}
              <span><strong>{article.title}</strong><small>Disimpan {timeAgo(article.reader.bookmarkedAt).toLowerCase()}</small></span>
            </a></li>
          {/each}
        </ul>
        <a class="me-card__more" href="/dashboard/tersimpan">Semua tersimpan{data.savedTotal ? ` (${data.savedTotal})` : ''} <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
      {:else}
        <div class="me-empty me-empty--small"><p>Tekan <strong>Simpan</strong> di halaman artikel untuk membacanya nanti.</p></div>
      {/if}
    </section>

    {#if missing.length}
      <section class="me-card me-card--dark">
        <h3><i class="bi bi-person-badge" aria-hidden="true"></i> Lengkapi profilmu</h3>
        <p class="mb-3">Belum ada {missing.join(', ')}. Profil yang lengkap tampil lebih baik di komentar dan profil publikmu.</p>
        <a class="theme-btn theme-btn--primary theme-btn--sm" href="/dashboard/account">Atur profil <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
      </section>
    {/if}
  </aside>
</div>
