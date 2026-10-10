<script lang="ts">
  import type { SocialMediaItem } from '$lib/api';
  import { socialGradient, socialIcon } from '$lib/social';
  import SideCard from './SideCard.svelte';

  export let socials: SocialMediaItem[] = [];
  export let siteName = 'Mokultur';

  const label = (platform: string) => platform.charAt(0).toUpperCase() + platform.slice(1);
</script>

{#if socials.length}
  <SideCard title="Ikuti {siteName}" headingId="side-follow" lead="Kabar anime, game, dan event terbaru langsung di timeline kamu.">
    <ul class="follow">
      {#each socials as s (s.id)}
        <li>
          <a class="follow__row" href={s.url} target="_blank" rel="noopener noreferrer">
            <span class="follow__icon" style:background={socialGradient(s.platform, s.icon)} aria-hidden="true"><i class="bi bi-{socialIcon(s.platform, s.icon)}"></i></span>
            <span class="follow__text">
              <strong>{s.username}</strong>
              <small>{label(s.platform)}{s.followers ? ` · ${s.followers} pengikut` : ''}</small>
            </span>
            <span class="follow__cta">Ikuti</span>
          </a>
        </li>
      {/each}
    </ul>
  </SideCard>
{/if}

<style>
  .follow { display: grid; gap: 0.25rem; margin: 0; padding: 0; list-style: none; }
  .follow__row { display: flex; align-items: center; gap: 0.75rem; min-height: 52px; padding: 0.35rem 0.4rem; margin: 0 -0.4rem; border-radius: 12px; color: inherit; text-decoration: none; transition: background-color 160ms ease; }
  .follow__row:hover { background: #f6f6f6; }
  .follow__row:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .follow__icon { display: grid; place-items: center; flex: 0 0 38px; width: 38px; height: 38px; border-radius: 50%; color: #fff; font-size: 1rem; }
  .follow__text { display: grid; min-width: 0; flex: 1; line-height: 1.25; }
  .follow__text strong { overflow: hidden; color: #111; font-size: 0.875rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
  .follow__text small { color: #6b7280; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
  .follow__cta { flex: none; padding: 0.3rem 0.75rem; border-radius: 999px; background: var(--site-dark, #111); color: #fff; font-size: 0.75rem; font-weight: 800; transition: background-color 160ms ease, color 160ms ease; }
  .follow__row:hover .follow__cta { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
</style>
