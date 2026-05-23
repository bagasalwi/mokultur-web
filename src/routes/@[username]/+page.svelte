<script lang="ts">
  import type { PageData } from './$types';
  import type { ArticleListItem } from '$lib/api';
  import ArticleCard from '$components/articles/ArticleCard.svelte';
  import Pagination from '$components/common/Pagination.svelte';

  export let data: PageData;

  $: ({ profile, username, page } = data);
  $: ({ user, stats, achievements, articles } = profile);
  $: siteName = data.settings?.site_name ?? 'Mokultur';

  const ACHIEVEMENTS: Record<string, { icon: string; title: string; desc: string }> = {
    '5_articles':  { icon: 'bi-pencil',           title: 'Penulis Aktif',     desc: 'Sudah menerbitkan 5 artikel' },
    '15_articles': { icon: 'bi-pencil-fill',       title: 'Penulis Produktif', desc: 'Sudah menerbitkan 15 artikel' },
    '1k_views':    { icon: 'bi-eye',               title: 'Disukai Pembaca',   desc: 'Lebih dari 1.000 total views' },
    '100_likes':   { icon: 'bi-heart',             title: 'Disukai Komunitas', desc: 'Lebih dari 100 likes artikel' },
    'admin':       { icon: 'bi-shield-fill-check', title: 'Admin',             desc: 'Tim inti ' + siteName },
    '1_year':      { icon: 'bi-calendar-check',    title: 'Warga Lama',        desc: 'Bergabung lebih dari 1 tahun' },
  };

  function memberSince(d: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  function timeAgo(d: string | null): string {
    if (!d) return 'Belum ada';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmt(n: number): string {
    return n.toLocaleString('id-ID');
  }

  function buildUrl(p: number): string {
    return `/@${username}?page=${p}`;
  }

  $: latestArticle = articles.data[0]?.publishDate ?? null;
  $: roleLabel = user.role === 'admin' ? 'Admin' : siteName;
  $: earnedAchievements = achievements.map((k) => ACHIEVEMENTS[k]).filter(Boolean);
  $: hasSocial = !!(user.instagram || user.facebook);

  function asArticleItem(a: typeof articles.data[0]): ArticleListItem {
    return { ...a, category: null, author: null };
  }
</script>

<svelte:head>
  <title>@{username} - {siteName}</title>
  <meta name="description" content={user.description ?? `Lihat profil, artikel, dan pencapaian dari ${user.name} di ${siteName}.`} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="/@{username}" />
</svelte:head>

<section class="section-top container-xl creator-profile-page">
  <nav aria-label="breadcrumb" class="mb-3">
    <ol class="breadcrumb small mb-0">
      <li class="breadcrumb-item"><a href="/" class="text-muted text-decoration-none">Home</a></li>
      <li class="breadcrumb-item active text-muted" aria-current="page">@{username}</li>
    </ol>
  </nav>

  <!-- Hero -->
  <div class="creator-profile-hero card border-0 overflow-hidden mb-4">
    <div class="creator-profile-hero__glow"></div>
    <div class="card-body p-4 p-lg-5 position-relative">
      <div class="row g-4 align-items-center">
        <div class="col-12 col-lg-8">
          <div class="d-flex flex-column flex-sm-row align-items-sm-center gap-4">
            <div class="creator-profile-avatar">
              {#if user.img}
                <img src={user.img} alt={user.name} />
              {:else}
                <div class="creator-profile-avatar-placeholder">{user.name[0]?.toUpperCase()}</div>
              {/if}
            </div>
            <div class="creator-profile-copy">
              <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span class="badge bg-dark text-white">{roleLabel}</span>
              </div>
              <h1 class="creator-profile-title mb-1">{user.name}</h1>
              <p class="creator-profile-handle mb-3">@{username}</p>
              <p class="creator-profile-description mb-0">
                {user.description ?? `${user.name} aktif berbagi tulisan dan warna komunitas di ${siteName}.`}
              </p>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-4">
          <div class="creator-profile-highlight">
            <span class="creator-profile-highlight__label badge badge-main">Creator Snapshot</span>
            <div class="creator-profile-highlight__value">{fmt(stats.totalViews)}</div>
            <p class="creator-profile-highlight__meta mb-0">Total view dari seluruh artikel yang sudah dipublikasikan.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Stat Bar -->
  <div class="creator-profile-statbar mb-4">
    <div class="creator-profile-statbar__item">
      <span class="creator-profile-statbar__label">Artikel</span>
      <strong>{fmt(stats.totalArticles)}</strong>
    </div>
    <div class="creator-profile-statbar__item">
      <span class="creator-profile-statbar__label">Views</span>
      <strong>{fmt(stats.totalViews)}</strong>
    </div>
    <div class="creator-profile-statbar__item">
      <span class="creator-profile-statbar__label">Likes</span>
      <strong>{fmt(stats.totalLikes)}</strong>
    </div>
  </div>

  <div class="row g-4 align-items-start">
    <!-- Main: Editorial Feed -->
    <div class="col-12 col-lg-8">
      <section class="creator-profile-section card border-0">
        <div class="card-body p-4">
          <div class="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-2 mb-4">
            <div>
              <p class="creator-profile-section__eyebrow badge badge-main mb-1">Editorial Feed</p>
              <h2 class="creator-profile-section__title mb-0">Artikel dari {user.name}</h2>
            </div>
          </div>

          {#if articles.data.length > 0}
            <div class="d-flex flex-column gap-3">
              {#each articles.data as article}
                <ArticleCard article={asArticleItem(article)} variant="horizontal" />
              {/each}
            </div>
            <div class="d-flex justify-content-center mt-4">
              <Pagination currentPage={page} totalPages={articles.meta.totalPages} {buildUrl} />
            </div>
          {:else}
            <div class="creator-profile-empty text-center">
              <div class="creator-profile-empty__icon">
                <i class="bi bi-journal-text"></i>
              </div>
              <h3 class="h5 mb-2">Belum ada artikel terbit</h3>
              <p class="text-muted mb-0">{user.name} belum punya artikel yang dipublikasikan untuk ditampilkan di halaman ini.</p>
            </div>
          {/if}
        </div>
      </section>
    </div>

    <!-- Sidebar -->
    <div class="col-12 col-lg-4">
      <div class="creator-sidebar d-grid gap-3">

        <!-- Creator Snapshot -->
        <div class="creator-sidebar-card card border-0">
          <div class="card-body p-4">
            <p class="creator-profile-section__eyebrow badge badge-main mb-2">Creator Snapshot</p>
            <h3 class="h5 mb-3">Tentang {user.name}</h3>
            <div class="creator-sidebar-meta">
              <div class="creator-sidebar-meta__item">
                <span>Bergabung</span>
                <strong>{memberSince(user.createdAt)}</strong>
              </div>
              <div class="creator-sidebar-meta__item">
                <span>Artikel Terbaru</span>
                <strong>{timeAgo(latestArticle)}</strong>
              </div>
            </div>
            {#if hasSocial}
              <div class="creator-sidebar-socials mt-4">
                {#if user.instagram}
                  <a href="https://www.instagram.com/{user.instagram}" target="_blank" rel="noopener"
                    class="btn btn-dark btn-sm d-inline-flex align-items-center gap-2">
                    <i class="bi bi-instagram"></i> Instagram
                  </a>
                {/if}
                {#if user.facebook}
                  <a href="https://www.facebook.com/{user.facebook}" target="_blank" rel="noopener"
                    class="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-2">
                    <i class="bi bi-facebook"></i> Facebook
                  </a>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Achievement Board -->
        <div class="creator-sidebar-card card border-0">
          <div class="card-body p-4">
            <p class="creator-profile-section__eyebrow badge badge-main mb-2">Achievement Board</p>
            <h3 class="h5 mb-3">Pencapaian</h3>
            {#if earnedAchievements.length > 0}
              <div class="creator-achievements">
                {#each earnedAchievements as a}
                  <div class="creator-achievement">
                    <div class="creator-achievement__icon">
                      <i class="bi {a.icon}"></i>
                    </div>
                    <div>
                      <strong class="d-block">{a.title}</strong>
                      <span>{a.desc}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="creator-achievement-placeholder">
                <i class="bi bi-stars"></i>
                <p class="mb-0">Profil ini sedang membangun jejak dan pencapaiannya di {siteName}.</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Momentum -->
        <div class="creator-sidebar-card creator-sidebar-card--accent card border-0">
          <div class="card-body p-4">
            <p class="creator-profile-section__eyebrow badge badge-main text-dark mb-2">Momentum</p>
            <h3 class="h5 mb-2">Ritme Kreator</h3>
            <p class="mb-3">Jejak {user.name} dibentuk oleh artikel dan interaksi pembaca yang terus tumbuh.</p>
            <div class="creator-pulse">
              <div>
                <span>Publikasi</span>
                <strong>{fmt(stats.totalArticles)} artikel</strong>
              </div>
              <div>
                <span>Respon Komunitas</span>
                <strong>{fmt(stats.totalLikes)} likes</strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>
