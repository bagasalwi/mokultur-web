<script lang="ts">
  export let url: string;
  export let title: string;
  export let compact = false;

  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  $: encodedUrl = encodeURIComponent(url);
  $: encodedTitle = encodeURIComponent(title);

  async function share() {
    // navigator.share only exists on secure origins and mostly on mobile; the
    // copy fallback below is what desktop users actually get.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the sheet — fall through to copying.
      }
    }
    await copyLink();
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
</script>

<div class="share" class:share--compact={compact}>
  {#if !compact}<span class="share__label">Bagikan</span>{/if}

  <button type="button" class="share__btn" on:click={share} aria-label="Bagikan">
    <i class="bi bi-share-fill"></i>
  </button>

  <a
    class="share__btn share__btn--wa"
    href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
    target="_blank"
    rel="noopener"
    aria-label="Bagikan ke WhatsApp"
  >
    <i class="bi bi-whatsapp"></i>
  </a>

  <a
    class="share__btn share__btn--x"
    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
    target="_blank"
    rel="noopener"
    aria-label="Bagikan ke X"
  >
    <i class="bi bi-twitter-x"></i>
  </a>

  <a
    class="share__btn share__btn--fb"
    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
    target="_blank"
    rel="noopener"
    aria-label="Bagikan ke Facebook"
  >
    <i class="bi bi-facebook"></i>
  </a>

  <button type="button" class="share__btn" on:click={copyLink} aria-label="Salin tautan">
    <i class="bi {copied ? 'bi-check-lg' : 'bi-link-45deg'}"></i>
  </button>

  {#if copied}<span class="share__copied" role="status">Tautan disalin</span>{/if}
</div>

<style>
  .share {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .share__label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--bs-secondary-color, #6c757d);
  }

  .share__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: 0.9rem;
    line-height: 1;
    text-decoration: none;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  /* The icon takes the primary colour's contrast pair, not plain white: the
     site primary is a bright yellow, and white-on-yellow left the glyph
     invisible on hover. */
  .share__btn:hover {
    background: var(--site-primary, #55ad9b);
    border-color: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #000);
  }

  .share--compact .share__btn {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.8rem;
  }

  .share__copied {
    font-size: 0.8rem;
    color: var(--site-primary, #55ad9b);
  }
</style>
