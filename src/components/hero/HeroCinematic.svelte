<script lang="ts">
  import type { ArticleListItem } from '$lib/api';

  export let articles: ArticleListItem[] = [];

  $: main = articles[0] ?? null;
  $: secondaries = articles.slice(1, 5);

  function timeAgo(d: string | null): string {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    return `${Math.floor(days / 30)} bulan lalu`;
  }

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }
</script>

<section class="home-collab-card anime-hero-full">
  <div class="container-fluid container-xl section-sm px-3 px-md-4">

    {#if main}
      <!-- Main headline -->
      <a href="/article/{main.id}/{main.slug}" class="hero-cinematic__main text-decoration-none">
        <div
          class="hero-cinematic__bg"
          style="background-image: url({main.image ?? '/images/noimage.png'})"
        >
          <div class="hero-cinematic__overlay">
            <div class="hero-cinematic__content">
              {#if main.category}
                <span class="badge badge-main mb-2">{main.category.name}</span>
              {/if}
              <h2 class="hero-cinematic__title">{main.title}</h2>
              <span class="hero-cinematic__meta">
                <i class="bi bi-clock me-1"></i>{timeAgo(main.publishDate)}
              </span>
            </div>
          </div>
        </div>
      </a>
    {/if}

    <!-- Secondary articles -->
    {#if secondaries.length > 0}
      <div class="row g-2 mt-2">
        {#each secondaries as article}
          <div class="col-6 col-md-3">
            <a href="/article/{article.id}/{article.slug}" class="hero-cinematic__side text-decoration-none">
              <div
                class="hero-cinematic__side-bg"
                style="background-image: url({article.image ?? '/images/noimage.png'})"
              >
                <div class="hero-cinematic__side-overlay">
                  {#if article.category}
                    <span class="badge badge-main hero-cinematic__badge">{article.category.name}</span>
                  {/if}
                  <div class="hero-cinematic__side-title">{article.title}</div>
                </div>
              </div>
            </a>
          </div>
        {/each}
      </div>
    {/if}

  </div>
</section>
