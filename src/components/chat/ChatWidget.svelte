<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { renderMarkdown } from '$lib/chat/markdown';
  import { stripExpressionTags } from '$lib/chat/expressions';
  import { busy, chatError, messages, resetChat, restoreChat, sendChat } from '$lib/chat/session';
  import { AVATAR_FRAME, AVATAR_POSTER } from '$lib/moku/frames';
  import MokuCanvas from '$components/moku/MokuCanvas.svelte';

  /**
   * Copy comes from the AI settings tab. The literals below are the values that
   * shipped before it existed, so an unfilled field changes nothing.
   */
  export let title: string | null = null;
  export let greeting: string | null = null;
  export let placeholder: string | null = null;
  /** One suggestion per line; blank hides the chips entirely. */
  export let suggestions: string | null = null;

  $: panelTitle = title?.trim() || 'Tanya Mokultur';
  $: welcomeText =
    greeting?.trim() ||
    'Hai! Aku bisa bantu kamu cari tahu soal Mokultur — artikel, kategori, media partner, Instagram, sampai kontak.';
  $: inputPlaceholder = placeholder?.trim() || 'Tanya soal Mokultur...';
  $: SUGGESTIONS = (suggestions ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let open = false;
  // The panel stays in the page once opened, hidden while closed, so Moku-san is not loaded again on every open.
  let opened = false;
  let moku: MokuCanvas | undefined;
  let input = '';
  let listEl: HTMLDivElement;
  let inputEl: HTMLInputElement;

  // A word from Moku-san beside the button, once per visit, a few seconds in.
  const NUDGE_KEY = 'mokultur_moku_nudged';
  let nudge = false;
  let nudgeTimers: ReturnType<typeof setTimeout>[] = [];

  onMount(() => {
    restoreChat();
    let nudged = true;
    try {
      nudged = sessionStorage.getItem(NUDGE_KEY) === '1';
    } catch {
      /* storage blocked: stay quiet */
    }
    if (nudged || $messages.length) return;
    nudgeTimers = [
      setTimeout(() => {
        if (open) return;
        nudge = true;
        try { sessionStorage.setItem(NUDGE_KEY, '1'); } catch { /* storage blocked */ }
      }, 4000),
      setTimeout(() => (nudge = false), 13000),
    ];
  });

  onDestroy(() => nudgeTimers.forEach(clearTimeout));

  async function scrollToBottom() {
    await tick();
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
  }

  async function toggle() {
    open = !open;
    nudge = false;
    if (open) {
      opened = true;
      await scrollToBottom();
      inputEl?.focus();
    }
  }

  function reset() {
    resetChat();
    moku?.express('netral');
  }

  function send(text: string) {
    if (!text.trim() || $busy) return;
    input = '';
    scrollToBottom();
    void sendChat(text, {
      onWaiting: () => moku?.hold('berpikir', 30),
      onExpression: (name) => moku?.express(name),
      onText: (_, first) => {
        if (first) moku?.play('Nod');
        moku?.talk(0.5);
        scrollToBottom();
      },
      // The reply's face stays a while, longer for a longer answer, then Moku-san relaxes.
      onDone: (expression, reply) => moku?.hold(expression, Math.min(8, 2 + reply.length * 0.04)),
      onError: () => moku?.hold('sedih', 3),
    }).then(scrollToBottom);
  }

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    send(input);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false;
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="mchat">
  {#if opened}
    <div class="mchat__panel" role="dialog" aria-label="Chat dengan Moku-san" hidden={!open}>
      <header class="mchat__head">
        <div class="mchat__head-title">
          <span class="mchat__avatar">
            <MokuCanvas bind:this={moku} frame={AVATAR_FRAME} poster={AVATAR_POSTER} active={open} />
          </span>
          <div class="mchat__head-text">
            <strong>{panelTitle}</strong>
            <small><span class="mchat__dot" aria-hidden="true"></span>Asisten pribadi Mokultur</small>
          </div>
        </div>
        <div class="mchat__head-actions">
          {#if $messages.length > 0}
            <button type="button" class="mchat__icon-btn" on:click={reset} title="Mulai obrolan baru" aria-label="Mulai obrolan baru">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          {/if}
          <a href="/moku" class="mchat__icon-btn" on:click={() => (open = false)} title="Buka halaman Moku-san" aria-label="Buka halaman Moku-san">
            <i class="bi bi-arrows-angle-expand"></i>
          </a>
          <button type="button" class="mchat__icon-btn" on:click={toggle} title="Tutup" aria-label="Tutup chat">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </header>

      <div class="mchat__body" bind:this={listEl}>
        {#if $messages.length === 0}
          <div class="mchat__welcome">
            <p class="mchat__welcome-text">{welcomeText}</p>
            {#if SUGGESTIONS.length > 0}
              <div class="mchat__suggestions">
                {#each SUGGESTIONS as s}
                  <button type="button" class="mchat__chip" on:click={() => send(s)}>{s}</button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#each $messages as m, i}
          <div class="mchat__msg mchat__msg--{m.role}">
            {#if m.role === 'assistant'}
              {#if m.content}
                <div class="mchat__bubble mchat__bubble--bot">{@html renderMarkdown(stripExpressionTags(m.content))}</div>
              {:else if $busy && i === $messages.length - 1}
                <div class="mchat__bubble mchat__bubble--bot mchat__typing" aria-label="Sedang mengetik">
                  <span></span><span></span><span></span>
                </div>
              {/if}
            {:else}
              <div class="mchat__bubble mchat__bubble--user">{m.content}</div>
            {/if}
          </div>
        {/each}

        {#if $chatError}
          <div class="mchat__error">{$chatError}</div>
        {/if}
      </div>

      <form class="mchat__form" on:submit={onSubmit}>
        <input
          bind:this={inputEl}
          bind:value={input}
          type="text"
          class="mchat__input"
          placeholder={inputPlaceholder}
          maxlength="1000"
          autocomplete="off"
          disabled={$busy}
        />
        <button type="submit" class="mchat__send" disabled={$busy || !input.trim()} aria-label="Kirim">
          <i class="bi bi-send-fill"></i>
        </button>
      </form>
      <p class="mchat__note">Jawaban Moku-san bisa keliru. Cek lagi info yang penting, ya.</p>
    </div>
  {/if}

  {#if nudge && !open}
    <div class="mchat__nudge" role="status">
      <button type="button" class="mchat__nudge-text" on:click={toggle}>Butuh bantuan? Tanya aja. B-bukan karena aku nungguin, ya!</button>
      <button type="button" class="mchat__nudge-close" on:click={() => (nudge = false)} aria-label="Tutup sapaan"><i class="bi bi-x-lg"></i></button>
    </div>
  {/if}

  <button
    type="button"
    class="mchat__fab"
    class:mchat__fab--open={open}
    on:click={toggle}
    aria-label={open ? 'Tutup chat' : 'Buka chat dengan Moku-san'}
    aria-expanded={open}
  >
    {#if open}
      <i class="bi bi-x-lg"></i>
    {:else}
      <!-- Moku-san's head over the rim of the button; the blink frame flashes in now and then. -->
      <span class="mchat__fab-moku" aria-hidden="true">
        <img src="/moku/moku-fab.png?v=1" alt="" width="60" height="80" />
        <img class="mchat__fab-blink" src="/moku/moku-fab-blink.png?v=1" alt="" width="60" height="80" />
      </span>
    {/if}
  </button>
</div>

<style>
  .mchat {
    position: fixed;
    right: 1.25rem;
    /* --app-bottom-nav is set on <body> by any screen with a fixed bottom bar
       (currently the dashboard on mobile). Without it the bar covers the
       floating button. Defaults to 0 everywhere else. */
    bottom: calc(1.25rem + var(--app-bottom-nav, 0px));
    z-index: 1050;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }

  /* ---- Floating button: Moku-san over the rim ---- */
  .mchat__fab {
    position: relative;
    width: 60px;
    height: 60px;
    /* The head rises above the circle; this keeps it inside the click target. */
    margin-top: 20px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #0d0d0d);
    font-size: 1.4rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    transition: transform 180ms ease, box-shadow 180ms ease;
    flex-shrink: 0;
  }

  .mchat__fab::before {
    content: '';
    position: absolute;
    inset: -20px 0 0;
  }

  .mchat__fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.3);
  }

  .mchat__fab:focus-visible {
    outline: 3px solid var(--site-dark, #0d0d0d);
    outline-offset: 3px;
  }

  .mchat__fab--open {
    margin-top: 20px;
    background: #0d0d0d;
    color: #fff;
  }

  /*
   * The head is a still cut to the button's width, 20px taller than it. The
   * mask shows everything above the circle's centre line plus the circle
   * itself, so the hair and face rise over the rim while the shoulders stay
   * inside the button.
   */
  .mchat__fab-moku {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 60px;
    height: 80px;
    -webkit-mask:
      radial-gradient(circle 30px at 50% calc(100% - 30px), #000 99%, transparent 100%),
      linear-gradient(#000, #000) top / 100% calc(100% - 30px) no-repeat;
    mask:
      radial-gradient(circle 30px at 50% calc(100% - 30px), #000 99%, transparent 100%),
      linear-gradient(#000, #000) top / 100% calc(100% - 30px) no-repeat;
    transition: transform 180ms ease;
    pointer-events: none;
  }

  .mchat__fab-moku img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .mchat__fab:hover .mchat__fab-moku {
    transform: translateY(-2px) rotate(-3deg);
  }

  .mchat__fab-blink {
    opacity: 0;
    animation: mchat-blink 5.2s steps(1, end) infinite;
  }

  @keyframes mchat-blink {
    0%, 95% { opacity: 0; }
    96%, 98% { opacity: 1; }
    99%, 100% { opacity: 0; }
  }

  /* ---- Moku-san's hello beside the button ---- */
  .mchat__nudge {
    position: relative;
    display: flex;
    align-items: flex-start;
    max-width: 236px;
    margin-right: 0.25rem;
    border: 1px solid #e5e5e5;
    border-radius: 14px 14px 4px 14px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    animation: mchat-in 240ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .mchat__nudge-text {
    padding: 0.6rem 0.25rem 0.6rem 0.8rem;
    border: 0;
    background: none;
    color: #1a1a1a;
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.4;
    text-align: left;
    cursor: pointer;
  }

  .mchat__nudge-close {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    margin: 0.2rem 0.2rem 0 0;
    border: 0;
    border-radius: 8px;
    background: none;
    color: #6b7280;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .mchat__nudge-close:hover {
    background: #f3f4f6;
    color: #1a1a1a;
  }

  /* ---- Header avatar ---- */
  .mchat__avatar {
    display: block;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    overflow: hidden;
    border: 2px solid var(--site-primary, #f1ff32);
    border-radius: 12px;
    background: var(--site-primary, #f1ff32);
  }

  /* ---- Panel ---- */
  .mchat__panel {
    width: 380px;
    max-width: calc(100vw - 2.5rem);
    height: 520px;
    max-height: calc(100vh - 7rem);
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: mchat-in 200ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  @keyframes mchat-in {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .mchat__panel[hidden] {
    display: none;
  }

  .mchat__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem 0.6rem 0.6rem;
    background: #0d0d0d;
    color: #fff;
    flex-shrink: 0;
  }

  .mchat__head-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
    font-size: 0.95rem;
  }

  .mchat__head-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    line-height: 1.2;
  }

  .mchat__head-text small {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: rgba(255, 255, 255, 0.68);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .mchat__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
  }

  .mchat__head-actions {
    display: flex;
    gap: 0.15rem;
  }

  .mchat__icon-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    width: 30px;
    height: 30px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  a.mchat__icon-btn {
    text-decoration: none;
  }

  .mchat__icon-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .mchat__body {
    flex: 1;
    overflow-y: auto;
    padding: 0.9rem;
    background: #f7f7f8;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .mchat__welcome-text {
    font-size: 0.85rem;
    color: #4b5563;
    margin: 0 0 0.6rem;
    line-height: 1.5;
  }

  .mchat__suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .mchat__chip {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    font-size: 0.78rem;
    cursor: pointer;
    color: #111827;
    text-align: left;
  }

  .mchat__chip:hover {
    border-color: #0d0d0d;
  }

  .mchat__msg {
    display: flex;
  }

  .mchat__msg--user {
    justify-content: flex-end;
  }

  .mchat__bubble {
    max-width: 85%;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  .mchat__bubble--user {
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #0d0d0d);
    border-bottom-right-radius: 4px;
    white-space: pre-wrap;
  }

  .mchat__bubble--bot {
    background: #fff;
    color: #111827;
    border: 1px solid #ececf0;
    border-bottom-left-radius: 4px;
  }

  .mchat__bubble--bot :global(p) {
    margin: 0 0 0.5rem;
  }

  .mchat__bubble--bot :global(p:last-child) {
    margin-bottom: 0;
  }

  .mchat__bubble--bot :global(ul),
  .mchat__bubble--bot :global(ol) {
    margin: 0 0 0.5rem;
    padding-left: 1.1rem;
  }

  .mchat__bubble--bot :global(li) {
    margin-bottom: 0.2rem;
  }

  .mchat__bubble--bot :global(a) {
    color: #0d6efd;
    text-decoration: underline;
  }

  .mchat__bubble--bot :global(code) {
    background: #f3f4f6;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-size: 0.8em;
  }

  .mchat__typing {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0.7rem 0.75rem;
  }

  .mchat__typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9ca3af;
    animation: mchat-blink 1.2s infinite ease-in-out;
  }

  .mchat__typing span:nth-child(2) {
    animation-delay: 0.15s;
  }

  .mchat__typing span:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes mchat-blink {
    0%,
    80%,
    100% {
      opacity: 0.3;
    }
    40% {
      opacity: 1;
    }
  }

  .mchat__error {
    font-size: 0.78rem;
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 0.45rem 0.6rem;
  }

  .mchat__form {
    display: flex;
    gap: 0.4rem;
    padding: 0.6rem 0.6rem 0.35rem;
    background: #fff;
    border-top: 1px solid #ececf0;
    flex-shrink: 0;
  }

  .mchat__note {
    flex-shrink: 0;
    margin: 0;
    padding: 0 0.75rem 0.5rem;
    background: #fff;
    color: #6b7280;
    font-size: 0.7rem;
    text-align: center;
  }

  .mchat__input {
    flex: 1;
    min-width: 0;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    padding: 0.5rem 0.85rem;
    font-size: 0.85rem;
    outline: none;
  }

  .mchat__input:focus {
    border-color: #0d0d0d;
  }

  .mchat__send {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background: #0d0d0d;
    color: #fff;
    cursor: pointer;
    flex-shrink: 0;
    font-size: 0.8rem;
  }

  .mchat__send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 575px) {
    .mchat {
      right: 0.85rem;
      /* Must repeat the offset: this rule overrides the base `bottom`, and
         dropping the variable here put the button back under the bottom bar. */
      bottom: calc(0.85rem + var(--app-bottom-nav, 0px));
    }

    .mchat__panel {
      width: calc(100vw - 1.7rem);
      height: min(70vh, 520px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mchat__panel {
      animation: none;
    }

    .mchat__fab {
      transition: none;
    }

    .mchat__fab:hover,
    .mchat__fab:hover .mchat__fab-moku {
      transform: none;
    }

    .mchat__fab-blink,
    .mchat__nudge {
      animation: none;
    }

    .mchat__typing span {
      animation: none;
      opacity: 0.6;
    }
  }
</style>
