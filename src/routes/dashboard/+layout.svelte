<script lang="ts">
  import { page } from '$app/stores';
  import { avatarUrl, initials } from '$lib/user';

  export let data;

  $: profile = data.profile;

  /**
   * Account settings deliberately stays at /account rather than moving under
   * /dashboard: it is linked from elsewhere and reached by ?redirect=, and a
   * sidebar entry gives it a home here without breaking any of that.
   */
  $: nav = [
    { href: '/dashboard', label: 'Ringkasan', icon: 'bi-grid-1x2', show: true },
    { href: '/dashboard/artikel', label: 'Artikel Saya', icon: 'bi-file-text', show: profile.canWrite },
    { href: '/account', label: 'Pengaturan Akun', icon: 'bi-gear', show: true },
  ].filter((item) => item.show);

  $: current = $page.url.pathname;
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="dash">
  <div class="container-xl">
    <div class="dash__grid">
      <aside class="dash__side">
        <div class="dash__me">
          {#if profile.img}
            <img class="dash__avatar" src={avatarUrl(profile.img)} alt="" width="44" height="44" />
          {:else}
            <span class="dash__avatar dash__avatar--text">{initials(profile.name)}</span>
          {/if}
          <div class="dash__me-text">
            <strong>{profile.name}</strong>
            <span>
              {#if profile.username}@{profile.username}{:else}Belum punya username{/if}
            </span>
          </div>
        </div>

        <nav class="dash__nav">
          {#each nav as item}
            <a
              href={item.href}
              class="dash__nav-item"
              class:dash__nav-item--active={item.href === '/dashboard'
                ? current === '/dashboard'
                : current.startsWith(item.href)}
            >
              <i class="bi {item.icon}"></i>
              {item.label}
            </a>
          {/each}
        </nav>

        <a class="dash__back" href="/"><i class="bi bi-arrow-left"></i> Kembali ke Mokultur</a>
      </aside>

      <div class="dash__main">
        <slot />
      </div>
    </div>
  </div>
</section>

<style>
  .dash { padding: 24px 0 48px; }

  .dash__grid {
    display: grid;
    grid-template-columns: 232px minmax(0, 1fr);
    gap: 22px;
    align-items: start;
  }

  .dash__side {
    position: sticky;
    top: 88px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
  }

  .dash__me {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 14px;
    margin-bottom: 12px;
    border-bottom: 1px solid #f1f1f1;
  }

  .dash__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .dash__avatar--text {
    display: grid;
    place-items: center;
    background: var(--site-dark, #0a0a0a);
    color: var(--site-primary, #f1ff32);
    font-weight: 800;
    font-size: 15px;
  }

  /* min-width: 0 lets the name ellipsize instead of forcing the sidebar wider. */
  .dash__me-text { min-width: 0; display: flex; flex-direction: column; }
  .dash__me-text strong {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dash__me-text span { font-size: 12px; color: #9ca3af; }

  .dash__nav { display: flex; flex-direction: column; gap: 2px; }

  .dash__nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 11px;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }

  .dash__nav-item i { color: #9ca3af; font-size: 15px; }
  .dash__nav-item:hover { background: #f9fafb; color: #111; }

  .dash__nav-item--active {
    background: var(--site-dark, #0a0a0a);
    color: #fff;
  }
  .dash__nav-item--active i { color: var(--site-primary, #f1ff32); }

  .dash__back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #f1f1f1;
    width: 100%;
    font-size: 12.5px;
    color: #6b7280;
    text-decoration: none;
  }
  .dash__back:hover { color: #111; }

  @media (max-width: 860px) {
    .dash__grid { grid-template-columns: 1fr; gap: 16px; }
    .dash__side { position: static; }

    /* Horizontal strip on mobile — a stacked menu would push the actual
       content below the fold on every visit. */
    .dash__nav { flex-direction: row; overflow-x: auto; gap: 6px; }
    .dash__nav-item { white-space: nowrap; }
    .dash__back { display: none; }
  }
</style>
