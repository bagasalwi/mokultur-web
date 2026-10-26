<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';
  import { renderMarkdown } from '$lib/chat/markdown';
  import { stripExpressionTags, type MokuExpression } from '$lib/chat/expressions';
  import { busy, chatError, messages, resetChat, restoreChat, sendChat } from '$lib/chat/session';
  import { AVATAR_POSTER, STAGE_FRAME, STAGE_POSTER } from '$lib/moku/frames';
  import { ENOUGH, HEAD_PAT, POKE, TOO_MANY, mokuStatus, pick, type Line } from '$lib/moku/lines';
  import MokuCanvas from '$components/moku/MokuCanvas.svelte';
  import SectionHead from '$components/ui/SectionHead.svelte';

  /**
   * mokultur.com/moku — Moku-san full size and live, beside a chat that is the
   * same conversation as the corner widget (lib/chat/session), which this page
   * hides. The stage answers in a visual-novel dialogue box: the chat's replies,
   * and Moku-san's own lines (lib/moku/lines) for her greeting and for taps on
   * her, which cost nothing and stay out of the conversation.
   */
  let { data } = $props();

  const TITLE = 'Moku-san';
  const DESCRIPTION =
    'Ngobrol dengan Moku-san (Monika Kuriru), asisten pribadi Mokultur. Minta rekomendasi anime dan film, cari artikel, cek jadwal event, atau tanya cara kerja sama dengan Mokultur.';
  const PROMPTS = [
    'Rekomendasiin anime buat weekend, dong',
    'Film apa yang wajib ditonton?',
    'Ada artikel terbaru apa?',
    'Event apa yang sebentar lagi?',
    'Kamu suka nonton apa?',
    'Cara jadi media partner Mokultur?',
  ];
  /** What Moku-san helps with, each a way into the chat. */
  const HELP = [
    { icon: 'bi-film', title: 'Rekomendasi tontonan', text: 'Ceritakan mood-mu, Moku-san kurasikan anime atau film yang pas, lengkap dengan alasannya.', prompt: 'Moku-san, rekomendasiin tontonan yang cocok buat aku, dong' },
    { icon: 'bi-journal-text', title: 'Artikel dan rubrik', text: 'Dari Know Your Culture sampai Rapor Kultur, langsung dengan tautannya.', prompt: 'Ada artikel terbaru apa di Mokultur?' },
    { icon: 'bi-calendar-event', title: 'Event terdekat', text: 'Jadwal, tanggal, dan lokasi event yang diliput Mokultur.', prompt: 'Event apa yang sebentar lagi?' },
    { icon: 'bi-people', title: 'Kerja sama', text: 'Kolaborasi, iklan, atau media partner, dan ke mana harus menghubungi.', prompt: 'Gimana cara kerja sama dengan Mokultur?' },
  ];
  const GREETING: Line = { text: 'Hmph, akhirnya ada yang mampir. Aku Monika Kuriru, panggil aja Moku-san. Mau cari apa? B-bukan karena aku senang ditanya, ya!', expression: 'tsundere' };
  const WELCOME_BACK: Line = { text: 'Oh, kamu lagi. Obrolan tadi masih ada, lanjut aja. Aku nggak nungguin, kok.', expression: 'tsundere' };

  const siteName = $derived(data.settings?.site_name ?? 'Mokultur');
  const chatOn = $derived(data.settings?.ai_chat_enabled !== false);

  let moku = $state<MokuCanvas>();
  let ready = $state(false);
  let input = $state('');
  let listEl = $state<HTMLDivElement>();
  let chatEl = $state<HTMLElement>();
  let status = $state('');

  // The dialogue box: a line of Moku-san's own, typed out, or the reply as it arrives.
  let say = $state<{ mode: 'line' | 'reply' | 'thinking'; text: string }>({ mode: 'line', text: '' });
  // The whole of each line or reply, once, for screen readers; the box itself types out.
  let announce = $state('');
  let cursor = $state<'pointer' | 'default'>('default');

  let typer: ReturnType<typeof setInterval> | undefined;
  let greetTimer: ReturnType<typeof setTimeout> | undefined;
  let pokeTimer: ReturnType<typeof setTimeout> | undefined;
  let pokes = 0;
  let lastLine: Line | undefined;
  const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Moku-san's face for `seconds`, then back to netral. */
  function feel(name: MokuExpression, seconds: number) {
    moku?.hold(name, seconds);
  }

  function speak(line: Line) {
    if ($busy) return;
    lastLine = line;
    feel(line.expression, Math.min(6, 2 + line.text.length * 0.04));
    moku?.talk(Math.min(3.5, 0.5 + line.text.length * 0.035));
    announce = line.text;
    clearInterval(typer);
    if (reduceMotion) {
      say = { mode: 'line', text: line.text };
      return;
    }
    let shown = 0;
    say = { mode: 'line', text: '' };
    typer = setInterval(() => {
      shown += 1;
      say = { mode: 'line', text: line.text.slice(0, shown) };
      if (shown >= line.text.length) clearInterval(typer);
    }, 22);
  }

  /** A tap on the stage: on the head it is a pat, anywhere else on Moku-san a poke. */
  function poke(part: 'head' | 'body') {
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(() => (pokes = 0), 5000);
    pokes += 1;
    if (pokes >= TOO_MANY) {
      pokes = 0;
      speak(ENOUGH);
      return;
    }
    if (part === 'head') moku?.play('Nod');
    speak(pick(part === 'head' ? HEAD_PAT : POKE, lastLine));
  }

  function onStageClick(event: MouseEvent) {
    const part = moku?.partAt(event.clientX, event.clientY);
    if (part) poke(part);
  }

  function onStageMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    cursor = moku?.partAt(event.clientX, event.clientY) ? 'pointer' : 'default';
  }

  async function scrollLog() {
    await tick();
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
  }

  function ask(text: string) {
    if (!text.trim() || $busy || !chatOn) return;
    input = '';
    clearInterval(typer);
    clearTimeout(greetTimer);
    say = { mode: 'thinking', text: '' };
    scrollLog();
    void sendChat(text, {
      onWaiting: () => feel('berpikir', 30),
      onExpression: (name) => feel(name, 30),
      onText: (reply, first) => {
        if (first) moku?.play('Nod');
        moku?.talk(0.5);
        say = { mode: 'reply', text: reply };
        scrollLog();
      },
      // The reply's face stays a while, longer for a longer answer, then Moku-san relaxes.
      onDone: (expression, reply) => {
        feel(expression, Math.min(8, 2 + reply.length * 0.04));
        say = { mode: 'reply', text: reply };
        announce = reply;
      },
      onError: (message) => {
        feel('sedih', 3);
        say = { mode: 'line', text: message };
        announce = message;
      },
    }).then(scrollLog);
  }

  /** A topic from further down the page: asked, and the chat brought up so its newest message and input are in view. */
  function askAbout(prompt: string) {
    chatEl?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
    ask(prompt);
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    ask(input);
  }

  function restart() {
    resetChat();
    speak({ text: 'Oke, kita mulai dari awal. Jangan bikin aku nunggu, ya.', expression: 'tsundere' });
  }

  onMount(() => {
    restoreChat();
    status = mokuStatus();
    const clock = setInterval(() => (status = mokuStatus()), 60_000);
    greetTimer = setTimeout(() => speak($messages.length ? WELCOME_BACK : GREETING), 700);
    scrollLog();
    return () => clearInterval(clock);
  });

  onDestroy(() => {
    clearInterval(typer);
    clearTimeout(greetTimer);
    clearTimeout(pokeTimer);
  });
