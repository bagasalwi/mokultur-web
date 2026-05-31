<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: siteName = data.settings?.site_name ?? 'Mokultur';
</script>

<svelte:head>
  <title>Thread Baru · Forum {siteName}</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="new-thread-page">
  <div class="container-xl">
    <a href="/forum" class="back-link">← Forum</a>

    <div class="thread-form-card">
      <h1>Buat Thread Baru</h1>
      <p class="hint">Topik diskusi anime, manga, atau kultur — pilih anime kalau spesifik.</p>

      {#if form?.error}
        <div class="alert">{form.error}</div>
      {/if}

      <form method="POST" class="thread-form">
        <label class="field">
          <span>Judul Thread <em>*</em></span>
          <input
            type="text"
            name="title"
            required
            minlength="3"
            maxlength="200"
            value={form?.title ?? ''}
            placeholder="Contoh: Diskusi Frieren Episode 24"
          />
        </label>

        <label class="field">
          <span>Anime (opsional)</span>
          <select name="anime_cache_id">
            <option value="">— Tidak terkait anime spesifik —</option>
            {#each data.animeOptions as a (a.id)}
              <option value={a.id} selected={form?.animeRaw === String(a.id)}>
                {a.title} {a.season && a.seasonYear ? `(${a.season} ${a.seasonYear})` : ''}
              </option>
            {/each}
          </select>
        </label>

        <label class="field">
          <span>Pembukaan / Pertanyaan (opsional)</span>
          <textarea
            name="body"
            rows="8"
            maxlength="30000"
            placeholder="Mulai diskusi: ringkasan episode, opini awal, atau pertanyaan...">{form?.body ?? ''}</textarea>
        </label>

        <div class="actions">
          <a href="/forum" class="btn-secondary">Batal</a>
          <button type="submit" class="btn-primary">
            <i class="bi bi-plus-lg"></i> Buat Thread
          </button>
        </div>
      </form>
    </div>
  </div>
</section>

<style>
  .new-thread-page { padding: 24px 0 60px; }
  .back-link {
    display: inline-block; margin-bottom: 16px;
    font-size: 13px; color: #4b5563; text-decoration: none;
  }
  .back-link:hover { text-decoration: underline; }

  .thread-form-card {
    max-width: 760px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 28px;
  }
  h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
  .hint { color: #6b7280; font-size: 14px; margin: 0 0 20px; }

  .alert {
    background: #fef2f2; color: #b91c1c;
    border: 1px solid #fecaca; border-radius: 10px;
    padding: 10px 12px; font-size: 13px; margin-bottom: 16px;
  }

  .thread-form { display: flex; flex-direction: column; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field > span { font-size: 13px; font-weight: 600; color: #111; }
  .field em { color: #ef4444; font-style: normal; }
  .field input,
  .field select,
  .field textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .field textarea { resize: vertical; }
  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: var(--site-primary, #f1ff32);
    box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;
  }
  .btn-primary, .btn-secondary {
    padding: 10px 18px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 14px;
    border: 1px solid transparent;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
  }
  .btn-secondary {
    background: transparent;
    color: #6b7280;
  }
  .btn-secondary:hover { color: #111; }
</style>
