<script lang="ts">
  import type { PhotoStory } from '$lib/api';
  import { imgUrl, imgSrcset } from '$lib/img';
  export let story: PhotoStory;
  export let onopen: (index: number) => void;

  function preview(caption: string) {
    const characters = Array.from(caption);
    return characters.length > 140 ? `${characters.slice(0, 140).join('').trimEnd()}…` : caption;
  }

  function open(event: MouseEvent, index: number) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onopen(index);
  }
</script>

<section class="photo-story" aria-labelledby="photo-story-gallery-title">
  <div class="photo-story__heading">
    <h2 id="photo-story-gallery-title">Galeri Photo Story</h2>
    <span>{story.photos.length} foto</span>
  </div>
  <div class="photo-story__grid">
    {#each story.photos as photo, index (photo.galleryId)}
      {@const shortCaption = preview(photo.caption)}
      {@const shortened = shortCaption !== photo.caption}
      <figure id={`photo-${index + 1}`} class="photo-story__figure">
        <a href={photo.url} class="photo-story__image" on:click={(event) => open(event, index)} aria-label={`Perbesar foto ${index + 1}: ${photo.alt}`}>
          <img src={imgUrl(photo.url, 768) ?? photo.url} srcset={imgSrcset(photo.url, 400)} sizes="(max-width: 575px) calc(100vw - 48px), (max-width: 991px) calc((100vw - 64px) / 2), 400px" alt={photo.alt} width={photo.width ?? undefined} height={photo.height ?? undefined} loading="lazy" decoding="async" />
        </a>
        <figcaption>
          <a href={`#photo-${index + 1}`} class="photo-story__number" aria-label={`Tautan foto ${index + 1}`}>Foto {index + 1} / {story.photos.length}</a>
          <p class="photo-story__caption">{shortCaption}</p>
          {#if photo.credit}<span class="photo-story__credit">Foto: {photo.credit}</span>{/if}
          {#if shortened || photo.text}
            <details class="photo-story__details">
              <summary>Detail foto <span class="visually-hidden">{index + 1}</span></summary>
              <div class="photo-story__detail-content">
                {#if shortened}<p class="photo-story__caption-full">{photo.caption}</p>{/if}
                {#if photo.text}<p class="photo-story__text">{photo.text}</p>{/if}
              </div>
            </details>
          {/if}
        </figcaption>
      </figure>
    {/each}
  </div>
</section>

<style>
  .photo-story { margin-top: 2rem; }
  .photo-story__heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
  .photo-story__heading h2 { color: #111; font-size: 1.25rem; font-weight: 700; margin: 0; }
  .photo-story__heading > span { color: #555; font-size: .85rem; white-space: nowrap; }
  .photo-story__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; }
  .photo-story__figure { display: flex; flex-direction: column; min-width: 0; margin: 0; padding: .5rem; background: #fff; border: 1px solid #e7e7e7; border-radius: 12px; scroll-margin-top: 110px; }
  .photo-story__image { position: relative; display: block; flex: none; aspect-ratio: 4 / 3; background: #f2f2f2; border-radius: 8px; }
  .photo-story__image img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
  .photo-story figcaption { display: flex; flex: 1; flex-direction: column; gap: .5rem; padding: .75rem .5rem .5rem; color: #1a1a1a; font-size: .95rem; line-height: 1.6; }
  .photo-story__number { color: #555; font-size: .8rem; width: fit-content; }
  .photo-story__caption, .photo-story__caption-full, .photo-story__text { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
  .photo-story__credit { color: #555; font-size: .8rem; overflow-wrap: anywhere; }
  .photo-story__details { margin-top: auto; padding-top: .25rem; }
  .photo-story__details summary { width: fit-content; min-height: 44px; padding: .65rem .7rem; color: var(--site-primary-contrast, #111); background: var(--site-primary, #f1ff32); border-radius: 5px; font-size: .85rem; font-weight: 600; cursor: pointer; }
  .photo-story__detail-content { display: grid; gap: .75rem; padding-top: .75rem; }
  .photo-story a:focus-visible, .photo-story summary:focus-visible { outline: 3px solid #111; outline-offset: 3px; }
  @media (min-width: 576px) { .photo-story__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
