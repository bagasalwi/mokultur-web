<script lang="ts">
  import { PUBLIC_API_URL } from '$env/static/public';
  import type { CurhatanItem } from '$lib/api';
  import { createEventDispatcher } from 'svelte';

  export let siteName = 'Mokultur';
  export let user: AuthUser | null = null;

  const dispatch = createEventDispatcher<{ submitted: CurhatanItem }>();

  let curhatan = '';
  let curhatanDari = '';
  let postAsAccount = !!user;
  let loading = false;
  let error = '';
  let success = false;

  $: charCount = curhatan.length;
  $: overLimit = charCount > 250;
  $: effectiveAuthor = postAsAccount && user ? user.name : curhatanDari;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';

    if (!curhatan.trim()) { error = 'Ceritanya jangan kosong ya.'; return; }
    if (overLimit) { error = 'Maksimal 250 karakter.'; return; }
    if (!postAsAccount) {
      if (!curhatanDari.trim()) { error = 'Nama / panggilan wajib diisi.'; return; }
      if (curhatanDari.length > 30) { error = 'Nama maksimal 30 karakter.'; return; }
    }

    loading = true;
    try {
      const form = new FormData();
      form.append('curhatan', curhatan.trim());
      // Kalau "Posting sebagai akun" aktif, tidak kirim curhatan_dari → Elysia auto pakai user.name dari cookie
      if (!postAsAccount) {
        form.append('curhatan_dari', curhatanDari.trim());
      }

      const res = await fetch(`${PUBLIC_API_URL}/api/curhatan`, {
        method: 'POST',
        body: form,
        credentials: 'include', // wajib agar cookie .mokultur.com terkirim ke api.mokultur.com
      });
      const json = await res.json();

      if (json.success && json.data) {
        success = true;
        curhatan = '';
        if (!postAsAccount) curhatanDari = '';
        dispatch('submitted', json.data);
      } else {
        error = json.error ?? 'Terjadi kesalahan, coba lagi.';
      }
    } catch {
      error = 'Gagal mengirim. Periksa koneksimu.';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit} novalidate>
  <div class="row g-3">
    <div class="col-12">
      <div class="collab-field">
        <div class="collab-field__label-wrap">
          <label for="curhatan-text" class="collab-field__label">Ceritanya</label>
          <span class="collab-field__hint" class:text-danger={overLimit}>{charCount}/250</span>
        </div>
        <textarea
          id="curhatan-text"
          rows="3"
          class="collab-field__control collab-field__control--textarea"
          class:is-invalid={overLimit}
          placeholder="Lagi pengen cerita apa hari ini?"
          bind:value={curhatan}
        ></textarea>
        <div class="collab-field__meta">
          <span>Boleh anonim, boleh pakai namamu.</span>
          <span>Plis jgn doxxing atau hate speech yaa.</span>
        </div>
      </div>
    </div>

    {#if user}
      <div class="col-12">
        <label class="curhat-account-toggle">
          <input type="checkbox" bind:checked={postAsAccount} />
          <span>Posting sebagai <strong>{user.name}</strong> <em>(akun saya)</em></span>
        </label>
      </div>
    {/if}

    {#if !postAsAccount}
      <div class="col-12">
        <div class="collab-field">
          <div class="collab-field__label-wrap">
            <label for="curhatan-dari" class="collab-field__label">Dari siapa?</label>
            <span class="collab-field__hint">Nama samaran juga boleh.</span>
          </div>
          <input
            id="curhatan-dari"
            type="text"
            class="collab-field__control"
            placeholder="Misal: seorang wibu lelah"
            maxlength="30"
            bind:value={curhatanDari}
          />
        </div>
      </div>
    {/if}
  </div>

  {#if error}
    <p class="collab-field__error mt-2">{error}</p>
  {/if}

  {#if success}
    <p class="text-success mt-2 fw-semibold"><i class="bi bi-check-circle-fill"></i> Curhatan berhasil dikirim!</p>
  {/if}

  <div class="curhat-form-actions mt-3">
    <button type="submit" class="theme-btn theme-btn--primary" disabled={loading || overLimit}>
      {#if loading}
        <i class="bi bi-hourglass-split"></i> Mengirim...
      {:else}
        <i class="bi bi-send-fill"></i> Kirim Curhatan
      {/if}
    </button>
  </div>

  <p class="curhat-form-terms">
    Dengan mengirim, kamu setuju tidak melanggar aturan komunitas {siteName}.
  </p>
</form>

<style>
  .curhat-account-toggle {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; background: rgba(241,255,50,0.12);
    border: 1px solid rgba(241,255,50,0.45); border-radius: 8px;
    font-size: 13px; cursor: pointer;
  }
  .curhat-account-toggle em { color: #6b7280; font-style: normal; }
  .curhat-account-toggle input { width: 16px; height: 16px; cursor: pointer; }
</style>
