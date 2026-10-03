<script lang="ts">
  import type { PhotoStory } from '$lib/api';
  import { imgUrl, imgSrcset } from '$lib/img';
  export let story: PhotoStory;
  export let onopen: (index: number) => void;
  $: coverIndex = Math.max(0, story.photos.findIndex((photo) => photo.galleryId === story.coverId));
  $: tiles = [coverIndex, ...story.photos.map((_, index) => index).filter(index => index !== coverIndex)].slice(0, 3);
  function open(event: MouseEvent, index: number) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onopen(index);
  }
</script>

<div class="story-header" class:two-photos={tiles.length === 2}>
  {#each tiles as index, tile}
    {@const photo = story.photos[index]}
    <a href={`#photo-${index + 1}`} class:story-header__cover={tile === 0} on:click={(event) => open(event, index)} aria-label={`Lihat foto ${index + 1}: ${photo.alt}`}>
      <img src={imgUrl(photo.url, tile === 0 ? 1080 : 480) ?? photo.url} srcset={imgSrcset(photo.url, tile === 0 ? 480 : 240)} sizes={tile === 0 ? '(max-width: 991px) 100vw, 480px' : '(max-width: 991px) 50vw, 240px'} alt={photo.alt} width={photo.width ?? undefined} height={photo.height ?? undefined} loading="eager" fetchpriority={tile === 0 ? 'high' : 'auto'} decoding="async" />
      {#if tile === tiles.length - 1}<span class="story-header__count">Lihat {story.photos.length} foto</span>{/if}
    </a>
  {/each}
</div>

<style>
  .story-header { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; overflow: hidden; border-radius: 12px; }
  .story-header a { position: relative; display: block; min-width: 0; aspect-ratio: 4 / 3; background: #252525; }
  .story-header .story-header__cover { grid-column: 1 / -1; aspect-ratio: 16 / 10; }
  .two-photos a:not(.story-header__cover) { grid-column: 1 / -1; aspect-ratio: 16 / 6; }
  .story-header img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .story-header__count { position: absolute; right: 10px; bottom: 10px; padding: 7px 11px; background: #111; color: var(--site-primary, #f1ff32); border-radius: 4px; font-size: .8rem; font-weight: 600; }
  .story-header a:focus-visible { outline: 3px solid var(--site-primary, #f1ff32); outline-offset: -4px; }
</style>
