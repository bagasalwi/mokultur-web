<script lang="ts">
  export let score: number | null = null;
  export let size: 'xl' | 'lg' | 'sm' = 'lg';
  export let label = 'SKOR';
</script>

{#if score !== null}
  <div class="score score--{size}" aria-label={`Skor MyAnimeList ${score.toFixed(2)}`}>
    <span class="score__value">{score.toFixed(2)}</span>
    {#if size !== 'sm'}<span class="score__label">{label}</span>{/if}
  </div>
{/if}

<style>
  .score {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--site-primary, #55ad9b);
    color: var(--site-primary-contrast, #fff);
    border-radius: 0.75rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .score__value {
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .score__label {
    margin-top: 0.25rem;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    opacity: 0.85;
  }

  .score--xl {
    padding: 0.85rem 1.1rem;
    min-width: 6rem;
  }

  .score--xl .score__value {
    font-size: clamp(2.2rem, 5vw, 3.2rem);
  }

  .score--lg {
    padding: 0.6rem 0.9rem;
    min-width: 4.5rem;
  }

  .score--lg .score__value {
    font-size: 1.75rem;
  }

  .score--sm {
    padding: 0.25rem 0.45rem;
    border-radius: 0.45rem;
  }

  .score--sm .score__value {
    font-size: 0.95rem;
  }
</style>