</script>

<svelte:head>
  <title>{buildPageTitle(TITLE, siteName)}</title>
  <meta name="description" content={DESCRIPTION} />
  <link rel="canonical" href={absoluteUrl('/moku')} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={buildPageTitle(TITLE, siteName)} />
  <meta property="og:description" content={DESCRIPTION} />
  <meta property="og:url" content={absoluteUrl('/moku')} />
  <meta property="og:image" content={absoluteUrl('/moku/moku-og.jpg?v=2')} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={absoluteUrl('/moku/moku-og.jpg?v=2')} />
  <link rel="preload" href={STAGE_POSTER} as="image" type="image/webp" />
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: TITLE, path: '/moku' }]))}<\/script>`}
</svelte:head>

<div class="moku-page container-xl">
  <nav class="moku-crumbs" aria-label="Breadcrumb">
    <a href="/">Beranda</a>
    <i class="bi bi-chevron-right" aria-hidden="true"></i>
    <span aria-current="page">Moku-san</span>
  </nav>

  <div class="moku-layout">
    <section class="moku-stage" aria-labelledby="moku-title">
      <header class="moku-stage__head">
        <div>
          <p class="moku-stage__eyebrow">Asisten pribadi Mokultur</p>
          <h1 id="moku-title">Moku-san</h1>
          <p class="moku-stage__intro">Monika Kuriru, yang siap bantu kamu cari artikel, cek event, sampai milih tontonan berikutnya. Tanya aja, walau jawabnya sambil gengsi.</p>
        </div>
        {#if status}
          <span class="moku-status" class:is-away={!chatOn}><span class="moku-status__dot" aria-hidden="true"></span>{chatOn ? status : 'Lagi istirahat'}</span>
        {/if}
      </header>

      <div class="moku-scene-wrap">
        <!-- Taps here are a bonus (Moku-san answers a pat or a poke); nothing on the page needs them. -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="moku-scene" style:cursor onclick={onStageClick} onpointermove={onStageMove}>
          <span class="moku-scene__disc" aria-hidden="true"></span>
          <div class="moku-scene__moku">
            <MokuCanvas bind:this={moku} bind:ready frame={STAGE_FRAME} poster={STAGE_POSTER} fps={60} greet="always" />
          </div>
        </div>

        {#if say.text || say.mode === 'thinking'}
          <div class="moku-dialogue">
            <span class="moku-dialogue__name">Moku-san</span>
            {#if say.mode === 'thinking'}
              <p class="moku-dialogue__text moku-dialogue__typing" aria-label="Moku-san sedang mengetik"><span></span><span></span><span></span></p>
            {:else if say.mode === 'reply'}
              <div class="moku-dialogue__text">{@html renderMarkdown(say.text)}</div>
            {:else}
              <p class="moku-dialogue__text">{say.text}</p>
            {/if}
          </div>
        {/if}
        <p class="visually-hidden" aria-live="polite">{announce}</p>
      </div>

    </section>

    <section class="moku-chat" aria-labelledby="moku-chat-title" bind:this={chatEl}>
      <header class="moku-chat__head">
        <img src={AVATAR_POSTER} alt="" width="40" height="40" />
        <div>
          <h2 id="moku-chat-title">Ngobrol sama Moku-san</h2>
          <p><span class="moku-chat__dot" class:is-away={!chatOn} aria-hidden="true"></span>{chatOn ? 'Online, biasanya langsung dibalas' : 'Lagi istirahat'}</p>
        </div>
        {#if $messages.length}
          <button type="button" class="moku-chat__reset" onclick={restart} title="Mulai obrolan baru" aria-label="Mulai obrolan baru" disabled={$busy}>
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          </button>
        {/if}
      </header>

      <div class="moku-log" bind:this={listEl}>
        {#if !$messages.length}
          <!-- Before the first message: where to start, next to the input, as the corner widget does. -->
          <div class="moku-log__start">
            <p class="moku-log__empty">{chatOn ? 'Mau mulai dari mana? Pilih salah satu, atau tulis pertanyaanmu sendiri.' : 'Moku-san lagi istirahat. Coba lagi nanti, ya.'}</p>
            {#if chatOn}
              <div class="moku-prompts" role="group" aria-label="Topik untuk memulai">
                {#each PROMPTS as prompt (prompt)}
                  <button type="button" class="moku-prompt" onclick={() => ask(prompt)} disabled={$busy}>{prompt}</button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        {#each $messages as m, i (i)}
          <div class="moku-msg moku-msg--{m.role}">
            {#if m.role === 'assistant'}
              {#if m.content}
                <div class="moku-msg__bubble">{@html renderMarkdown(stripExpressionTags(m.content))}</div>
              {:else if $busy && i === $messages.length - 1}
                <div class="moku-msg__bubble moku-msg__typing" aria-label="Moku-san sedang mengetik"><span></span><span></span><span></span></div>
              {/if}
            {:else}
              <div class="moku-msg__bubble">{m.content}</div>
            {/if}
          </div>
        {/each}
        {#if $chatError}<p class="moku-log__error">{$chatError}</p>{/if}
      </div>

      <form class="moku-form" onsubmit={onSubmit}>
        <label class="visually-hidden" for="moku-input">Pesan untuk Moku-san</label>
        <input
          id="moku-input"
          type="text"
          bind:value={input}
          placeholder={chatOn ? 'Tanya Moku-san…' : 'Moku-san lagi istirahat'}
          maxlength="1000"
          autocomplete="off"
          enterkeyhint="send"
          disabled={$busy || !chatOn}
        />
        <button type="submit" aria-label="Kirim" disabled={$busy || !chatOn || !input.trim()}><i class="bi bi-send-fill" aria-hidden="true"></i></button>
      </form>
      <p class="moku-chat__note">Jawaban Moku-san bisa keliru. Cek lagi info yang penting, ya.</p>
    </section>
  </div>

  <section class="moku-about" aria-labelledby="moku-about-title">
    <SectionHead title="Kenalan sama Moku-san" sub="Asisten pribadi Mokultur yang paling gengsian." headingId="moku-about-title" />
    <div class="moku-about__grid">
      <article class="moku-id" aria-label="Profil Moku-san">
        <div class="moku-id__band">
          <span>Mokultur</span>
          <span>Be The Cultured!</span>
        </div>
        <div class="moku-id__body">
          <img src={AVATAR_POSTER} alt="Moku-san" width="96" height="96" />
          <div>
            <p class="moku-id__name">Monika Kuriru</p>
            <p class="moku-id__role">Moku-san · Asisten pribadi Mokultur</p>
          </div>
        </div>
        <dl class="moku-id__facts">
          <div><dt>Tugas</dt><dd>Bantu kamu nemu artikel, event, dan info Mokultur.</dd></div>
          <div><dt>Hobi</dt><dd>Nonton anime dan film, mengkurasi tontonan, dan mengkarbitkan orang.</dd></div>
          <div><dt>Keahlian</dt><dd>Berpikir logis. Rekomendasinya selalu ada alasannya.</dd></div>
          <div><dt>Sifat</dt><dd>Tsundere akut. Jangan dipuji, nanti salah tingkah.</dd></div>
        </dl>
      </article>

      <div class="moku-help">
        <h3>Moku-san bisa bantu</h3>
        <ul>
          {#each HELP as item (item.title)}
            <li>
              <button type="button" class="moku-help__item" onclick={() => askAbout(item.prompt)} disabled={$busy || !chatOn}>
                <i class="bi {item.icon}" aria-hidden="true"></i>
                <span class="moku-help__text"><strong>{item.title}</strong>{item.text}</span>
                <i class="bi bi-arrow-right moku-help__go" aria-hidden="true"></i>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>
</div>

<style lang="scss">
  .moku-page {
    padding-top: 1.25rem;
    padding-bottom: 3rem;
  }

  .moku-crumbs {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 1rem;
    color: #6b7280;
    font-size: 0.85rem;

    a { color: #6b7280; }
    i { font-size: 0.65rem; }
    span { color: #1a1a1a; font-weight: 700; }
  }

  .moku-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;

    @media (min-width: 992px) {
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      gap: 1.5rem;
    }
  }

  // ---- Stage: the archive hero's dark card, with Moku-san in front of an accent disc ----
  .moku-stage {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    border-radius: 28px;
    color: #fff;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--site-accent-glow, #f1ff32) 40%, transparent), transparent 30%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #111827 48%, #1f2937 100%);
    box-shadow: 0 24px 80px rgba(10, 10, 10, 0.15);
  }

  .moku-stage__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem 1rem;
    padding: 1.5rem 1.5rem 0;

    h1 {
      margin: 0;
      color: #fff;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.05;
    }

    @media (min-width: 768px) {
      padding: 2rem 2rem 0;
    }
  }

  .moku-stage__eyebrow {
    margin: 0 0 0.35rem;
    color: var(--site-primary, #f1ff32);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .moku-stage__intro {
    max-width: 46ch;
    margin: 0.5rem 0 0;
    color: rgba(255, 255, 255, 0.78);
    line-height: 1.55;
  }

  .moku-status {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .moku-status__dot,
  .moku-chat__dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  }

  .moku-status.is-away .moku-status__dot,
  .moku-chat__dot.is-away {
    background: #9ca3af;
    box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.25);
  }

  .moku-scene-wrap {
    position: relative;
    margin-top: 0.5rem;
    padding-bottom: 1rem;

    @media (min-width: 768px) {
      padding-bottom: 0;
    }
  }

  // Phones: the scene takes the frame's own shape, so Moku-san fills it, and
  // the dialogue box sits under it. Wider: a taller scene with the box over
  // the bottom of it, below the face.
  .moku-scene {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1460 / 1248;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    @media (min-width: 768px) {
      aspect-ratio: auto;
      height: 460px;
    }

    @media (min-width: 992px) {
      height: clamp(460px, 62vh, 600px);
    }
  }

  // The accent behind Moku-san, so dark hair and suit stand out from the dark card.
  .moku-scene__disc {
    position: absolute;
    left: 50%;
    bottom: -20%;
    height: 112%;
    aspect-ratio: 1;
    transform: translateX(-50%);
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--site-primary, #f1ff32) 82%, #fff), var(--site-primary, #f1ff32) 62%);
  }

  .moku-scene__moku {
    position: absolute;
    inset: 0;
  }

  // Visual-novel dialogue box.
  .moku-dialogue {
    position: relative;
    z-index: 1;
    margin: -1.5rem 1rem 0;
    padding: 1.35rem 1.1rem 0.9rem;
    border: 1px solid rgba(13, 13, 13, 0.08);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    color: #1a1a1a;
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
    cursor: auto;

    @media (min-width: 768px) {
      position: absolute;
      left: 1.5rem;
      right: 1.5rem;
      bottom: 1.5rem;
      margin: 0;
    }
  }

  .moku-dialogue__name {
    position: absolute;
    top: 0;
    left: 1rem;
    transform: translateY(-50%);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: var(--site-dark, #0d0d0d);
    color: var(--site-primary, #f1ff32);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .moku-dialogue__text {
    min-height: 1.5em;
    max-height: 9.5em;
    overflow-y: auto;
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.55;
    text-wrap: pretty;

    :global(p) { margin: 0 0 0.4rem; }
    :global(p:last-child) { margin-bottom: 0; }
    :global(a) { color: inherit; font-weight: 700; text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 3px; text-underline-offset: 3px; }
  }

  .moku-dialogue__typing,
  .moku-msg__typing {
    display: flex;
    gap: 5px;
    align-items: center;

    span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.35;
    }

    @media (prefers-reduced-motion: no-preference) {
      span { animation: moku-dot 1s infinite; }
      span:nth-child(2) { animation-delay: 0.15s; }
      span:nth-child(3) { animation-delay: 0.3s; }
    }
  }

  @keyframes moku-dot {
    0%, 100% { opacity: 0.25; transform: translateY(0); }
    50% { opacity: 0.9; transform: translateY(-3px); }
  }

  // ---- Chat card ----
  .moku-chat {
    display: flex;
    flex-direction: column;
    min-width: 0;
    scroll-margin-bottom: 1rem;
    height: min(78svh, 640px);
    border: 1px solid #e5e5e5;
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    @media (min-width: 992px) {
      height: auto;
      max-height: none;
    }
  }

  .moku-chat__head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.1rem;
    border-bottom: 1px solid #e5e5e5;

    img {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--site-primary, #f1ff32);
    }

    > div { flex: 1; min-width: 0; }

    h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    p {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin: 0.2rem 0 0;
      color: #6b7280;
      font-size: 0.8rem;
    }
  }

  .moku-chat__reset {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid #e5e5e5;
    border-radius: 50%;
    background: #fff;
    color: #1a1a1a;
    cursor: pointer;

    &:hover { border-color: #1a1a1a; }
    &:focus-visible { outline: 3px solid var(--site-dark, #0d0d0d); outline-offset: 2px; }
  }

  .moku-log {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.6rem;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 1.1rem;
    background: #fafafa;

    @media (min-width: 992px) {
      // The card stretches to the stage; the log fills what is left of it.
      min-height: 280px;
      flex-basis: 0;
    }
  }

  .moku-log__start {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: auto;
  }

  .moku-log__empty {
    margin: 0;
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.55;
  }

  .moku-log__error {
    margin: 0;
    padding: 0.6rem 0.8rem;
    border-radius: 12px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 0.85rem;
  }

  .moku-msg {
    display: flex;
  }

  .moku-msg--user {
    justify-content: flex-end;
  }

  .moku-msg__bubble {
    max-width: 86%;
    padding: 0.6rem 0.85rem;
    border-radius: 16px;
    font-size: 0.92rem;
    line-height: 1.5;
    overflow-wrap: anywhere;

    :global(p) { margin: 0 0 0.4rem; }
    :global(p:last-child) { margin-bottom: 0; }
    :global(a) { color: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
  }

  .moku-msg--assistant .moku-msg__bubble {
    border: 1px solid #e5e5e5;
    border-bottom-left-radius: 4px;
    background: #fff;
    color: #1a1a1a;
  }

  .moku-msg--user .moku-msg__bubble {
    border-bottom-right-radius: 4px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #0d0d0d);
  }

  .moku-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .moku-prompt {
    min-height: 44px;
    padding: 0.45rem 0.95rem;
    border: 1px solid #e5e5e5;
    border-radius: 999px;
    background: #fff;
    color: #1a1a1a;
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.3;
    text-align: left;
    cursor: pointer;

    &:hover { border-color: #1a1a1a; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &:focus-visible { outline: 3px solid var(--site-dark, #0d0d0d); outline-offset: 2px; }
  }

  // The archive search field's shape: a pill with a round dark send button inside.
  .moku-form {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0.75rem 1.1rem 0;
    padding: 0.3rem 0.3rem 0.3rem 1rem;
    border: 1px solid #d4d4d4;
    border-radius: 999px;
    background: #fff;

    &:focus-within { border-color: var(--site-dark, #0d0d0d); box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-primary, #f1ff32) 45%, transparent); }

    input {
      flex: 1;
      min-width: 0;
      min-height: 40px;
      border: 0;
      outline: 0;
      background: transparent;
      color: #1a1a1a;
      // 16px so iOS Safari does not zoom the page on focus.
      font-size: 1rem;
    }

    button {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: var(--site-dark, #0d0d0d);
      color: #fff;
      cursor: pointer;

      &:disabled { opacity: 0.35; cursor: not-allowed; }
      &:focus-visible { outline: 3px solid var(--site-primary, #f1ff32); outline-offset: 2px; }
    }
  }

  .moku-chat__note {
    margin: 0;
    padding: 0.5rem 1.1rem 0.9rem;
    color: #6b7280;
    font-size: 0.75rem;
    text-align: center;
  }

  // ---- About ----
  .moku-about {
    margin-top: 2.5rem;
  }

  .moku-about__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;

    @media (min-width: 768px) {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      gap: 2rem;
      align-items: start;
    }
  }

  // An office ID card: the dark band of the hero, the accent avatar, the facts.
  .moku-id {
    overflow: hidden;
    border: 1px solid #e5e5e5;
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 12px 32px rgba(10, 10, 10, 0.08);
  }

  .moku-id__band {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1.25rem;
    background: var(--site-dark, #0d0d0d);
    color: var(--site-primary, #f1ff32);
    font-size: 0.8rem;
    font-weight: 800;

    span:last-child { color: rgba(255, 255, 255, 0.7); font-weight: 600; }
  }

  .moku-id__body {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.25rem 0.75rem;

    img {
      flex-shrink: 0;
      width: 96px;
      height: 96px;
      border-radius: 16px;
      background: var(--site-primary, #f1ff32);
    }
  }

  .moku-id__name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .moku-id__role {
    margin: 0.15rem 0 0;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .moku-id__facts {
    margin: 0;
    padding: 0.25rem 1.25rem 1.25rem;

    div {
      display: grid;
      grid-template-columns: 6.5rem minmax(0, 1fr);
      gap: 0.75rem;
      padding: 0.65rem 0;
      border-top: 1px solid #f0f0f0;
    }

    dt {
      color: #6b7280;
      font-size: 0.8rem;
      font-weight: 700;
    }

    dd {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }

  .moku-help {
    h3 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    ul {
      display: grid;
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;

      @media (min-width: 576px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    li { display: flex; }
  }

  // Each topic is a way into the chat: the whole card asks it.
  .moku-help__item {
    display: flex;
    flex: 1;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 1rem;
    border: 1px solid #e5e5e5;
    border-radius: 18px;
    background: #fff;
    color: #1a1a1a;
    text-align: left;
    cursor: pointer;
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;

    > .bi:first-child {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--site-primary, #f1ff32) 30%, #fff);
      font-size: 1.05rem;
    }

    &:hover:not(:disabled) {
      border-color: #1a1a1a;
      box-shadow: 0 10px 24px rgba(10, 10, 10, 0.08);
    }

    &:hover:not(:disabled) .moku-help__go { transform: translateX(3px); color: #1a1a1a; }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
    &:focus-visible { outline: 3px solid var(--site-dark, #0d0d0d); outline-offset: 2px; }
  }

  .moku-help__text {
    flex: 1;
    min-width: 0;
    color: #4b5563;
    font-size: 0.88rem;
    line-height: 1.5;

    strong {
      display: block;
      margin-bottom: 0.15rem;
      color: #1a1a1a;
      font-size: 0.95rem;
      font-weight: 800;
    }
  }

  .moku-help__go {
    align-self: center;
    color: #9ca3af;
    transition: transform 160ms ease, color 160ms ease;
  }
</style>
