<script lang="ts">
  import { roleLabel } from '$lib/user';

  export let data;

  $: profile = data.profile;
  $: summary = data.summary;
  $: activity = data.activity;

  /**
   * A profile with no username has no public page, and one with no bio or photo
   * looks abandoned next to a byline. Worth nagging about gently — five
   * accounts on this site are still missing all three.
   */
  $: missing = [
    { key: 'username', label: 'Username', filled: Boolean(profile.username) },
    { key: 'description', label: 'Bio singkat', filled: Boolean(profile.description) },
    { key: 'img', label: 'Foto profil', filled: Boolean(profile.img) },
  ].filter((f) => !f.filled);

  function formatNumber(n: number): string {
    return new Intl.NumberFormat('id-ID').format(n);
  }

  function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 30) return `${days} hari lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
    return `${Math.floor(days / 365)} tahun lalu`;
  }
</script>

<svelte:head>
  <title>Dashboard — Mokultur</title>
</svelte:head>

<header class="dash-head">
  <h1>Halo, {profile.name.split(' ')[0]}!</h1>
  <p>
    {#if profile.canWrite}
      Ini ringkasan tulisan dan aktivitas kamu di Mokultur.
    {:else}
      Ini ruang pribadi kamu di Mokultur.
    {/if}
  </p>
</header>

<div class="dash-cards">
  {#if profile.canWrite}
    <article class="dash-card dash-card--wide">
      <h2><i class="bi bi-file-text"></i> Artikel Saya</h2>

      {#if summary}
        <div class="dash-stats">
          <div class="dash-stat">
            <strong>{formatNumber(summary.total)}</strong>
            <span>Total artikel</span>
          </div>
          <div class="dash-stat">
            <strong>{formatNumber(summary.published)}</strong>
            <span>Tayang</span>
          </div>
          <div class="dash-stat">
            <strong>{formatNumber(summary.drafts)}</strong>
            <span>Draf</span>
          </div>
          <div class="dash-stat">
            <strong>{formatNumber(summary.views)}</strong>
            <span>Kali dibaca</span>
          </div>
        </div>

        <a class="dash-btn" href="/dashboard/artikel">
          Lihat semua artikel <i class="bi bi-arrow-right"></i>
        </a>
      {:else}
        <p class="dash-empty">Ringkasan artikel belum bisa dimuat. Coba muat ulang halaman.</p>
      {/if}
    </article>
  {/if}

  <article class="dash-card">
    <h2><i class="bi bi-person"></i> Profil</h2>

    <div class="dash-profile">
      <span class="dash-role">{roleLabel(profile.roleName)}</span>
      {#if profile.isVerified}
        <span class="dash-role dash-role--verified">
          <i class="bi bi-patch-check-fill"></i> Terverifikasi
        </span>
      {/if}
    </div>

    {#if missing.length}
      <p class="dash-note">Lengkapi profil kamu biar makin dikenal pembaca:</p>
      <ul class="dash-missing">
        {#each missing as field}
          <li><i class="bi bi-circle"></i> {field.label}</li>
        {/each}
      </ul>
    {:else}
      <p class="dash-note dash-note--ok">
        <i class="bi bi-check2-circle"></i> Profil kamu sudah lengkap.
      </p>
    {/if}

    <a class="dash-btn dash-btn--ghost" href="/dashboard/account">
      <i class="bi bi-gear"></i> Atur profil
    </a>
  </article>

  <article class="dash-card">
    <h2><i class="bi bi-lightning-charge"></i> Aktivitas Saya</h2>

    {#if activity.length}
      <ul class="dash-activity">
        {#each activity as item}
          <li>
            <i class="bi {item.type === 'comment' ? 'bi-chat-dots' : 'bi-heart'}"></i>
            <div>
              <a href="/article/{item.postId}/{item.postSlug}">{item.postTitle}</a>
              {#if item.excerpt}
                <p>"{item.excerpt}"</p>
              {:else}
                <p>Kamu menyukai artikel ini</p>
              {/if}
              <small>{timeAgo(item.createdAt)}</small>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <!-- Genuinely empty for nearly everyone right now, so this points
           somewhere useful instead of showing a blank list. -->
      <p class="dash-empty">
        Belum ada aktivitas. Mulai dengan berkomentar di artikel yang kamu suka.
      </p>
      <a class="dash-btn dash-btn--ghost" href="/index-article">
        <i class="bi bi-compass"></i> Jelajahi artikel
      </a>
    {/if}
  </article>

  <article class="dash-card">
    <h2><i class="bi bi-stars"></i> Status &amp; Pintasan</h2>

    {#if profile.canWrite}
      <p class="dash-note">
        Kamu punya akses menulis
        {#if profile.canPublishDirectly}
          dan artikel kamu langsung tayang setelah disimpan.
        {:else}
          — artikel kamu akan ditinjau admin sebelum tayang.
        {/if}
      </p>
    {:else}
      <p class="dash-note">
        Akun kamu saat ini sebagai pembaca. Mau menulis di Mokultur? Hubungi tim
        kami lewat halaman kontak untuk minta akses penulis.
      </p>
      <a class="dash-btn dash-btn--ghost" href="/contact">
        <i class="bi bi-envelope"></i> Hubungi tim
      </a>
    {/if}

    {#if profile.username}
      <a class="dash-btn dash-btn--ghost" href="/@{profile.username}">
        <i class="bi bi-person-badge"></i> Lihat profil publik
      </a>
    {/if}
  </article>
</div>

<style>
  .dash-head { margin-bottom: 18px; }
  .dash-head h1 { font-size: 24px; margin: 0; }
  .dash-head p { color: #6b7280; margin: 4px 0 0; font-size: 14px; }

  .dash-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    align-items: start;
  }

  .dash-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 20px;
  }

  .dash-card--wide { grid-column: 1 / -1; }

  .dash-card h2 {
    font-size: 17px;
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dash-card h2 i { color: #6b7280; }

  .dash-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .dash-stat {
    background: #f9fafb;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .dash-stat strong { font-size: 22px; line-height: 1.1; }
  .dash-stat span { font-size: 12px; color: #6b7280; }

  .dash-profile { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }

  .dash-role {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--site-dark, #0a0a0a);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
  }
  .dash-role--verified {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .dash-note { font-size: 13.5px; color: #4b5563; margin: 0 0 12px; line-height: 1.55; }
  .dash-note--ok { color: #166534; display: flex; align-items: center; gap: 6px; }

  .dash-missing { list-style: none; padding: 0; margin: 0 0 14px; }
  .dash-missing li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
    padding: 5px 0;
  }
  .dash-missing i { font-size: 8px; color: #d1d5db; }

  .dash-empty {
    font-size: 13.5px;
    color: #6b7280;
    line-height: 1.55;
    margin: 0 0 12px;
  }

  .dash-activity { list-style: none; padding: 0; margin: 0; }
  .dash-activity li {
    display: flex;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .dash-activity li:last-child { border-bottom: 0; }
  .dash-activity > li > i { color: #9ca3af; font-size: 14px; margin-top: 2px; }
  .dash-activity a {
    font-size: 13.5px;
    font-weight: 700;
    color: #111;
    text-decoration: none;
    display: block;
  }
  .dash-activity a:hover { text-decoration: underline; }
  .dash-activity p { font-size: 12.5px; color: #6b7280; margin: 2px 0 0; }
  .dash-activity small { font-size: 11.5px; color: #9ca3af; }

  .dash-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 700;
    text-decoration: none;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #0d0d0d);
  }

  .dash-btn--ghost {
    background: #f3f4f6;
    color: #111;
    margin-right: 6px;
    margin-top: 2px;
  }
  .dash-btn--ghost:hover { background: #e5e7eb; }

  @media (max-width: 860px) {
    .dash-cards { grid-template-columns: 1fr; }
  }

  @media (max-width: 540px) {
    .dash-stats { grid-template-columns: 1fr 1fr; }
  }
</style>
