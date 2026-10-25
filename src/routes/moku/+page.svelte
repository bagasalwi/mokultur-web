<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { absoluteUrl, buildBreadcrumb, buildPageTitle } from '$lib/seo';
  import { renderMarkdown } from '$lib/chat/markdown';
  import { MOKU_EXPRESSIONS, stripExpressionTags, type MokuExpression } from '$lib/chat/expressions';
  import { busy, chatError, messages, resetChat, restoreChat, sendChat } from '$lib/chat/session';
  import { AVATAR_POSTER, STAGE_FRAME, STAGE_POSTER } from '$lib/moku/frames';
  import { ENOUGH, EXPRESSION_LINES, GESTURES, HEAD_PAT, POKE, TOO_MANY, officeStatus, pick, type Line } from '$lib/moku/lines';
  import MokuCanvas from '$components/moku/MokuCanvas.svelte';
  import SectionHead from '$components/ui/SectionHead.svelte';

  /**
   * mokultur.com/moku — Moku-san full size and live, beside a chat that is the
   * same conversation as the corner widget (lib/chat/session), which this page
   * hides. The stage answers in a visual-novel dialogue box: replies from the
   * AI, and Moku-san's own lines (lib/moku/lines) for taps on the stage, the
   * gesture buttons and the expression chips, which cost nothing and stay out
   * of the conversation.
   */
  let { data } = $props();

  const TITLE = 'Moku-san';
  const DESCRIPTION =
    'Ngobrol langsung dengan Moku-san, asisten AI Mokultur: pekerja kantoran, penggemar Frieren dan anime action, tsundere akut. Tanya soal artikel, event, talent, dan info Mokultur.';
  const PROMPTS = [
    'Rekomendasi anime action, dong',
    'Kenapa kamu suka Frieren?',
    'Ada artikel anime terbaru?',
    'Event apa yang sebentar lagi?',
    'Kerja di Mokultur ngapain aja?',
    'Cara jadi media partner Mokultur?',
  ];
  const GREETING: Line = { text: 'Hmph, akhirnya ada yang mampir. Aku Moku-san. Mau tanya apa? Ketik aja, aku jawab. B-bukan karena senang ditanya, ya!', expression: 'tsundere' };
  const WELCOME_BACK: Line = { text: 'Oh, kamu lagi. Obrolan tadi masih ada di sebelah, lanjut aja. Aku nggak nungguin, kok.', expression: 'tsundere' };

  const siteName = $derived(data.settings?.site_name ?? 'Mokultur');
  const chatOn = $derived(data.settings?.ai_chat_enabled !== false);

  let moku = $state<MokuCanvas>();
  let ready = $state(false);
  let input = $state('');
  let listEl = $state<HTMLDivElement>();
  let status = $state('');

  // The dialogue box: a line of Moku-san's own, typed out, or the reply as it arrives.
  let say = $state<{ mode: 'line' | 'reply' | 'thinking'; text: string }>({ mode: 'line', text: '' });
  // The whole of each line or reply, once, for screen readers; the box itself types out.
  let announce = $state('');
  let mood = $state<MokuExpression>('netral');
  let cursor = $state<'pointer' | 'default'>('default');

  let typer: ReturnType<typeof setInterval> | undefined;
  let moodTimer: ReturnType<typeof setTimeout> | undefined;
  let greetTimer: ReturnType<typeof setTimeout> | undefined;
  let pokeTimer: ReturnType<typeof setTimeout> | undefined;
  let pokes = 0;
  let lastLine: Line | undefined;
  const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Moku-san's face for `seconds`, then back to netral; the chips follow it. */
  function feel(name: MokuExpression, seconds: number) {
    mood = name;
    moku?.hold(name, seconds);
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => (mood = 'netral'), seconds * 1000);
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

  function gesture(name: keyof typeof GESTURES) {
    moku?.play(name);
    speak(GESTURES[name].line);
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

  function showExpression(name: MokuExpression) {
    speak({ text: EXPRESSION_LINES[name].text, expression: name });
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
    status = officeStatus();
    const clock = setInterval(() => (status = officeStatus()), 60_000);
    greetTimer = setTimeout(() => speak($messages.length ? WELCOME_BACK : GREETING), 700);
    scrollLog();
    return () => clearInterval(clock);
  });

  onDestroy(() => {
    clearInterval(typer);
    clearTimeout(moodTimer);
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
  <meta property="og:image" content={absoluteUrl('/moku/moku-og.jpg?v=1')} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={absoluteUrl('/moku/moku-og.jpg?v=1')} />
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
          <h1 id="moku-title">Moku-san</h1>
          <p>Asisten AI Mokultur. Pekerja kantoran, penggemar Frieren dan anime action, tsundere akut.</p>
        </div>
        {#if status}
          <span class="moku-status"><span class="moku-status__dot" aria-hidden="true"></span>{status}</span>
        {/if}
      </header>

      <div class="moku-scene-wrap">
        <!-- Taps here are a bonus; the Colek button below does the same from the keyboard. -->
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

      <div class="moku-controls">
        <div class="moku-gestures" role="group" aria-label="Gerakan Moku-san">
          {#each Object.entries(GESTURES) as [name, g] (name)}
            <button type="button" class="theme-btn theme-btn--ghost theme-btn--sm" onclick={() => gesture(name as keyof typeof GESTURES)} disabled={$busy}>
              <i class="bi {g.icon}" aria-hidden="true"></i>{g.label}
            </button>
          {/each}
          <button type="button" class="theme-btn theme-btn--ghost theme-btn--sm" onclick={() => poke('body')} disabled={$busy}>
            <i class="bi bi-hand-index" aria-hidden="true"></i>Colek
          </button>
        </div>
        <div class="moku-moods" role="group" aria-label="Ekspresi Moku-san">
          {#each MOKU_EXPRESSIONS as name (name)}
            <button type="button" class="moku-mood" class:is-active={mood === name} aria-pressed={mood === name} onclick={() => showExpression(name)} disabled={$busy}>
              {EXPRESSION_LINES[name].label}
            </button>
          {/each}
        </div>
        <p class="moku-controls__hint">
          <i class="bi bi-hand-index-thumb" aria-hidden="true"></i>
          {ready ? 'Ketuk kepala atau badan Moku-san buat nyolek. Matanya ikut gerakan kursormu.' : 'Ketuk Moku-san buat nyolek.'}
        </p>
      </div>
    </section>

    <section class="moku-chat" aria-labelledby="moku-chat-title">
      <header class="moku-chat__head">
        <img src={AVATAR_POSTER} alt="" width="40" height="40" />
        <div>
          <h2 id="moku-chat-title">Ngobrol sama Moku-san</h2>
          <p>Jawabannya dari AI, bisa keliru.</p>
        </div>
        {#if $messages.length}
          <button type="button" class="moku-chat__reset" onclick={restart} title="Mulai obrolan baru" aria-label="Mulai obrolan baru" disabled={$busy}>
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          </button>
        {/if}
      </header>

      <div class="moku-log" bind:this={listEl}>
        {#if !$messages.length}
          <p class="moku-log__empty">
            {chatOn ? 'Belum ada obrolan. Pilih topik di bawah atau tulis pertanyaanmu sendiri.' : 'Moku-san lagi cuti: chat sedang dimatikan. Kamu masih bisa nyolek dan lihat ekspresinya.'}
          </p>
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

      {#if chatOn}
        <div class="moku-prompts" role="group" aria-label="Topik cepat">
          {#each PROMPTS as prompt (prompt)}
            <button type="button" class="moku-prompt" onclick={() => ask(prompt)} disabled={$busy}>{prompt}</button>
          {/each}
        </div>
      {/if}

      <form class="moku-form" onsubmit={onSubmit}>
        <label class="visually-hidden" for="moku-input">Pesan untuk Moku-san</label>
        <input
          id="moku-input"
          type="text"
          bind:value={input}
          placeholder={chatOn ? 'Tanya Moku-san…' : 'Chat sedang dimatikan'}
          maxlength="1000"
          autocomplete="off"
          enterkeyhint="send"
          disabled={$busy || !chatOn}
        />
        <button type="submit" aria-label="Kirim" disabled={$busy || !chatOn || !input.trim()}><i class="bi bi-send-fill" aria-hidden="true"></i></button>
      </form>
    </section>
  </div>

  <section class="moku-about" aria-labelledby="moku-about-title">
    <SectionHead title="Kenalan sama Moku-san" sub="Profil singkat rekan kerja paling gengsian di Mokultur." headingId="moku-about-title" />
    <div class="moku-about__grid">
      <article class="moku-id" aria-label="Kartu pegawai Moku-san">
        <div class="moku-id__band">
          <span>Mokultur</span>
          <span>Be The Cultured!</span>
        </div>
        <div class="moku-id__body">
          <img src={AVATAR_POSTER} alt="Moku-san" width="96" height="96" />
          <div>
            <p class="moku-id__name">Moku-san</p>
            <p class="moku-id__role">Penjawab pertanyaan pengunjung</p>
          </div>
        </div>
        <dl class="moku-id__facts">
          <div><dt>Divisi</dt><dd>Meja Tanya Mokultur</dd></div>
          <div><dt>Jam kerja</dt><dd>Kapan pun kamu buka chat. Lembur terus, pokoknya.</dd></div>
          <div><dt>Suka</dt><dd>Frieren: Beyond Journey's End, anime action, kopi pantry</dd></div>
          <div><dt>Sifat</dt><dd>Tsundere akut. Jangan dipuji, nanti salah tingkah.</dd></div>
        </dl>
      </article>

      <div class="moku-how">
        <h3>Biar ngobrolnya lancar</h3>
        <ul>
          <li><i class="bi bi-chat-dots" aria-hidden="true"></i><span><strong>Tanya soal Mokultur.</strong> Artikel, kategori, event, talent, media partner, sampai kontak. Moku-san menjawab dari data Mokultur, lengkap dengan tautannya.</span></li>
          <li><i class="bi bi-hand-index" aria-hidden="true"></i><span><strong>Colek dan sapa.</strong> Ketuk Moku-san atau pakai tombol Sapa, Angguk, dan Finger heart. Yang ini tidak dihitung sebagai pesan.</span></li>
          <li><i class="bi bi-emoji-smile" aria-hidden="true"></i><span><strong>Lihat semua ekspresinya.</strong> Dua belas wajah, dari tsundere sampai lega. Saat menjawab, ekspresinya ikut isi jawaban.</span></li>
          <li><i class="bi bi-arrow-left-right" aria-hidden="true"></i><span><strong>Obrolannya nyambung.</strong> Chat di pojok kanan bawah dan halaman ini memakai obrolan yang sama, dan hilang saat tab ditutup.</span></li>
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

    p {
      max-width: 44ch;
      margin: 0.4rem 0 0;
      color: rgba(255, 255, 255, 0.78);
      line-height: 1.55;
    }

    @media (min-width: 768px) {
      padding: 2rem 2rem 0;
    }
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

  .moku-status__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  }

  .moku-scene-wrap {
    position: relative;
    margin-top: 0.5rem;
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

  .moku-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.1rem 1.5rem 1.5rem;

    @media (min-width: 768px) {
      padding: 1.25rem 2rem 1.75rem;
    }
  }

  .moku-gestures {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .theme-btn { min-height: 44px; }
    .theme-btn:disabled { opacity: 0.5; transform: none; cursor: not-allowed; }
  }

  // One scrolling row on phones, wrapped on wider screens.
  .moku-moods {
    display: flex;
    gap: 0.4rem;
    margin: 0 -1.5rem;
    padding: 0.1rem 1.5rem 0.35rem;
    overflow-x: auto;
    scrollbar-width: none;
    scroll-snap-type: x proximity;

    &::-webkit-scrollbar { display: none; }

    @media (min-width: 768px) {
      flex-wrap: wrap;
      margin: 0;
      padding: 0;
      overflow: visible;
    }
  }

  .moku-mood {
    flex-shrink: 0;
    min-height: 44px;
    padding: 0 0.95rem;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    background: transparent;
    color: rgba(255, 255, 255, 0.88);
    font-size: 0.85rem;
    font-weight: 700;
    scroll-snap-align: start;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease, border-color 160ms ease;

    &:hover { border-color: rgba(255, 255, 255, 0.6); color: #fff; }
    &.is-active {
      border-color: var(--site-primary, #f1ff32);
      background: var(--site-primary, #f1ff32);
      color: var(--site-primary-contrast, #0d0d0d);
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

    @media (min-width: 768px) {
      min-height: 38px;
    }
  }

  .moku-controls__hint {
    display: flex;
    gap: 0.45rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.66);
    font-size: 0.82rem;
    line-height: 1.45;
  }

  // ---- Chat card ----
  .moku-chat {
    display: flex;
    flex-direction: column;
    min-width: 0;
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
      margin: 0.1rem 0 0;
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

  .moku-log__empty {
    margin: auto 0;
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.55;
    text-align: center;
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

  // One scrolling row on phones; wrapped where there is room to see them all.
  .moku-prompts {
    display: flex;
    gap: 0.4rem;
    padding: 0.75rem 1.1rem 0;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }

    @media (min-width: 992px) {
      flex-wrap: wrap;
      overflow: visible;
    }
  }

  .moku-prompt {
    flex-shrink: 0;
    min-height: 40px;
    padding: 0 0.9rem;
    border: 1px solid #e5e5e5;
    border-radius: 999px;
    background: #fff;
    color: #1a1a1a;
    font-size: 0.82rem;
    font-weight: 700;
    white-space: nowrap;
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
    margin: 0.75rem 1.1rem 1.1rem;
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

  .moku-how {
    h3 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    ul {
      display: grid;
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      gap: 0.85rem;
      line-height: 1.6;
    }

    i {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--site-primary, #f1ff32) 30%, #fff);
      color: #1a1a1a;
      font-size: 1.05rem;
    }

    strong { font-weight: 800; }
  }
</style>
