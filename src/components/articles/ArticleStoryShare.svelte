<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  /** Same-origin story.png for this article. */
  export let src: string;
  export let title = '';
  export let filename = 'mokultur-story.png';
  export let close: () => void = () => {};

  let file: File | null = null;
  let preview = '';
  let state: 'loading' | 'ready' | 'error' = 'loading';
  let canShareFile = false;
  let sharing = false;
  let message = '';

  /**
   * Fetched as soon as the sheet opens, not on tap: iOS only lets
   * `navigator.share` run inside the tap's own gesture, and a 1–2 s render
   * in between would cost that permission.
   */
  onMount(async () => {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      file = new File([blob], filename, { type: 'image/png' });
      preview = URL.createObjectURL(blob);
      canShareFile = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
      state = 'ready';
    } catch {
      state = 'error';
    }
  });

  onDestroy(() => {
    if (preview) URL.revokeObjectURL(preview);
  });

  async function share() {
    if (!file || sharing) return;
    sharing = true;
    message = '';
    try {
      await navigator.share({ files: [file], title });
      close();
    } catch (cause) {
      // Dismissing the system sheet is not an error worth reporting.
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        message = 'Tidak bisa membuka menu bagikan. Unduh gambarnya, lalu unggah dari Instagram.';
      }
    } finally {
      sharing = false;
    }
  }
</script>

<p class="story__label">Instagram Story</p>
<div class="story">
  <div class="story__preview" class:is-loading={state === 'loading'}>
    {#if state === 'ready'}
      <img src={preview} alt="Pratinjau story artikel" width="1080" height="1920" />
    {:else if state === 'error'}
      <i class="bi bi-image" aria-hidden="true"></i>
    {/if}
  </div>
  <div class="story__body">
    {#if state === 'error'}
      <p class="story__note" role="alert">Gambar story belum bisa dibuat. Coba lagi sebentar lagi.</p>
    {:else}
      {#if canShareFile}
        <button type="button" class="story__btn story__btn--primary" on:click={share} disabled={state !== 'ready' || sharing}>
          <i class="bi bi-instagram" aria-hidden="true"></i>
          {sharing ? 'Membuka…' : 'Bagikan ke Story'}
        </button>
      {/if}
      <a class="story__btn" class:story__btn--primary={!canShareFile} href={src} download={filename} aria-disabled={state !== 'ready'} on:click={close}>
        <i class="bi bi-download" aria-hidden="true"></i>
        {state === 'loading' ? 'Menyiapkan gambar…' : 'Unduh gambar'}
      </a>
      <p class="story__note">1080 × 1920 · Tambahkan stiker Link di Instagram lalu tempel tautan artikel.</p>
      {#if message}<p class="story__note story__note--error" role="alert">{message}</p>{/if}
    {/if}
  </div>
</div>

<style>
  /* Lives in the sheet's slot, so ShareSheet's scoped rules do not reach it. */
  .story__label {
    margin: 0 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--bs-secondary-color, #6c757d);
  }

  .story {
    display: flex;
    gap: 0.9rem;
    align-items: stretch;
    margin-bottom: 1.15rem;
    padding: 0.75rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 0.9rem;
  }

  .story__preview {
    flex: 0 0 84px;
    aspect-ratio: 9 / 16;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 0.6rem;
    background: #f0f0f0;
    color: #9ca3af;
  }

  .story__preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .story__preview.is-loading {
    background: linear-gradient(100deg, #f0f0f0 30%, #e6e6e6 50%, #f0f0f0 70%) 0 0 / 200% 100%;
    animation: story-shimmer 1.2s linear infinite;
  }

  .story__body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1;
  }

  .story__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 44px;
    padding: 0.55rem 0.9rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 999px;
    background: #fff;
    color: var(--site-dark, #111);
    font-size: 0.875rem;
    font-weight: 700;
    text-decoration: none;
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease;
  }

  .story__btn--primary {
    border-color: transparent;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
  }

  .story__btn:active { transform: scale(0.97); }
  .story__btn:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .story__btn:disabled,
  .story__btn[aria-disabled='true'] { opacity: 0.6; pointer-events: none; }

  .story__note {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--bs-secondary-color, #6c757d);
  }

  .story__note--error { color: #a32121; }

  @keyframes story-shimmer { to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .story__preview.is-loading { animation: none; } }
</style>
