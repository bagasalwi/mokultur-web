<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';

  let preview: string | null = null;
  let files: FileList | null = null;
  let fileName = '';

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) {
      preview = null;
      fileName = '';
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    preview = URL.createObjectURL(f);
    fileName = f.name;
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    preview = null;
    fileName = '';
    files = null;
    const input = document.getElementById('thread-image') as HTMLInputElement | null;
    if (input) input.value = '';
  }
</script>

<svelte:head>
  <title>Posting Baru · MokuThreads · {siteName}</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="mt-new">
  <div class="container-xl">
    <a href="/threads" class="mt-back">← MokuThreads</a>

    <div class="mt-new__card">
      <h1>Posting Baru</h1>
      <p class="mt-new__hint">Bagikan pikiranmu — boleh tulis aja, gambar aja, atau dua-duanya.</p>

      {#if form?.error}
        <div class="mt-new__alert">{form.error}</div>
      {/if}

      <form method="POST" enctype="multipart/form-data" class="mt-new__form">
        <textarea
          name="body"
          rows="5"
          maxlength="5000"
          placeholder="Apa yang lagi kamu pikirkan?"
          value={form?.body ?? ''}
        ></textarea>

        <label class="mt-new__field">
          <span>Anime (opsional)</span>
          <select name="animeCacheId">
            <option value="">— Tidak terkait anime spesifik —</option>
            {#each data.animeOptions as a (a.id)}
              <option value={a.id} selected={form?.animeRaw === String(a.id)}>
                {a.title}{a.season && a.seasonYear ? ` (${a.season} ${a.seasonYear})` : ''}
              </option>
            {/each}
          </select>
        </label>

        <div class="mt-new__image">
          <label for="thread-image" class="mt-new__pick">
            {#if preview}
              <img src={preview} alt="Preview" />
              <span class="mt-new__pick-name">{fileName}</span>
            {:else}
              <i class="bi bi-image"></i>
              <span>+ Tambah gambar (opsional)</span>
              <small>JPEG/PNG/WebP, maks 8MB</small>
            {/if}
          </label>
          <input
            id="thread-image"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            on:change={onFileChange}
            bind:files
            class="visually-hidden"
          />
          {#if preview}
            <button type="button" class="mt-new__clear" on:click={clearImage}>
              <i class="bi bi-x"></i> Hapus gambar
            </button>
          {/if}
        </div>

        <div class="mt-new__actions">
          <a href="/threads" class="mt-btn mt-btn--ghost">Batal</a>
          <button type="submit" class="mt-btn mt-btn--primary">
            <i class="bi bi-send"></i> Posting
          </button>
        </div>
      </form>
    </div>
  </div>
</section>

<style>
  .mt-new { padding: 24px 0 60px; }
  .mt-back {
    display: inline-block; margin-bottom: 16px;
    font-size: 13px; color: #4b5563; text-decoration: none;
  }
  .mt-back:hover { text-decoration: underline; }

  .mt-new__card {
    max-width: 640px; margin: 0 auto;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 26px;
  }
  .mt-new__card h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
  .mt-new__hint { color: #6b7280; font-size: 13px; margin: 0 0 16px; }

  .mt-new__alert {
    background: #fef2f2; color: #b91c1c;
    border: 1px solid #fecaca; border-radius: 10px;
    padding: 10px 12px; font-size: 13px; margin-bottom: 14px;
  }

  .mt-new__form {
    display: flex; flex-direction: column; gap: 14px;
  }
  .mt-new__form textarea {
    width: 100%;
    border: 1px solid #d1d5db; border-radius: 12px;
    padding: 12px 14px; font-size: 15px;
    font-family: inherit; resize: vertical; outline: none;
    line-height: 1.5;
  }
  .mt-new__form textarea:focus {
    border-color: var(--site-primary, #f1ff32);
    box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25);
  }

  .mt-new__field { display: flex; flex-direction: column; gap: 6px; }
  .mt-new__field > span { font-size: 13px; font-weight: 600; color: #111; }
  .mt-new__field select {
    width: 100%;
    border: 1px solid #d1d5db; border-radius: 10px;
    padding: 10px 12px; font-size: 14px;
    font-family: inherit; outline: none;
  }
  .mt-new__field select:focus {
    border-color: var(--site-primary, #f1ff32);
    box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25);
  }

  .mt-new__image {
    display: flex; flex-direction: column; gap: 8px;
  }
  .mt-new__pick {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 4px;
    min-height: 140px; padding: 16px;
    border: 2px dashed #d1d5db; border-radius: 12px;
    cursor: pointer; color: #6b7280; font-size: 13px;
    background: #fafafa; overflow: hidden;
  }
  .mt-new__pick:hover { border-color: var(--site-primary, #f1ff32); background: #fff; }
  .mt-new__pick i { font-size: 32px; }
  .mt-new__pick small { font-size: 11px; color: #9ca3af; }
  .mt-new__pick img {
    max-width: 100%; max-height: 320px;
    border-radius: 10px; object-fit: contain;
  }
  .mt-new__pick-name { font-size: 12px; color: #4b5563; margin-top: 6px; }
  .mt-new__clear {
    align-self: flex-end;
    background: transparent; border: none;
    color: #b91c1c; font-size: 13px; cursor: pointer;
    padding: 4px 8px;
  }
  .mt-new__clear:hover { text-decoration: underline; }

  .visually-hidden {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0, 0, 0, 0); border: 0;
  }

  .mt-new__actions {
    display: flex; justify-content: flex-end; gap: 10px;
    margin-top: 4px;
  }
  .mt-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 18px; border-radius: 999px;
    font-weight: 600; font-size: 14px;
    border: 1px solid transparent;
    cursor: pointer; text-decoration: none;
  }
  .mt-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
  }
  .mt-btn--ghost {
    background: transparent; color: #6b7280;
  }
  .mt-btn--ghost:hover { color: #111; }
</style>
