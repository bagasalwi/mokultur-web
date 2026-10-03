<script lang="ts">
  import type { PhotoStory } from '$lib/api';
  import { imgUrl, imgSrcset } from '$lib/img';
  export let story: PhotoStory;
  export let onopen: (index: number) => void;
  function open(event: MouseEvent, index: number) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onopen(index);
  }
</script>

<section class="photo-story article-detail__reader" aria-label="Foto dalam Photo Story">
  {#each story.photos as photo, index (photo.galleryId)}
    <figure id={`photo-${index + 1}`} class="photo-story__figure">
      <a href={photo.url} on:click={(event) => open(event, index)} aria-label={`Perbesar foto ${index + 1}: ${photo.alt}`}>
        <img src={imgUrl(photo.url, 1080) ?? photo.url} srcset={imgSrcset(photo.url, 800)} sizes="(max-width: 991px) calc(100vw - 24px), 800px" alt={photo.alt} width={photo.width ?? undefined} height={photo.height ?? undefined} style:aspect-ratio={photo.width && photo.height ? undefined : 'auto 16 / 9'} loading="lazy" decoding="async" />
      </a>
      <figcaption><a href={`#photo-${index + 1}`} class="photo-story__number" aria-label={`Tautan foto ${index + 1}`}>{index + 1} / {story.photos.length}</a><span class="photo-story__caption">{photo.caption}</span>{#if photo.credit}<span class="photo-story__credit">Foto: {photo.credit}</span>{/if}</figcaption>
    </figure>
    {#if photo.text}<p class="photo-story__text">{photo.text}</p>{/if}
  {/each}
</section>

<style>
  .photo-story { margin-top: 2rem; }
  .photo-story__figure { margin: 0 0 2rem; scroll-margin-top: 110px; }
  .photo-story__figure > a { display: block; }
  .photo-story img { display: block; width: 100%; height: auto; background: #f2f2f2; border-radius: 8px; }
  .photo-story figcaption { display: grid; gap: .45rem; padding: .9rem 0; font-size: .95rem; line-height: 1.6; }
  .photo-story__number { color: #555; font-size: .8rem; width: fit-content; }
  .photo-story__caption, .photo-story__text { white-space: pre-line; overflow-wrap: anywhere; }
  .photo-story__credit { font-size: .8rem; color: #555; overflow-wrap: anywhere; }
  .photo-story a:focus-visible { outline: 3px solid #595900; outline-offset: 3px; }
</style>
