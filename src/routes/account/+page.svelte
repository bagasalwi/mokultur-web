<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { enhance } from '$app/forms';
  import { imgUrl, initials } from '$lib/threads';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  $: profile = data.profile;
  $: siteName = data.settings?.site_name ?? 'Mokultur';

  let avatarPreview: string | null = null;
  function onAvatarChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) { avatarPreview = null; return; }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    avatarPreview = URL.createObjectURL(f);
  }

  let savingProfile = false;
  let profileSaved = false;
  let savingAvatar = false;
  let avatarSaved = false;
  let savingPassword = false;
  let passwordSaved = false;

  function flashSuccess(set: (v: boolean) => void) {
    set(true);
    setTimeout(() => set(false), 2500);
  }

</script>

<svelte:head>
  <title>Pengaturan Akun · {siteName}</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="acc-page">
  <div class="container-xl">
    <header class="acc-head">
      <h1>Pengaturan Akun</h1>
      <p>Update profil, avatar, dan keamanan akun.</p>
    </header>

    <div class="acc-grid">
      <div class="acc-col">
    <!-- Profile -->
    <div class="acc-card">
      <h2><i class="bi bi-person"></i> Profil</h2>

      {#if form?.section === 'profile'}
        <div class="acc-alert" class:acc-alert--ok={form.success}>{form.error ?? form.success}</div>
      {/if}

      <form
        method="POST"
        action="?/profile"
        class="acc-form"
        use:enhance={() => {
          savingProfile = true;
          return async ({ result, update }) => {
            await update({ reset: false });
            savingProfile = false;
            if (result.type === 'success') {
              await invalidateAll();
              flashSuccess((v) => (profileSaved = v));
            }
          };
        }}
      >
        <label class="acc-field">
          <span>Nama</span>
          <input type="text" name="name" required minlength="2" maxlength="100" value={profile.name} />
        </label>

        <label class="acc-field">
          <span>Email</span>
          <input type="email" value={profile.email} disabled />
          <small>Email tidak bisa diubah.</small>
        </label>

        <label class="acc-field">
          <span>Username</span>
          <input
            type="text"
            name="username"
            placeholder="opsional, 3-30 char"
            pattern="[a-zA-Z0-9_]*"
            value={profile.username ?? ''}
          />
          <small>Huruf, angka, underscore. Dipakai di URL profil publik.</small>
        </label>

        <label class="acc-field">
          <span>Bio</span>
          <textarea name="description" rows="3" maxlength="255" placeholder="Ceritain tentang dirimu...">{profile.description ?? ''}</textarea>
        </label>

        <div class="acc-row">
          <label class="acc-field">
            <span>Instagram</span>
            <input type="text" name="instagram" placeholder="@username atau URL" value={profile.instagram ?? ''} />
          </label>
          <label class="acc-field">
            <span>Facebook</span>
            <input type="text" name="facebook" placeholder="username atau URL" value={profile.facebook ?? ''} />
          </label>
        </div>

        <div class="acc-actions">
          <button class="acc-btn acc-btn--primary" type="submit" disabled={savingProfile}>
            {#if savingProfile}
              <span class="acc-spinner"></span> Menyimpan...
            {:else if profileSaved}
              <i class="bi bi-check2-circle"></i> Tersimpan!
            {:else}
              <i class="bi bi-check2"></i> Simpan Profil
            {/if}
          </button>
        </div>
      </form>
    </div>

      </div>

      <div class="acc-col">
    <!-- Avatar -->
    <div class="acc-card">
      <h2><i class="bi bi-image"></i> Foto Profil</h2>

      {#if form?.section === 'avatar'}
        <div class="acc-alert" class:acc-alert--ok={form.success}>{form.error ?? form.success}</div>
      {/if}

      <form
        method="POST"
        action="?/avatar"
        enctype="multipart/form-data"
        class="acc-avatar-form"
        use:enhance={() => {
          savingAvatar = true;
          return async ({ result, update }) => {
            await update();
            savingAvatar = false;
            if (result.type === 'success') {
              avatarPreview = null;
              await invalidateAll();
              flashSuccess((v) => (avatarSaved = v));
            }
          };
        }}
      >
        <div class="acc-avatar-row">
          <div class="acc-avatar-preview">
            {#if avatarPreview}
              <img src={avatarPreview} alt="Preview" />
            {:else if profile.img}
              <img src={imgUrl(profile.img)} alt={profile.name} />
            {:else}
              <span>{initials(profile.name)}</span>
            {/if}
          </div>
          <div class="acc-avatar-controls">
            <label class="acc-btn acc-btn--ghost" for="avatar-file">
              <i class="bi bi-upload"></i> Pilih Gambar
            </label>
            <input
              id="avatar-file"
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              on:change={onAvatarChange}
              class="visually-hidden"
              required
            />
            <small>Akan di-resize 256×256 WebP. Maks 4MB.</small>
            {#if avatarPreview || avatarSaved}
              <button class="acc-btn acc-btn--primary" type="submit" disabled={savingAvatar}>
                {#if savingAvatar}
                  <span class="acc-spinner"></span> Mengupload...
                {:else if avatarSaved}
                  <i class="bi bi-check2-circle"></i> Berhasil!
                {:else}
                  <i class="bi bi-check2"></i> Upload Avatar
                {/if}
              </button>
            {/if}
          </div>
        </div>
      </form>
    </div>

    <!-- Password -->
    <div class="acc-card">
      <h2><i class="bi bi-shield-lock"></i> Ganti Password</h2>

      {#if form?.section === 'password'}
        <div class="acc-alert" class:acc-alert--ok={form.success}>{form.error ?? form.success}</div>
      {/if}

      <form method="POST" action="?/password" class="acc-form" use:enhance={() => {
        savingPassword = true;
        return async ({ result, update, formElement }) => {
          await update();
          savingPassword = false;
          if (result.type === 'success') {
            formElement.reset();
            flashSuccess((v) => (passwordSaved = v));
          }
        };
      }}>
        <label class="acc-field">
          <span>Password Lama</span>
          <input type="password" name="currentPassword" autocomplete="current-password" required />
        </label>
        <div class="acc-row">
          <label class="acc-field">
            <span>Password Baru</span>
            <input type="password" name="newPassword" autocomplete="new-password" required minlength="8" />
          </label>
          <label class="acc-field">
            <span>Konfirmasi Password</span>
            <input type="password" name="confirmPassword" autocomplete="new-password" required minlength="8" />
          </label>
        </div>
        <div class="acc-actions">
          <button class="acc-btn acc-btn--primary" type="submit" disabled={savingPassword}>
            {#if savingPassword}
              <span class="acc-spinner"></span> Memproses...
            {:else if passwordSaved}
              <i class="bi bi-check2-circle"></i> Password Diubah!
            {:else}
              <i class="bi bi-key"></i> Ganti Password
            {/if}
          </button>
        </div>
      </form>
    </div>
      </div>
    </div>
  </div>
</section>

<style>
  .acc-page { padding: 24px 0 40px; }
  .acc-head { max-width: 1040px; margin: 0 auto 18px; }
  .acc-head h1 { font-size: 24px; margin: 0; }
  .acc-head p { color: #6b7280; margin: 4px 0 0; }

  .acc-grid {
    max-width: 1040px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 18px; align-items: start;
  }
  .acc-col { display: flex; flex-direction: column; gap: 18px; }
  @media (max-width: 860px) {
    .acc-grid { grid-template-columns: 1fr; }
  }

  .acc-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 20px;
  }
  .acc-card h2 {
    font-size: 17px; margin: 0 0 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .acc-card h2 i { color: #6b7280; }

  .acc-alert {
    background: #fef2f2; color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 10px; padding: 10px 12px;
    font-size: 13px; margin-bottom: 14px;
  }
  .acc-alert--ok {
    background: #f0fdf4; color: #166534;
    border-color: #bbf7d0;
  }

  .acc-form { display: flex; flex-direction: column; gap: 14px; }
  .acc-field { display: flex; flex-direction: column; gap: 5px; }
  .acc-field > span { font-size: 13px; font-weight: 600; color: #111; }
  .acc-field small { font-size: 11px; color: #9ca3af; }
  .acc-field input,
  .acc-field textarea {
    width: 100%;
    border: 1px solid #d1d5db; border-radius: 10px;
    padding: 10px 12px; font-size: 14px;
    font-family: inherit; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .acc-field input:disabled { background: #f9fafb; color: #6b7280; }
  .acc-field textarea { resize: vertical; }
  .acc-field input:focus, .acc-field textarea:focus {
    border-color: var(--site-primary, #f1ff32);
    box-shadow: 0 0 0 3px rgba(241, 255, 50, 0.25);
  }

  .acc-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  }
  @media (max-width: 540px) {
    .acc-row { grid-template-columns: 1fr; }
  }

  .acc-actions {
    display: flex; justify-content: flex-end; gap: 10px;
    margin-top: 4px;
  }

  .acc-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 18px; border-radius: 999px;
    font-weight: 600; font-size: 14px;
    border: 1px solid transparent;
    cursor: pointer; text-decoration: none;
  }
  .acc-btn--primary {
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
  }
  .acc-btn--ghost {
    background: transparent;
    color: #4b5563;
    border-color: #d1d5db;
  }
  .acc-btn--ghost:hover { background: #f9fafb; }

  .acc-avatar-row {
    display: flex; align-items: center; gap: 18px;
    flex-wrap: wrap;
  }
  .acc-avatar-preview {
    width: 96px; height: 96px; border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    color: var(--site-dark, #0a0a0a);
    font-weight: 700; font-size: 28px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
    border: 2px solid #e5e7eb;
  }
  .acc-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
  .acc-avatar-controls {
    display: flex; flex-direction: column; gap: 8px;
    flex: 1; min-width: 200px;
  }
  .acc-avatar-controls small { font-size: 11px; color: #9ca3af; }

  .visually-hidden {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0, 0, 0, 0); border: 0;
  }

  .acc-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: acc-spin 0.6s linear infinite;
    flex-shrink: 0;
  }
  @keyframes acc-spin { to { transform: rotate(360deg); } }

  .acc-btn:disabled { opacity: 0.75; cursor: not-allowed; }
  .acc-btn--primary.acc-btn:not(:disabled):has(.bi-check2-circle) {
    background: #d1fae5;
    color: #166534;
  }
</style>
