<script lang="ts">
  import { page } from '$app/stores';

  export let items: { href: string; label: string; icon: string }[] = [];

  /**
   * /dashboard has to match exactly — otherwise it stays lit on every child
   * route, since they all start with the same path.
   */
  function isActive(href: string, current: string): boolean {
    return href === '/dashboard' || href === '/' ? current === href : current.startsWith(href);
  }

  $: current = $page.url.pathname;
</script>

<nav class="bnav" aria-label="Navigasi dashboard">
  {#each items as item}
    <a
      href={item.href}
      class="bnav__item"
      class:bnav__item--active={isActive(item.href, current)}
      aria-current={isActive(item.href, current) ? 'page' : undefined}
    >
      <i class="bi {item.icon}"></i>
      <span>{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .bnav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    /* Under the cookie banner (1080) so consent still wins, above page content. */
    z-index: 1030;
    display: flex;
    background: #fff;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -2px 12px rgb(10 10 10 / 6%);
    /* Clears the iOS home indicator; resolves to 0 everywhere else. */
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .bnav__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    /* 56px + label keeps the whole tab comfortably over the ~44px a fingertip
       covers, so the icon is never the only thing worth aiming at. */
    min-height: 56px;
    padding: 8px 4px;
    font-size: 11px;
    font-weight: 700;
    color: #9ca3af;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }

  .bnav__item i {
    font-size: 19px;
    line-height: 1;
  }

  .bnav__item span {
    /* Long labels must not wrap and shove the row taller. */
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bnav__item--active {
    color: var(--site-dark, #0a0a0a);
  }

  /* Colour alone is a weak signal at this size, so the active tab also gets a
     bar along the top edge. */
  .bnav__item--active::before {
    content: '';
    position: absolute;
    top: 0;
    width: 34px;
    height: 3px;
    border-radius: 0 0 3px 3px;
    background: var(--site-primary, #f1ff32);
  }

  .bnav__item {
    position: relative;
  }

  @media (min-width: 861px) {
    .bnav {
      display: none;
    }
  }
</style>
