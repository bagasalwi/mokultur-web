<script lang="ts">
  import { readerRequest, type ReaderInterest } from '$lib/reader';

  /**
   * "Ikuti topik": adds a category's interest to the reader's Untuk Kamu feed.
   * Guests get the same button as a link to the login modal.
   */
  export let interest: ReaderInterest;
  export let label: string;
  export let interests: ReaderInterest[] = [];
  export let loggedIn = false;
  export let returnTo = '/';
  /** 'solid' for light backgrounds, 'on-dark' for dark cards. */
  export let tone: 'solid' | 'on-dark' = 'solid';

  let busy = false;
  let error = '';
  $: followed = interests.includes(interest);

  async function toggle() {
    if (busy) return;
    busy = true;
    error = '';
    const next = followed ? interests.filter((id) => id !== interest) : [...interests, interest];
    try {
      const result = await readerRequest<{ data: ReaderInterest[] }>('interests', 'PUT', { interests: next });
      interests = result.data;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Belum tersimpan. Coba lagi.';
    } finally {
      busy = false;
    }
  }
</script>

<span class="follow">
  {#if loggedIn}
    <button
      type="button"
      class="theme-btn theme-btn--sm {followed ? 'theme-btn--see-all' : 'theme-btn--primary'}"
      class:theme-btn--on-dark={followed && tone === 'on-dark'}
      aria-pressed={followed}
      disabled={busy}
      on:click={toggle}
    >
      <i class="bi {followed ? 'bi-check2' : 'bi-plus-lg'}" aria-hidden="true"></i>
      {busy ? 'Menyimpan…' : followed ? 'Diikuti' : 'Ikuti topik'}
    </button>
  {:else}
    <a class="theme-btn theme-btn--primary theme-btn--sm" href="/auth/login?redirect={encodeURIComponent(returnTo)}">
      <i class="bi bi-plus-lg" aria-hidden="true"></i> Ikuti topik
    </a>
  {/if}
  {#if error}<span class="follow__error" role="alert">{error}</span>{/if}
  <span class="visually-hidden" aria-live="polite">{followed ? `${label} ditambahkan ke minatmu.` : ''}</span>
</span>

<style>
  .follow { display: inline-flex; flex-wrap: wrap; flex-shrink: 0; align-items: center; gap: 0.5rem; }
  .follow :global(.theme-btn) { white-space: nowrap; }
  .follow :global(.theme-btn) { min-height: 40px; box-shadow: none; }
  .follow__error { color: #a32121; font-size: 0.8125rem; }
</style>
