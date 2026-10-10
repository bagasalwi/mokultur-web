<script lang="ts">
  /**
   * The accented heading every anime listing already used — the same block of
   * CSS had been copied verbatim into AiringTodaySection and the /anime route.
   * Now that two of these sit side by side on the homepage, any drift between
   * the copies would be visible at a glance.
   */
  export let title: string;
  export let sub: string | null = null;
  export let headingId: string | undefined = undefined;
</script>

<div class="section-head" class:section-head--split={$$slots.action}>
  <div class="section-head__text">
    <h2 id={headingId} class="section-head__title">{title}</h2>
    {#if sub}<p class="section-head__sub">{sub}</p>{/if}
  </div>
  <slot name="action" />
</div>

<style>
  .section-head {
    /* When the homepage row aligns two of these on a shared grid row, the
       shorter one must sit at the top of that row rather than stretch to it. */
    align-self: start;
    margin-bottom: 1rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--site-primary, #55ad9b);
  }

  .section-head--split {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem;
    /* The action drops below the title in a narrow column instead of
       squeezing it — the homepage now renders one of these at 40% width. */
    flex-wrap: wrap;
  }

  .section-head__text {
    min-width: 0;
  }

  .section-head__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .section-head__sub {
    margin: 0.15rem 0 0;
    font-size: 0.85rem;
    color: var(--bs-secondary-color, #6c757d);
  }
</style>
