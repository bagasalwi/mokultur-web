<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { readerRequest, type ReaderInterest } from '$lib/reader';

  export let interests: ReaderInterest[] = [];
  export let availableInterests: { id: ReaderInterest; label: string }[] = [];

  const dispatch = createEventDispatcher<{ done: { saved: boolean } }>();
  let selected: ReaderInterest[] = [...interests];
  let saving = false;
  let error = '';

  async function save() {
    saving = true;
    error = '';
    try {
      await readerRequest('interests', 'PUT', { interests: selected });
      await invalidateAll();
      dispatch('done', { saved: true });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Minat belum tersimpan. Coba lagi.';
    } finally {
      saving = false;
    }
  }
</script>

<form class="interest-editor" on:submit|preventDefault={save}>
  <div class="interest-editor__head">
    <h2>Pilih minatmu</h2>
    <p>Feed "Untuk Kamu" akan lebih sering menampilkan topik ini, tetap dengan sedikit bacaan lain untuk ditemukan.</p>
  </div>
  <fieldset disabled={saving}>
    <legend class="visually-hidden">Minat bacaan</legend>
    <div class="interest-editor__grid">
      {#each availableInterests as interest}
        <label class:is-on={selected.includes(interest.id)}>
          <input type="checkbox" value={interest.id} bind:group={selected} />
          <i class="bi {selected.includes(interest.id) ? 'bi-check-lg' : 'bi-plus-lg'}" aria-hidden="true"></i>
          {interest.label}
        </label>
      {/each}
    </div>
    {#if error}<p class="interest-editor__error" role="alert">{error}</p>{/if}
    <div class="interest-editor__actions">
      <button class="theme-btn theme-btn--primary theme-btn--sm" type="submit">{saving ? 'Menyimpan…' : 'Simpan minat'}</button>
      <button class="theme-btn theme-btn--see-all theme-btn--sm" type="button" on:click={() => dispatch('done', { saved: false })}>Batal</button>
    </div>
  </fieldset>
</form>

<style>
  .interest-editor {
    padding: 1.25rem 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 12px 32px rgba(10, 10, 10, 0.08);
  }
  .interest-editor__head h2 { margin: 0; font-size: 1.125rem; font-weight: 800; }
  .interest-editor__head p { margin: 0.25rem 0 0; color: #6b7280; font-size: 0.875rem; max-width: 60ch; }
  fieldset { border: 0; padding: 0; margin: 0; }
  .interest-editor__grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
  .interest-editor__grid label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 44px;
    padding: 0 1rem;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 700;
    color: #1a1a1a;
    transition: background-color 160ms ease, border-color 160ms ease;
  }
  .interest-editor__grid label.is-on {
    border-color: transparent;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
  }
  .interest-editor__grid label:focus-within { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .interest-editor__grid input { position: absolute; opacity: 0; pointer-events: none; }
  .interest-editor__error { color: #a32121; font-size: 0.875rem; }
  .interest-editor__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
</style>
