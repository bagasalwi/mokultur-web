<script lang="ts">
  import type { MediaPartner } from '$lib/api';
  import { imgFallback } from '$lib/format';
  import { imgUrl } from '$lib/img';
  import SideCard from './SideCard.svelte';

  export let partners: MediaPartner[] = [];
  export let total = 0;

  $: shown = partners.filter((p) => p.logo).slice(0, 9);
</script>

{#if shown.length}
  <SideCard title="Media partner kami" headingId="side-partners" lead="{total || shown.length} brand dan event sudah bekerja sama dengan kami.">
    <ul class="partners">
      {#each shown as p (p.id)}
        <li title={p.name}>
          <img src={imgUrl(p.logo, 240) ?? p.logo} alt={p.name} loading="lazy" decoding="async" on:error={imgFallback} />
        </li>
      {/each}
    </ul>
    <svelte:fragment slot="footer">
      <a class="theme-btn theme-btn--see-all theme-btn--sm" href="/media-partner">Lihat semua</a>
      <a class="partners__join" href="/contact?type=event">Jadi media partner <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
    </svelte:fragment>
  </SideCard>
{/if}

<style>
  .partners { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
  .partners li { display: grid; place-items: center; aspect-ratio: 4 / 3; padding: 0.6rem; border: 1px solid #f0f0f0; border-radius: 12px; background: #fff; }
  .partners img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .partners__join { color: #111; font-size: 0.8125rem; font-weight: 700; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .partners__join:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
</style>
