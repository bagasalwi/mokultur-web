<script lang="ts">
  import type { PageData } from './$types';
  import { onDestroy, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { navigating, page as pageStore } from '$app/stores';
  import { absoluteUrl, buildPageTitle } from '$lib/seo';
  import { animeSlug } from '$lib/anime';
  import { imgSrcset, imgUrl } from '$lib/img';
  import ShareSheet from '$components/common/ShareSheet.svelte';

  export let data: PageData;

  type Axis =
    | 'mood'
    | 'pace'
    | 'world'
    | 'heart'
    | 'stakes'
    | 'humor'
    | 'fame'
    | 'length'
    | 'era';

  type Question = { axis: Axis; question: string; positive: string; negative: string };

  /**
   * Several phrasings per axis, and only four axes are asked each run.
   *
   * Asking all nine every time made the quiz long and identical on a second
   * play, so nobody played twice. Drawing four of nine keeps it under a minute
   * and gives 126 different question sets; the phrasings mean even a repeat of
   * the same axis does not read the same way. Axes left unasked stay neutral,
   * which the matcher already handles.
   */
  const QUESTION_POOL: Question[] = [
    // mood
    { axis: 'mood', question: 'Habis hari yang berat, kamu pilih tontonan yang…', negative: 'Ringan dan bikin ketawa', positive: 'Gelap dan bikin mikir' },
    { axis: 'mood', question: 'Ending seperti apa yang kamu tahan?', negative: 'Yang bikin hati anget', positive: 'Yang bikin nyesek berhari-hari' },
    { axis: 'mood', question: 'Cerita paling berkesan buat kamu biasanya…', negative: 'Menghibur dan bikin senyum', positive: 'Berat dan menohok' },

    // pace
    { axis: 'pace', question: 'Tempo cerita yang paling nyaman buat kamu?', negative: 'Pelan, biar meresap', positive: 'Cepat, penuh aksi' },
    { axis: 'pace', question: 'Episode pertama yang bikin kamu lanjut itu…', negative: 'Yang tenang dan bikin penasaran pelan-pelan', positive: 'Yang langsung tancap gas' },

    // world
    { axis: 'world', question: 'Dunia yang paling menarik?', negative: 'Dunia nyata, orang biasa', positive: 'Dunia lain, sihir, fantasi' },
    { axis: 'world', question: 'Kamu lebih gampang nyambung sama cerita yang…', negative: 'Bisa kejadian di sekitar kamu', positive: 'Jauh dari kenyataan' },

    // heart
    { axis: 'heart', question: 'Seberapa penting urusan perasaan tokohnya?', negative: 'Nggak usah drama-drama', positive: 'Justru itu yang bikin nempel' },
    { axis: 'heart', question: 'Kalau ada subplot romansa, kamu…', negative: 'Skip, fokus ceritanya aja', positive: 'Malah paling ditunggu' },

    // stakes
    { axis: 'stakes', question: 'Taruhan cerita yang bikin kamu betah?', negative: 'Urusan sehari-hari yang dekat', positive: 'Nasib dunia dipertaruhkan' },
    { axis: 'stakes', question: 'Kamu lebih suka konflik yang…', negative: 'Kecil tapi terasa personal', positive: 'Besar dan berskala luas' },

    // humor
    { axis: 'humor', question: 'Porsi komedi yang pas buat kamu?', negative: 'Serius aja, nggak perlu becanda', positive: 'Wajib ada yang bikin ketawa' },
    { axis: 'humor', question: 'Tokoh favorit kamu biasanya…', negative: 'Yang serius dan penuh beban', positive: 'Yang celetukannya bikin ngakak' },

    // fame
    { axis: 'fame', question: 'Kalau soal judul…', negative: 'Suka yang belum banyak orang tahu', positive: 'Yang ramai dibicarakan dulu' },
    { axis: 'fame', question: 'Rekomendasi paling berguna buat kamu itu…', negative: 'Judul yang jarang disebut orang', positive: 'Judul yang semua orang sudah nonton' },

    // length
    { axis: 'length', question: 'Panjang cerita yang kamu sanggupi?', negative: 'Pendek, sekali duduk selesai', positive: 'Panjang, biar puas' },
    { axis: 'length', question: 'Kamu lebih sering menyelesaikan…', negative: 'Yang cuma belasan episode', positive: 'Yang ratusan episode pun hayo' },

    // era
    { axis: 'era', question: 'Kamu lebih sering nonton…', negative: 'Judul lama yang sudah teruji', positive: 'Yang baru keluar' },
    { axis: 'era', question: 'Kalau disuruh milih tontonan malam ini…', negative: 'Klasik yang belum sempat kamu tonton', positive: 'Yang lagi tayang musim ini' },
  ];

  const QUESTION_COUNT = 4;

  function pickQuestions(): Question[] {
    const byAxis = new Map<Axis, Question[]>();
    for (const q of QUESTION_POOL) {
      if (!byAxis.has(q.axis)) byAxis.set(q.axis, []);
      byAxis.get(q.axis)!.push(q);
    }

    // Four distinct axes, then one phrasing from each — so a run never asks the
    // same thing twice in different words.
    const axes = [...byAxis.keys()].sort(() => Math.random() - 0.5).slice(0, QUESTION_COUNT);

    return axes.map((axis) => {
      const options = byAxis.get(axis)!;
      return options[Math.floor(Math.random() * options.length)];
    });
  }

  let QUESTIONS: Question[] = [];

  const BLANK: Record<Axis, number> = { mood: 0, pace: 0, world: 0, heart: 0, stakes: 0, humor: 0, fame: 0, length: 0, era: 0 };

  let answers: Record<Axis, number> = { ...BLANK };
  let step = 0;

  /**
   * Navigating to the result is one wait, the AI copy is the next. Both are
   * covered by the same screen, and the navigation half reads from $navigating
   * — a manual flag set before goto() stayed true forever, because SvelteKit
   * reuses this component when only the query string changes.
   */
  $: submitting = Boolean($navigating);

  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: canonical = absoluteUrl('/anime/selera');
  $: pageTitle = buildPageTitle('Know Your Taste of Anime', siteName);
  $: description =
    'Jawab beberapa pertanyaan singkat buat tahu selera anime kamu, lengkap dengan rekomendasi yang cocok.';
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
    const q = new URLSearchParams(
      Object.entries(answers).map(([k, v]) => [k, String(v)])
    );
    // Answers live in the URL so a result can be shared, bookmarked and
    // re-opened without any of it being stored server-side.
    goto(`/anime/selera?${q}`, { noScroll: false });
  }

  function restart() {
    answers = { ...BLANK };
    QUESTIONS = pickQuestions();
    step = 0;
    stopCooking();
    goto('/anime/selera');
  }

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = '/images/noimage.png';
  }

  /**
   * The AI copy is layered on top of a result that already works.
   *
   * The matcher picked the titles; this only asks a model to name the taste and
   * say why each pick fits. If it is slow or down the reader keeps the
   * deterministic profile and never learns anything was missing.
   */
  let aiLabel: string | null = null;
  let aiBlurb: string | null = null;
  let aiReasons: Record<string, string> = {};
  let cooking = false;

  const COOKING_LINES = [
    'Sedang memasak rekomendasi buat kamu…',
    'Menakar selera kamu…',
    'Menyisihkan yang terlalu mainstream…',
    'Hampir matang…',
  ];
  let cookingLine = COOKING_LINES[0];
  let cookingTimer: ReturnType<typeof setInterval> | null = null;

  let cookingGuard: ReturnType<typeof setTimeout> | null = null;

  function startCooking() {
    cooking = true;
    let i = 0;
    cookingLine = COOKING_LINES[0];
    cookingTimer = setInterval(() => {
      i = (i + 1) % COOKING_LINES.length;
      cookingLine = COOKING_LINES[i];
    }, 1800);

    // Hard ceiling. The fetch has its own timeout, but a hung connection or a
    // sleeping tab must never leave someone staring at a bowl of ramen.
    cookingGuard = setTimeout(stopCooking, 18_000);
  }

  function stopCooking() {
    cooking = false;
    if (cookingTimer) {
      clearInterval(cookingTimer);
      cookingTimer = null;
    }
    if (cookingGuard) {
      clearTimeout(cookingGuard);
      cookingGuard = null;
    }
  }

  async function enhance(result: NonNullable<PageData['result']>) {
    startCooking();

    try {
      const res = await fetch('/api/anime/taste-ai', {
        signal: AbortSignal.timeout(16_000),
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: result.answers,
          fallbackLabel: result.profile.label,
          titles: result.anime.map((a) => ({
            malId: a.malId,
            title: a.title,
            score: a.score,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        aiLabel = data.label ?? null;
        aiBlurb = data.blurb ?? null;
        aiReasons = data.reasons ?? {};
      }
    } catch {
      // Deliberately silent: the deterministic result is already on screen.
    } finally {
      stopCooking();
    }
  }

  // Re-runs whenever a new result loads, including a second pass of the quiz.
  let enhancedFor: string | null = null;
  $: if (browser && data.result) {
    const key = JSON.stringify(data.result.answers);
    if (key !== enhancedFor) {
      enhancedFor = key;
      aiLabel = null;
      aiBlurb = null;
      aiReasons = {};
      enhance(data.result);
    }
  }

  // Chosen in the browser, not during SSR: a server-side Math.random would
  // render one set of questions and hydrate a different one.
  onMount(() => {
    if (!QUESTIONS.length) QUESTIONS = pickQuestions();
  });

  onDestroy(stopCooking);

  $: shownLabel = aiLabel ?? data.result?.profile.label ?? '';
  $: shownBlurb = aiBlurb ?? data.result?.profile.blurb ?? '';

  /**
   * Story card URL. Label and blurb ride along so the image matches the words
   * on screen — including the AI copy, which the API has no way to recompute.
   */
  $: storyUrl = (() => {
    if (!data.result) return '';
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(data.result.answers)) q.set(k, String(v));
    q.set('ids', data.result.anime.slice(0, 6).map((a) => a.malId).join(','));
    if (shownLabel) q.set('label', shownLabel);
    if (shownBlurb) q.set('blurb', shownBlurb);
    return `/anime/selera/story.png?${q}`;
  })();
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <!-- The robots tag lives in the /anime layout now: the whole section is
       noindex, so the quiz no longer needs its own rule. -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
</svelte:head>

{#if cooking || submitting}
  <!-- Covers both waits with one screen: the navigation to the result and the
       AI copy that lands after it. Two separate spinners would read as the page
       stalling twice. -->
  <div class="cooking" role="status" aria-live="polite">
    <div class="cooking__inner">
      <div class="cooking__pot" aria-hidden="true">
        <span class="cooking__steam"></span>
        <span class="cooking__steam"></span>
        <span class="cooking__steam"></span>
        <span class="cooking__bowl">🍜</span>
      </div>
      <p class="cooking__line">{cookingLine}</p>
      <p class="cooking__sub">Sebentar ya, lagi dicocokin sama selera kamu.</p>
    </div>
  </div>
{/if}

<section class="section-md container-xl taste">
  {#if !data.answered}
    <header class="taste__hero">
      <span class="badge badge-main mb-3">Kuis</span>
      <h1 class="taste__title">Know Your Taste of Anime</h1>
      <p class="taste__desc">
        Beberapa pertanyaan singkat buat tahu selera anime kamu — plus rekomendasi yang cocok sama seleranya.
      </p>
    </header>

    <div class="taste__card">
      {#if !QUESTIONS.length}
        <p class="taste__step">Menyiapkan pertanyaan…</p>
      {:else}
      <div class="taste__progress" aria-hidden="true">
        {#each QUESTIONS as _, i}
          <span class="taste__dot" class:is-done={i <= step}></span>
        {/each}
      </div>

      <p class="taste__step">Pertanyaan {step + 1} dari {QUESTIONS.length}</p>

      {#key step}
        <div class="taste__slide">
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
        </div>
      {/key}
      {/if}
    </div>
  {:else if data.result}
    <header class="taste__hero taste__hero--result">
      <span class="badge badge-main mb-3">Selera kamu</span>
      <h1 class="taste__title">{shownLabel}</h1>
      <p class="taste__desc">{shownBlurb}</p>

      <p class="taste__share-hint">
        <i class="bi bi-instagram"></i>
        Bagikan ke Instagram Story dan tag <strong>@mokultur</strong> ya!
      </p>

      <div class="d-flex flex-wrap gap-2 mt-3">
        <ShareSheet url={resultUrl} title={`Selera anime gue: ${shownLabel}`}>
          <a slot="extra" class="sheet__download" href={storyUrl}>
            <i class="bi bi-instagram"></i>
            <span>Unduh buat IG Story <small>1080 × 1920</small></span>
          </a>
        </ShareSheet>
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
          {#if aiReasons[String(anime.malId)]}
            <p class="taste__reason">{aiReasons[String(anime.malId)]}</p>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  /* ---- overlay "sedang memasak" ---- */
  .cooking {
    position: fixed;
    inset: 0;
    z-index: 1090;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: rgb(10 10 10 / 82%);
    backdrop-filter: blur(6px);
    animation: cooking-in 0.25s ease-out;
  }

  .cooking__inner {
    text-align: center;
    color: #fff;
    max-width: 22rem;
  }

  .cooking__pot {
    position: relative;
    width: 120px;
    height: 110px;
    margin: 0 auto 1.25rem;
  }

  .cooking__bowl {
    position: absolute;
    inset: auto 0 0;
    font-size: 4rem;
    line-height: 1;
    animation: cooking-bob 1.6s ease-in-out infinite;
  }

  .cooking__steam {
    position: absolute;
    bottom: 58px;
    width: 10px;
    height: 30px;
    border-radius: 999px;
    background: linear-gradient(to top, rgb(255 255 255 / 45%), transparent);
    opacity: 0;
    animation: cooking-steam 2.2s ease-out infinite;
  }

  .cooking__steam:nth-child(1) { left: 38px; animation-delay: 0s; }
  .cooking__steam:nth-child(2) { left: 55px; animation-delay: 0.5s; }
  .cooking__steam:nth-child(3) { left: 72px; animation-delay: 1s; }

  .cooking__line {
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    margin: 0 0 0.35rem;
    /* Keyed on text so each phrase fades in rather than snapping. */
    animation: cooking-in 0.4s ease-out;
  }

  .cooking__sub {
    margin: 0;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 62%);
  }

  @keyframes cooking-in {
    from { opacity: 0; transform: translateY(8px); }
  }

  @keyframes cooking-bob {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50% { transform: translateY(-6px) rotate(2deg); }
  }

  @keyframes cooking-steam {
    0% { opacity: 0; transform: translateY(0) scaleX(1); }
    30% { opacity: 0.9; }
    100% { opacity: 0; transform: translateY(-38px) scaleX(1.6); }
  }

  /* ---- transisi antar pertanyaan ---- */
  .taste__slide {
    animation: taste-slide 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes taste-slide {
    from { opacity: 0; transform: translateX(18px); }
  }

  .sheet__download {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    border: 1px solid var(--bs-border-color, #dee2e6);
    margin-bottom: 0.5rem;
  }

  .sheet__download:hover {
    background: var(--bs-tertiary-bg, #f8f9fa);
  }

  .sheet__download small {
    display: block;
    color: var(--bs-secondary-color, #6c757d);
  }

  .taste__reason {
    margin: 0.3rem 0 0;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--bs-secondary-color, #6c757d);
    animation: cooking-in 0.4s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .cooking,
    .cooking__line,
    .cooking__bowl,
    .cooking__steam,
    .taste__slide,
    .taste__reason {
      animation: none;
    }
  }

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

  .taste__share-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1.5rem 0 0;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 78%);
  }

  .taste__share-hint strong {
    color: var(--site-primary, #f1ff32);
  }

  .taste__share-hint i {
    color: var(--site-primary, #f1ff32);
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
