<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { renderMarkdown } from '$lib/chat/markdown';

  interface Msg {
    role: 'user' | 'assistant';
    content: string;
  }

  const STORAGE_KEY = 'mokultur_chat';
  const SUGGESTIONS = [
    'Apa itu Mokultur?',
    'Artikel terbaru soal anime?',
    'Cara jadi media partner?',
    'Gimana cara kontak Mokultur?',
  ];

  let open = false;
  let messages: Msg[] = [];
  let input = '';
  let busy = false;
  let errorText = '';
  let listEl: HTMLDivElement;
  let inputEl: HTMLInputElement;

  onMount(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) messages = JSON.parse(raw);
    } catch {
      messages = [];
    }
  });

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // storage penuh atau diblokir — abaikan, chat tetap jalan
    }
  }

  async function scrollToBottom() {
    await tick();
    if (listEl) listEl.scrollTop = listEl.scrollHeight;
  }

  async function toggle() {
    open = !open;
    if (open) {
      await scrollToBottom();
      inputEl?.focus();
    }
  }

  function reset() {
    messages = [];
    errorText = '';
    persist();
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    errorText = '';
    input = '';
    messages = [...messages, { role: 'user', content }, { role: 'assistant', content: '' }];
    busy = true;
    persist();
    scrollToBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.slice(0, -1) }),
      });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Kebanyakan pesan, coba lagi nanti ya.');
      }
      if (!res.ok || !res.body) {
        throw new Error('Lagi ada gangguan. Coba lagi sebentar lagi ya.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.delta) {
              const last = messages[messages.length - 1];
              last.content += parsed.delta;
              messages = messages;
              scrollToBottom();
            }
          } catch (e) {
            if (e instanceof Error && e.message && !e.message.startsWith('Unexpected')) throw e;
          }
        }
      }

      if (!messages[messages.length - 1].content.trim()) {
        messages[messages.length - 1].content = 'Maaf, aku belum bisa menjawab yang itu. Coba tanya lagi dengan kalimat lain ya.';
        messages = messages;
      }
    } catch (e) {
      messages = messages.slice(0, -1);
      errorText = e instanceof Error ? e.message : 'Ada yang salah. Coba lagi ya.';
    } finally {
      busy = false;
      persist();
      scrollToBottom();
    }
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
  {#if open}
    <div class="mchat__panel" role="dialog" aria-label="Chat Mokultur">
      <header class="mchat__head">
        <div class="mchat__head-title">
          <span class="mchat__dot" aria-hidden="true"></span>
          <strong>Tanya Mokultur</strong>
        </div>
        <div class="mchat__head-actions">
          {#if messages.length > 0}
            <button type="button" class="mchat__icon-btn" on:click={reset} title="Mulai obrolan baru" aria-label="Mulai obrolan baru">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          {/if}
          <button type="button" class="mchat__icon-btn" on:click={toggle} title="Tutup" aria-label="Tutup chat">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </header>

      <div class="mchat__body" bind:this={listEl}>
        {#if messages.length === 0}
          <div class="mchat__welcome">
            <p class="mchat__welcome-text">
              Hai! Aku bisa bantu kamu cari tahu soal Mokultur — artikel, kategori, media partner, Instagram, sampai kontak.
            </p>
            <div class="mchat__suggestions">
              {#each SUGGESTIONS as s}
                <button type="button" class="mchat__chip" on:click={() => send(s)}>{s}</button>
              {/each}
            </div>
          </div>
        {/if}

        {#each messages as m, i}
          <div class="mchat__msg mchat__msg--{m.role}">
            {#if m.role === 'assistant'}
              {#if m.content}
                <div class="mchat__bubble mchat__bubble--bot">{@html renderMarkdown(m.content)}</div>
              {:else if busy && i === messages.length - 1}
                <div class="mchat__bubble mchat__bubble--bot mchat__typing" aria-label="Sedang mengetik">
                  <span></span><span></span><span></span>
                </div>
              {/if}
            {:else}
              <div class="mchat__bubble mchat__bubble--user">{m.content}</div>
            {/if}
          </div>
        {/each}

        {#if errorText}
          <div class="mchat__error">{errorText}</div>
        {/if}
      </div>

      <form class="mchat__form" on:submit={onSubmit}>
        <input
          bind:this={inputEl}
          bind:value={input}
          type="text"
          class="mchat__input"
          placeholder="Tanya soal Mokultur..."
          maxlength="1000"
          autocomplete="off"
          disabled={busy}
        />
        <button type="submit" class="mchat__send" disabled={busy || !input.trim()} aria-label="Kirim">
          <i class="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  {/if}

  <button
    type="button"
    class="mchat__fab"
    class:mchat__fab--open={open}
    on:click={toggle}
    aria-label={open ? 'Tutup chat' : 'Buka chat Mokultur'}
    aria-expanded={open}
  >
    <i class="bi {open ? 'bi-x-lg' : 'bi-chat-dots-fill'}"></i>
  </button>
</div>

<style>
  .mchat {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 1050;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }

  /* ---- Floating button ---- */
  .mchat__fab {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
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

  .mchat__fab:hover {
    transform: scale(1.06);
    box-shadow: 0 8px 26px rgba(0, 0, 0, 0.32);
  }

  .mchat__fab--open {
    background: #0d0d0d;
    color: #fff;
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

  .mchat__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0.9rem;
    background: #0d0d0d;
    color: #fff;
    flex-shrink: 0;
  }

  .mchat__head-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
  }

  .mchat__dot {
    width: 8px;
    height: 8px;
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
    padding: 0.6rem;
    background: #fff;
    border-top: 1px solid #ececf0;
    flex-shrink: 0;
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
      bottom: 0.85rem;
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

    .mchat__fab:hover {
      transform: none;
    }

    .mchat__typing span {
      animation: none;
      opacity: 0.6;
    }
  }
</style>
