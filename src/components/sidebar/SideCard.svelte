<script lang="ts">
  /**
   * The frame every sidebar card shares: heading, optional lead, content, and
   * an optional footer. 'dark' is the house gradient panel for the one card
   * on a page that should pull the eye.
   */
  export let title: string;
  export let headingId: string;
  export let lead: string | null = null;
  export let tone: 'light' | 'dark' = 'light';
</script>

<section class="side-card" class:side-card--dark={tone === 'dark'} aria-labelledby={headingId}>
  <h2 id={headingId} class="side-card__title">{title}</h2>
  {#if lead}<p class="side-card__lead">{lead}</p>{/if}
  <div class="side-card__body"><slot /></div>
  {#if $$slots.footer}<div class="side-card__footer"><slot name="footer" /></div>{/if}
</section>

<style>
  .side-card { margin-bottom: 1.5rem; padding: 1.25rem; border: 1px solid #ececec; border-radius: 18px; background: #fff; color: #111; }
  .side-card__title { margin: 0; color: inherit; font-size: 1.0625rem; font-weight: 800; letter-spacing: -0.01em; }
  .side-card__lead { margin: 0.3rem 0 0; color: #6b7280; font-size: 0.8125rem; line-height: 1.5; }
  .side-card__body { margin-top: 0.9rem; }
  .side-card__footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 1rem; }

  .side-card--dark {
    border-color: transparent;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 65%, transparent), transparent 45%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a), #101827 55%, #1f2937);
  }
  .side-card--dark .side-card__lead { color: rgba(255, 255, 255, 0.75); }
  .side-card--dark .side-card__footer { padding-top: 0.85rem; border-top: 1px solid rgba(255, 255, 255, 0.12); }
</style>
