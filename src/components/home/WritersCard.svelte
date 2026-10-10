<script lang="ts">
  import type { Writer } from '$lib/api';
  import SideCard from '$components/sidebar/SideCard.svelte';
  import { imgFallback } from '$lib/format';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { initials } from '$lib/user';

  export let writers: Writer[] = [];

  const href = (w: Writer) => `/@${encodeURIComponent(w.username ?? String(w.id))}`;
</script>

{#if writers.length > 0}
  <SideCard title="Penulis" headingId="side-writers" lead="Yang tulisannya paling banyak dibaca.">
    <ul class="writers">
      {#each writers as w (w.id)}
        <li>
          <a class="writers__row" href={href(w)}>
            <span class="writers__face" aria-hidden="true">
              {#if w.img}
                <img src={imgUrl(w.img, 160) ?? w.img} srcset={imgSrcset(w.img, 40)} sizes="40px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
              {:else}
                <span>{initials(w.name)}</span>
              {/if}
            </span>
            <span class="writers__text">
              <strong>{w.name}</strong>
              <small>@{w.username ?? w.id}{#if w.beats?.[0]}<span class="writers__beat">{w.beats[0].name}</span>{/if}</small>
            </span>
            <span class="writers__count"><strong>{w.totalArticles.toLocaleString('id-ID')}</strong><small>artikel</small></span>
          </a>
        </li>
      {/each}
    </ul>
    <a slot="footer" class="writers__all" href="/author">Kenali semua penulis <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
  </SideCard>
{/if}

<style>
  .writers { display: grid; gap: 0.25rem; margin: 0; padding: 0; list-style: none; }
  .writers__row { display: flex; align-items: center; gap: 0.75rem; min-height: 56px; padding: 0.35rem 0.4rem; margin: 0 -0.4rem; border-radius: 12px; color: inherit; text-decoration: none; transition: background-color 160ms ease; }
  .writers__row:hover { background: #f6f6f6; }
  .writers__row:hover strong { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .writers__row:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
  .writers__face { display: grid; place-items: center; flex: 0 0 40px; width: 40px; height: 40px; overflow: hidden; border-radius: 50%; background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); font-size: 0.875rem; font-weight: 900; }
  .writers__face img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .writers__text { display: grid; flex: 1; min-width: 0; line-height: 1.25; }
  .writers__text strong { overflow: hidden; color: #111; font-size: 0.875rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
  .writers__text small { overflow: hidden; color: #6b7280; font-size: 0.75rem; text-overflow: ellipsis; white-space: nowrap; }
  .writers__beat::before { content: '·'; margin: 0 0.35rem; }
  .writers__count { display: grid; justify-items: end; flex: none; line-height: 1.15; }
  .writers__count strong { color: #111; font-size: 0.9375rem; font-weight: 800; font-variant-numeric: tabular-nums; }
  .writers__count small { color: #6b7280; font-size: 0.6875rem; }
  .writers__all { color: #111; font-size: 0.8125rem; font-weight: 700; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .writers__all:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; }
</style>
