<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page as pageStore } from '$app/stores';
  import { absoluteUrl, buildPageTitle } from '$lib/seo';
  import { animeSlug } from '$lib/anime';
  import { imgSrcset, imgUrl } from '$lib/img';
  import ShareSheet from '$components/common/ShareSheet.svelte';

  export let data: PageData;

  type Axis = 'mood' | 'pace' | 'world' | 'fame';

  const QUESTIONS: { axis: Axis; question: string; positive: string; negative: string }[] = [
    {
      axis: 'mood',
      question: 'Habis hari yang berat, kamu pilih tontonan yang…',
      negative: 'Ringan dan bikin ketawa',
      positive: 'Gelap dan bikin mikir',
    },
    {
      axis: 'pace',
      question: 'Tempo cerita yang paling nyaman buat kamu?',
      negative: 'Pelan, biar meresap',
      positive: 'Cepat, penuh aksi',
    },
    {
      axis: 'world',
      question: 'Dunia yang paling menarik?',
      negative: 'Dunia nyata, orang biasa',
      positive: 'Dunia lain, sihir, fantasi',
    },
    {
      axis: 'fame',
      question: 'Kalau soal judul…',
      negative: 'Suka yang belum banyak orang tahu',
      positive: 'Yang ramai dibicarakan dulu',
    },
  ];

  let answers: Record<Axis, number> = { mood: 0, pace: 0, world: 0, fame: 0 };
  let step = 0;
  let submitting = false;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl('/anime/selera');
  $: pageTitle = buildPageTitle('Know Your Taste of Anime', siteName);
  $: description =
    'Jawab 4 pertanyaan, dapat 6 rekomendasi anime yang cocok sama seleramu — bukan sekadar daftar yang lagi populer.';
  $: resultUrl = $pageStore.url.href;

  function choose(axis: Axis, value: number) {
    answers = { ...answers, [axis]: value };

    if (step < QUESTIONS.length - 1) {
      step += 1;
      return;
    }

    submit();
  }

  function submit() {
    submitting = true;
    const q = new URLSearchParams(
      Object.entries(answers).map(([k, v]) => [k, String(v)])
    );
    // Answers live in the URL so a result can be shared, bookmarked and
    // re-opened without any of it being stored server-side.
    goto(`/anime/selera?${q}`, { noScroll: false });
  }

  function restart() {
    answers = { mood: 0, pace: 0, world: 0, fame: 0 };
    step = 0;
    submitting = false;
    goto('/anime/selera');
  }

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <!-- The quiz itself is worth indexing; a result is personal and would only
       add near-duplicate pages. -->
  <meta name="robots" content={data.answered ? 'noindex, follow' : 'index, follow'} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
</svelte:head>

