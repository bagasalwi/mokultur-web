<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { readerRequest, ReaderError, type ReaderArticleState } from '$lib/reader';
  export let postId: number;
  export let state: ReaderArticleState | null = null;
  export let loggedIn = false;
  export let returnTo = '/dashboard/tersimpan';
  export let label = true;
  export let className = '';
  /**
   * 'surface' is the full button; 'share' joins the article page's share row;
   * 'compact' is the small row action in reader lists (icon only on phones).
   */
  export let variant: 'surface' | 'share' | 'compact' = 'surface';
  $: baseClass = variant === 'share'
    ? 'share-social-card__button reader-save--share'
    : variant === 'compact'
      ? 'reader-save-compact'
      : 'reader-save theme-btn theme-btn--surface';
  const dispatch = createEventDispatcher<{ updated: ReaderArticleState }>();
  let busy = false;
  let error = '';
  $: saved = !!state?.bookmarkedAt;
  async function toggle() {
    if (busy) return;
    busy = true; error = '';
    try {
      const result = await readerRequest<{ data: ReaderArticleState }>(`articles/${postId}/bookmark`, saved ? 'DELETE' : 'PUT');
      state = result.data; dispatch('updated', state);
    } catch (cause) {
      error = cause instanceof ReaderError && cause.status === 401 ? 'Sesi berakhir. Masuk kembali.' : cause instanceof Error ? cause.message : 'Gagal menyimpan. Coba lagi.';
    } finally { busy = false; }
  }
</script>

<span class="reader-bookmark" class:reader-bookmark--share={variant === 'share'}>
  {#if loggedIn}
    <button type="button" class="{baseClass} {className}" class:is-saved={saved} class:is-loading={busy} aria-pressed={saved} aria-label={saved ? 'Hapus dari simpanan' : 'Simpan artikel'} disabled={busy} on:click={toggle}>
      <i class="bi {saved ? 'bi-bookmark-fill' : 'bi-bookmark'}" aria-hidden="true"></i>
      {#if label}<span class="reader-save__label">{busy ? 'Menyimpan…' : saved ? 'Tersimpan' : 'Simpan'}</span>{/if}
    </button>
  {:else}
    <a class="{baseClass} {className}" href="/auth/login?redirect={encodeURIComponent(returnTo)}" aria-label="Masuk untuk menyimpan artikel">
      <i class="bi bi-bookmark" aria-hidden="true"></i>{#if label}<span class="reader-save__label">Simpan</span>{/if}
    </a>
  {/if}
  {#if error}<span class="reader-error" role="alert">{error} {#if error.includes('Sesi')}<a href="/auth/login?redirect={encodeURIComponent(returnTo)}">Masuk</a>{/if}</span>{/if}
</span>

<style>
  .reader-bookmark { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .reader-save { min-height: 44px; min-width: 44px; padding: 8px 12px; font-size: .875rem; box-shadow: none; }
  .reader-save.is-saved { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #000); border-color: transparent; }
  .reader-save:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 3px; }
  .reader-save:disabled { opacity: .6; cursor: wait; }
  /* Share-row variant: geometry and colours come from .share-social-card__button. */
  .reader-bookmark--share { display: contents; }
  .reader-save--share.is-saved,
  .reader-save--share.is-saved:hover { background: var(--site-primary, #f1ff32); border-color: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #000); }
  .reader-save--share:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .reader-save--share:disabled { cursor: progress; }
  .reader-bookmark--share .reader-error { flex-basis: 100%; }
  .reader-error { color: #a32121; font-size: .8125rem; }

  /* Compact row action: a quiet pill that turns yellow once saved. */
  .reader-save-compact {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    height: 34px;
    padding: 0 0.8rem;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #fff;
    color: #374151;
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
  }
  /* Keeps a 44px touch target around the smaller visual pill. */
  .reader-save-compact::before { content: ''; position: absolute; inset: -5px; }
  .reader-save-compact:hover { border-color: var(--site-dark, #111); color: #111; }
  .reader-save-compact.is-saved { border-color: transparent; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .reader-save-compact.is-saved:hover { background: color-mix(in srgb, var(--site-primary, #f1ff32) 85%, #000); }
  .reader-save-compact:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .reader-save-compact:disabled { opacity: .6; cursor: wait; }
  @media (max-width: 575px) {
    .reader-save-compact { width: 34px; padding: 0; }
    .reader-save-compact .reader-save__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  }
</style>
