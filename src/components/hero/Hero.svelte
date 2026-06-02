<script lang="ts">
  import type { ArticleListItem } from '$lib/api';
  import HeroCinematic from './HeroCinematic.svelte';

  export let articles: ArticleListItem[] = [];
  export let type: string = 'cinematic';

  const TYPES = ['cinematic', 'split', 'ticker', 'masthead', 'editorial-grid', 'spotlight-stack'];
  $: variant = TYPES.includes(type) ? type : 'cinematic';

  $: main = articles[0] ?? null;
  $: rest = articles.slice(1);

  function timeAgo(d: string | null): string {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    return `${Math.floor(days / 30)} bulan lalu`;
  }
  const img = (a: ArticleListItem) => a.image ?? '/images/noimage.png';
  const href = (a: ArticleListItem) => `/article/${a.id}/${a.slug}`;
  function onErr(e: Event) { (e.target as HTMLImageElement).src = '/images/noimage.png'; }
</script>

{#if variant === 'cinematic'}
  <HeroCinematic {articles} />

{:else if variant === 'ticker'}
  <section class="home-collab-card anime-hero-full">
    <div class="container-fluid container-xl section-sm px-3 px-md-4">
      <div class="hero-ticker__grid">
        {#each articles.slice(0, 6) as a (a.id)}
          <a href={href(a)} class="hero-ticker__item text-decoration-none">
            <div class="hero-ticker__thumb"><img src={img(a)} alt={a.title} loading="lazy" on:error={onErr} /></div>
            <div class="hero-ticker__body">
              {#if a.category}<span class="badge badge-main hero-ticker__badge">{a.category.name}</span>{/if}
              <div class="hero-ticker__title">{a.title}</div>
              <span class="hero-ticker__meta">{timeAgo(a.publishDate)}</span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

{:else if variant === 'masthead'}
  <section class="home-collab-card anime-hero-full">
    <div class="container-fluid container-xl section-sm px-3 px-md-4">
      {#if main}
        <div class="hero-masthead">
          <a href={href(main)} class="hero-masthead__main text-decoration-none">
            {#if main.category}<span class="badge badge-main mb-3">{main.category.name}</span>{/if}
            <h2 class="hero-masthead__title">{main.title}</h2>
            {#if main.description}<p class="hero-masthead__description">{main.description}</p>{/if}
            <span class="hero-masthead__meta">{timeAgo(main.publishDate)}</span>
          </a>
          <div class="hero-masthead__media"><img src={img(main)} alt={main.title} loading="eager" fetchpriority="high" on:error={onErr} /></div>
          {#if rest.length}
            <div class="hero-masthead__rail">
              {#each rest.slice(0, 3) as a (a.id)}
                <a href={href(a)} class="hero-masthead__rail-item text-decoration-none">
                  <span>{a.category?.name ?? ''}</span>
                  <strong>{a.title}</strong>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </section>

{:else if variant === 'editorial-grid'}
  <section class="home-collab-card anime-hero-full">
    <div class="container-fluid container-xl section-sm px-3 px-md-4">
      <div class="hero-editorial-grid">
        {#if main}
          <a href={href(main)} class="hero-editorial-grid__lead text-decoration-none">
            <img src={img(main)} alt={main.title} loading="eager" fetchpriority="high" on:error={onErr} />
            <div>
              {#if main.category}<span class="badge badge-main mb-2">{main.category.name}</span>{/if}
              <h2>{main.title}</h2>
              {#if main.description}<p>{main.description}</p>{/if}
            </div>
          </a>
        {/if}
        {#each rest.slice(0, 4) as a (a.id)}
          <a href={href(a)} class="hero-editorial-grid__card text-decoration-none">
            <img src={img(a)} alt={a.title} loading="lazy" on:error={onErr} />
            <div>
              {#if a.category}<span class="badge badge-main mb-2">{a.category.name}</span>{/if}
              <strong>{a.title}</strong>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

{:else if variant === 'spotlight-stack'}
  <section class="home-collab-card anime-hero-full">
    <div class="container-fluid container-xl section-sm px-3 px-md-4">
      <div class="hero-spotlight-stack">
        {#if main}
          <a href={href(main)} class="hero-spotlight-stack__feature text-decoration-none">
            <img src={img(main)} alt={main.title} loading="eager" fetchpriority="high" on:error={onErr} />
            <div class="hero-spotlight-stack__feature-copy">
              {#if main.category}<span class="badge badge-main mb-2">{main.category.name}</span>{/if}
              <h2>{main.title}</h2>
              {#if main.description}<p>{main.description}</p>{/if}
            </div>
          </a>
        {/if}
        <div class="hero-spotlight-stack__list">
          {#each rest.slice(0, 5) as a, i (a.id)}
            <a href={href(a)} class="hero-spotlight-stack__item text-decoration-none">
              <span>{String(i + 1).padStart(2, '0')}</span>
              <strong>{a.title}</strong>
            </a>
          {/each}
        </div>
      </div>
    </div>
  </section>

{:else}
  <!-- split: reuse cinematic (same headline + 4-up grid) -->
  <HeroCinematic {articles} />
{/if}
