<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  /** Page URL being shared. Absolute, so the copied link works off-site. */
  export let url: string;
  export let title = '';
  /** Lets each page match the sheet's trigger to its own button row. */
  export let triggerClass = 'theme-btn theme-btn--surface theme-btn--sm';
  export let triggerLabel = 'Bagikan';

  let open = false;
  let copied = false;
  let dialog: HTMLDivElement | undefined;
  let copyTimer: ReturnType<typeof setTimeout>;

  $: encUrl = encodeURIComponent(url);
  $: encText = encodeURIComponent(`${title ? `${title} ` : ''}${url}`);

  function show() {
    open = true;
    // Stops the page scrolling behind the dialog on mobile.
    document.body.style.overflow = 'hidden';
    // Wait a tick so the node exists before focusing it.
    queueMicrotask(() => dialog?.focus());
  }

  function close() {
    open = false;
    document.body.style.overflow = '';
  }

  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') close();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 2000);
    } catch {
      copied = false;
    }
  }

  /**
   * Native share sheet where the browser offers one (mostly mobile); the
   * dialog's own options are the fallback everywhere else.
   */
  async function nativeShare() {
    if (!canNativeShare) return;
    try {
      await navigator.share({ title, url });
      close();
    } catch {
      // Sheet dismissed — leave the dialog open so the other options remain.
    }
  }

  /**
   * Resolved on the client only. The component server-renders, where there is
   * no `navigator`; testing it in the template would also run during SSR, and
   * `navigator.share` is typed as always-present so a truthiness check does not
   * narrow anything.
   */
  let canNativeShare = false;
  onMount(() => {
    canNativeShare = typeof navigator.share === 'function';
  });

  // The dialog can be torn down while open (navigation), which would otherwise
  // leave the page permanently unscrollable.
  onDestroy(() => {
    clearTimeout(copyTimer);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  });
</script>

<svelte:window on:keydown={onKeydown} />

<button type="button" class={triggerClass} on:click={show}>
  <i class="bi bi-share-fill"></i> <span>{triggerLabel}</span>
</button>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="sheet" on:click={close}>
    <div
      class="sheet__panel"
      role="dialog"
      aria-modal="true"
      aria-label="Bagikan"
      tabindex="-1"
      bind:this={dialog}
      on:click|stopPropagation
    >
      <div class="sheet__head">
        <h2 class="sheet__title">Bagikan</h2>
        <button type="button" class="sheet__close" on:click={close} aria-label="Tutup">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Page-specific extras (e.g. the anime image downloads) go above the links. -->
      <slot name="extra" {close} />

      <p class="sheet__label">Bagikan tautan</p>
      <div class="sheet__links">
        {#if canNativeShare}
          <button type="button" class="sheet__link" on:click={nativeShare}>
            <i class="bi bi-share-fill"></i> Lainnya
          </button>
        {/if}
        <button type="button" class="sheet__link" on:click={copyLink}>
          <i class="bi {copied ? 'bi-check-lg' : 'bi-link-45deg'}"></i>
          {copied ? 'Tersalin' : 'Salin link'}
        </button>
        <a class="sheet__link" href={`https://wa.me/?text=${encText}`} target="_blank" rel="noopener">
          <i class="bi bi-whatsapp" style="color:#25d366"></i> WhatsApp
        </a>
        <a class="sheet__link" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encUrl}`} target="_blank" rel="noopener">
          <i class="bi bi-twitter-x"></i> X
        </a>
        <a class="sheet__link" href={`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`} target="_blank" rel="noopener">
          <i class="bi bi-facebook" style="color:#1877f2"></i> Facebook
        </a>
      </div>
    </div>
  </div>
{/if}

<style>
  .sheet {
    position: fixed;
    inset: 0;
    z-index: 1080;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
  }

  .sheet__panel {
    width: min(420px, 100%);
    padding: 1.25rem;
    border-radius: 1rem;
    background: var(--bs-body-bg, #fff);
    /*
     * Stated explicitly, not inherited.
     *
     * The dialog renders in place rather than portalled to <body>, so it picks
     * up the colour of whatever contains its trigger. Opened from a button
     * inside a dark hero, every label here — which uses `color: inherit` —
     * turned white on the panel's white background and vanished.
     */
    color: var(--bs-body-color, #212529);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    outline: none;
  }

  .sheet__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .sheet__title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .sheet__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.06);
    color: inherit;
  }

  .sheet__close:hover {
    background: rgba(0, 0, 0, 0.12);
  }

  .sheet__label {
    margin: 0 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--bs-secondary-color, #6c757d);
  }

  .sheet__links {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .sheet__link {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    padding: 0.55rem 0.6rem;
    border: 0;
    border-radius: 0.5rem;
    background: transparent;
    color: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    text-align: left;
    text-decoration: none;
  }

  .sheet__link:hover {
    background: rgba(0, 0, 0, 0.05);
    color: inherit;
  }

  @media (max-width: 575.98px) {
    .sheet {
      align-items: flex-end;
      padding: 0;
    }

    .sheet__panel {
      width: 100%;
      border-radius: 1rem 1rem 0 0;
    }
  }
</style>