<section class="section-md container-xl taste">
  {#if !data.answered}
    <header class="taste__hero">
      <span class="badge badge-main mb-3">Kuis</span>
      <h1 class="taste__title">Know Your Taste of Anime</h1>
      <p class="taste__desc">
        Empat pertanyaan, enam rekomendasi. Bukan daftar yang lagi ramai — yang cocok sama seleramu.
      </p>
    </header>

    <div class="taste__card">
      <div class="taste__progress" aria-hidden="true">
        {#each QUESTIONS as _, i}
          <span class="taste__dot" class:is-done={i <= step}></span>
        {/each}
      </div>

      <p class="taste__step">Pertanyaan {step + 1} dari {QUESTIONS.length}</p>
      <h2 class="taste__question">{QUESTIONS[step].question}</h2>

      <div class="taste__options">
        <button type="button" class="taste__option" on:click={() => choose(QUESTIONS[step].axis, -1)}>
          {QUESTIONS[step].negative}
        </button>
        <button type="button" class="taste__option" on:click={() => choose(QUESTIONS[step].axis, 1)}>
          {QUESTIONS[step].positive}
        </button>
      </div>

      <button type="button" class="taste__skip" on:click={() => choose(QUESTIONS[step].axis, 0)}>
        Dua-duanya oke
      </button>

      {#if submitting}
        <p class="taste__loading">Mencocokkan…</p>
      {/if}
    </div>
  {:else if data.result}
    <header class="taste__hero taste__hero--result">
      <span class="badge badge-main mb-3">Selera kamu</span>
      <h1 class="taste__title">{data.result.profile.label}</h1>
      <p class="taste__desc">{data.result.profile.blurb}</p>

      <div class="d-flex flex-wrap gap-2 mt-4">
        <ShareSheet url={resultUrl} title={`Selera anime gue: ${data.result.profile.label}`} />
        <button type="button" class="theme-btn theme-btn--surface" on:click={restart}>
          <i class="bi bi-arrow-repeat me-2"></i>Ulangi kuis
        </button>
      </div>
    </header>

    <h2 class="taste__section-head">Yang cocok buat kamu</h2>
    <div class="taste__grid">
      {#each data.result.anime as anime (anime.malId)}
        <a class="taste__anime" href="/anime/{anime.malId}/{animeSlug(anime.title)}">
          <div class="taste__poster">
            <img
              src={imgUrl(anime.image, 320)}
              srcset={imgSrcset(anime.image, 200)}
              sizes="(max-width: 767px) 45vw, 200px"
              alt={anime.title}
              loading="lazy"
              on:error={imgFallback}
            />
            {#if anime.score}
              <span class="taste__score"><i class="bi bi-star-fill"></i> {anime.score}</span>
            {/if}
          </div>
          <h3 class="taste__anime-title">{anime.title}</h3>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .taste__hero {
    border-radius: 28px;
    padding: 2.25rem 2rem;
    color: #fff;
    margin-bottom: 1.75rem;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--site-accent-glow, #f1ff32) 75%, transparent),
        transparent 22%
      ),
      linear-gradient(135deg, #0a0a0a 0%, #111827 48%, #1f2937 100%);
    box-shadow: 0 24px 80px rgb(10 10 10 / 15%);
  }

  .taste__title {
    font-size: clamp(1.9rem, 3.5vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #fff;
    margin: 0 0 0.4rem;
  }

  .taste__desc {
    color: rgb(255 255 255 / 78%);
    max-width: 46rem;
    margin: 0;
  }

  .taste__card {
    max-width: 42rem;
    margin: 0 auto;
    padding: 2rem;
    border-radius: 20px;
    border: 1px solid var(--bs-border-color, #dee2e6);
    background: var(--bs-body-bg, #fff);
    box-shadow: 0 10px 32px rgb(0 0 0 / 6%);
  }

  .taste__progress {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 1.25rem;
  }

  .taste__dot {
    height: 4px;
    flex: 1;
    border-radius: 999px;
    background: var(--bs-border-color, #dee2e6);
    transition: background 0.2s ease;
  }

  .taste__dot.is-done {
    background: var(--site-primary, #f1ff32);
  }

  .taste__step {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--bs-secondary-color, #6c757d);
    margin: 0 0 0.35rem;
  }

  .taste__question {
    font-size: clamp(1.15rem, 2.4vw, 1.5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 1.5rem;
  }

  .taste__options {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .taste__option {
    padding: 1.1rem 1rem;
    border-radius: 14px;
    border: 1px solid var(--bs-border-color, #dee2e6);
    background: var(--bs-body-bg, #fff);
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1.35;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
  }

  .taste__option:hover {
    transform: translateY(-2px);
    border-color: var(--site-primary, #f1ff32);
    background: color-mix(in srgb, var(--site-primary, #f1ff32) 10%, transparent);
  }

  .taste__skip {
    display: block;
    margin: 1rem auto 0;
    padding: 0.4rem 0.8rem;
    border: 0;
    background: none;
    font-size: 0.85rem;
    color: var(--bs-secondary-color, #6c757d);
    text-decoration: underline;
    cursor: pointer;
  }

  .taste__loading {
    text-align: center;
    margin: 1rem 0 0;
    color: var(--bs-secondary-color, #6c757d);
  }

  .taste__section-head {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    padding-left: 0.75rem;
    border-left: 4px solid var(--site-primary, #f1ff32);
    margin: 0 0 1.25rem;
  }

  .taste__grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 1rem;
  }

  .taste__anime {
    text-decoration: none;
    color: inherit;
  }

  .taste__poster {
    position: relative;
    aspect-ratio: 2 / 3;
    border-radius: 10px;
    overflow: hidden;
    background: #14171c;
  }

  .taste__poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .taste__score {
    position: absolute;
    left: 0.4rem;
    bottom: 0.4rem;
    padding: 0.1rem 0.4rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 800;
    background: rgb(0 0 0 / 72%);
    color: var(--site-primary, #f1ff32);
  }

  .taste__anime-title {
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0.5rem 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 991.98px) {
    .taste__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 767.98px) {
    .taste__hero {
      border-radius: 20px;
      padding: 1.5rem;
    }

    .taste__card {
      padding: 1.25rem;
    }

    .taste__options {
      grid-template-columns: 1fr;
    }

    .taste__grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
    }
  }

  @media (max-width: 479.98px) {
    .taste__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
