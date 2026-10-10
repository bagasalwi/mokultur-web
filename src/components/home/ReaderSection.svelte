<script lang="ts">
  import { imgSrcset, imgUrl } from '$lib/img';
  import { timeAgo, imgFallback } from '$lib/format';
  import type { ArticleListItem } from '$lib/api';

  type PickArticle = ArticleListItem & { reason?: string };

  /** Already de-duplicated against the hero and the Terbaru list by the page. */
  export let articles: PickArticle[] = [];
  export let interests: string[] = [];
  export let loggedIn = false;
  export let siteName = 'Mokultur';

  $: picks = articles.slice(0, 4);
  $: sub = interests.length
    ? `Dipilih sesuai minatmu: ${interests.join(', ')}.`
    : 'Bacaan pilihan untukmu. Pilih minat agar rekomendasinya makin pas.';
  const href = (article: ArticleListItem) => `/article/${article.id}/${article.slug}`;
</script>

{#if picks.length}
  <section class="home-pick home-reader" aria-labelledby="home-pick-heading">
    <div class="container-xl">
      <div class="home-pick__panel">
        <header class="home-pick__head">
          <div class="home-pick__intro">
            <h2 id="home-pick-heading" class="home-pick__title">{siteName}'s <mark>Pick</mark></h2>
            <p class="home-pick__sub">{sub}</p>
          </div>
          <a href={loggedIn ? '/dashboard' : '/auth/login?redirect=/dashboard'} class="home-pick__cta theme-btn theme-btn--primary theme-btn--sm">
            {loggedIn && interests.length ? 'Lihat semua pilihan' : 'Pilih minat'}
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </a>
        </header>

        <ul class="home-pick__grid">
          {#each picks as article (article.id)}
            <li>
              <a class="home-pick__card" href={href(article)}>
                <span class="home-pick__media">
                  <img src={imgUrl(article.image, 480) ?? '/images/noimage.png'} srcset={imgSrcset(article.image, 300)} sizes="(max-width: 767px) 46vw, 300px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
                </span>
                {#if article.category}<span class="home-pick__cat">{article.category.name}</span>{/if}
                <h3 class="home-pick__card-title">{article.title}</h3>
                <span class="home-pick__meta">
                  {#if article.reason}<i class="bi bi-stars" aria-hidden="true"></i>{article.reason}{:else}{timeAgo(article.publishDate)}{/if}
                </span>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>
{/if}

<style>
  .home-pick { padding: 1.5rem 0; }

  /* The house dark panel: accent glow top-right over the site's dark ramp,
     the same recipe as .home-collab-card and the archive header. */
  .home-pick__panel {
    padding: 1.5rem;
    border-radius: 20px;
    color: #fff;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 70%, transparent), transparent 30%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #101827 52%, #1f2937 100%);
    box-shadow: 0 12px 32px rgba(10, 10, 10, 0.14);
  }

  .home-pick__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem 1.5rem;
    margin-bottom: 1.25rem;
  }
  .home-pick__intro { min-width: 0; flex: 1 1 320px; }
  .home-pick__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: #fff;
  }
  .home-pick__title mark {
    padding: 0 0.3em;
    border-radius: 6px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
  }
  .home-pick__sub { margin: 0.375rem 0 0; font-size: 0.875rem; color: rgba(255, 255, 255, 0.72); }
  .home-pick__cta { min-height: 40px; box-shadow: none; }

  .home-pick__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .home-pick__card { display: flex; flex-direction: column; gap: 0.4rem; height: 100%; color: inherit; text-decoration: none; }
  .home-pick__card:focus-visible { outline: 3px solid #fff; outline-offset: 4px; border-radius: 10px; }
  .home-pick__media {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    margin-bottom: 0.25rem;
  }
  .home-pick__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .home-pick__cat {
    align-self: flex-start;
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--site-primary, #f1ff32);
  }
  .home-pick__card-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.35;
    color: #fff;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .home-pick__meta { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: auto; font-size: 0.75rem; color: rgba(255, 255, 255, 0.62); }

  @media (hover: hover) {
    .home-pick__card:hover img { transform: scale(1.04); }
    .home-pick__card:hover .home-pick__card-title { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  }
  @media (prefers-reduced-motion: reduce) { .home-pick img { transition: none; } }

  @media (max-width: 991px) {
    .home-pick__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 575px) {
    .home-pick { padding: 1rem 0; }
    .home-pick__panel { padding: 1rem; border-radius: 16px; }
    .home-pick__title { font-size: 1.25rem; }
    .home-pick__cta { width: 100%; justify-content: center; }
    .home-pick__grid { gap: 1rem 0.75rem; }
    .home-pick__card-title { font-size: 0.875rem; }
  }
</style>
