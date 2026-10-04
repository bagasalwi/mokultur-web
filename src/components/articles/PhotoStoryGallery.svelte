<script lang="ts">
  import { onMount } from 'svelte';
  import type { PhotoStory } from '$lib/api';
  import { imgUrl, imgSrcset } from '$lib/img';
  export let story: PhotoStory;
  export let onopen: (index: number) => void;
  let active = 0;
  let ready = false;
  let track: HTMLDivElement;
  let dots: HTMLDivElement;
  let trackWidth = 0;
  let touchStart: { x: number; y: number } | null = null;

  function preview(caption: string) {
    const characters = Array.from(caption);
    return characters.length > 140 ? `${characters.slice(0, 140).join('').trimEnd()}…` : caption;
  }

  function open(event: MouseEvent, index: number) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onopen(index);
  }

  function measure() {
    const slide = track?.children[active] as HTMLElement | undefined;
    if (slide) track.style.height = `${slide.getBoundingClientRect().height + track.clientTop * 2}px`;
  }

  function sync() {
    if (!ready || !track.clientWidth || track.clientWidth !== trackWidth) return;
    active = Math.min(story.photos.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
    measure();
    const dot = dots?.children[active] as HTMLElement | undefined;
    if (dot) dots.scrollTo({ left: dot.offsetLeft - (dots.clientWidth - dot.offsetWidth) / 2 });
  }

  function select(index: number, smooth = true) {
    if (!track || !story.photos.length) return;
    const target = (index + story.photos.length) % story.photos.length;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: target * track.clientWidth, behavior: smooth && !reduced ? 'smooth' : 'instant' });
  }

  function hash() {
    const match = window.location.hash.match(/^#photo-(\d+)$/);
    if (match && Number(match[1]) >= 1 && Number(match[1]) <= story.photos.length) select(Number(match[1]) - 1, false);
  }

  function link(event: MouseEvent, index: number) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.replaceState(history.state, '', `#photo-${index + 1}`);
    select(index, false);
  }

  function keyboard(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); select(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  }

  function touchend(event: TouchEvent) {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) select(active + (dx < 0 ? 1 : -1));
  }

  onMount(() => {
    if (!track) return;
    ready = true;
    trackWidth = track.clientWidth;
    const observer = new ResizeObserver(() => {
      if (track.clientWidth !== trackWidth) {
        trackWidth = track.clientWidth;
        select(active, false);
      }
      measure();
    });
    observer.observe(track);
    for (const slide of track.children) observer.observe(slide);
    hash(); sync();
    window.addEventListener('hashchange', hash);
    return () => { observer.disconnect(); window.removeEventListener('hashchange', hash); };
  });
</script>

{#if story.photos.length}
<section class="photo-story" aria-labelledby="photo-story-gallery-title" aria-roledescription="carousel">
  <div class="photo-story__heading">
    <h2 id="photo-story-gallery-title">Galeri Photo Story</h2>
    <span class="photo-story__count" aria-live="polite" aria-atomic="true">{#if ready}Foto {active + 1} / {story.photos.length}{:else}{story.photos.length} foto{/if}</span>
  </div>
  <p class="photo-story__hint">Geser untuk melihat foto lainnya.</p>
  <div bind:this={track} class="photo-story__track" class:is-ready={ready} on:scroll={sync} on:touchstart={(event) => { const touch = event.touches[0]; touchStart = { x: touch.clientX, y: touch.clientY }; }} on:touchend={touchend} on:touchcancel={() => { touchStart = null; }} role="group" aria-label="Foto galeri">
    {#each story.photos as photo, index (photo.galleryId)}
      {@const shortCaption = preview(photo.caption)}
      {@const shortened = shortCaption !== photo.caption}
      <figure id={`photo-${index + 1}`} class="photo-story__figure" inert={ready && index !== active} aria-label={`Foto ${index + 1} dari ${story.photos.length}`} aria-roledescription="slide">
        <a href={photo.url} class="photo-story__image" on:click={(event) => open(event, index)} aria-label={`Perbesar foto ${index + 1}: ${photo.alt}`}>
          <img src={imgUrl(photo.url, 1080) ?? photo.url} srcset={imgSrcset(photo.url, 600)} sizes="(max-width: 767px) calc(100vw - 80px), (max-width: 991px) 60vw, 520px" alt={photo.alt} width={photo.width ?? undefined} height={photo.height ?? undefined} loading="lazy" decoding="async" />
        </a>
        <figcaption>
          <a href={`#photo-${index + 1}`} class="photo-story__number" on:click={(event) => link(event, index)} aria-label={`Tautan foto ${index + 1}`}>Foto {index + 1} / {story.photos.length}</a>
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
  {#if ready && story.photos.length > 1}
    <nav class="photo-story__navigation" aria-label="Navigasi galeri foto">
      <button type="button" class="photo-story__arrow" on:click={() => select(active - 1)} on:keydown={keyboard} aria-label="Foto sebelumnya">‹</button>
      <div bind:this={dots} class="photo-story__dots">
        {#each story.photos as photo, index (photo.galleryId)}
          <button type="button" class="photo-story__dot" class:is-active={index === active} aria-label={`Pilih foto ${index + 1}`} aria-controls={`photo-${index + 1}`} aria-pressed={index === active} on:click={() => select(index)} on:keydown={keyboard}><span></span></button>
        {/each}
      </div>
      <button type="button" class="photo-story__arrow" on:click={() => select(active + 1)} on:keydown={keyboard} aria-label="Foto berikutnya">›</button>
    </nav>
  {/if}
</section>
{/if}

<style>
  .photo-story { min-width: 0; margin-top: 2rem; padding: 1.25rem; border-radius: 16px; color: #fff; background: radial-gradient(circle at top right, color-mix(in srgb, var(--site-accent-glow, #f1ff32) 45%, transparent), transparent 55%), linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #101827 55%, #1f2937 100%); box-shadow: 0 10px 28px rgb(10 10 10 / 15%); }
  .photo-story__heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .5rem; }
  .photo-story__heading h2 { color: #fff; font-size: 1.25rem; font-weight: 800; letter-spacing: -.015em; margin: 0; }
  .photo-story__count { flex: none; padding: .2rem .5rem; border-radius: 5px; color: var(--site-primary-contrast, #111); background: var(--site-primary, #f1ff32); font-size: .8rem; font-weight: 700; }
  .photo-story__hint { margin: 0 0 1rem; color: #d1d5db; font-size: .85rem; }
  .photo-story__track { position: relative; display: flex; align-items: flex-start; width: 100%; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; border: 1px solid rgb(255 255 255 / 12%); border-radius: 10px; background: rgb(255 255 255 / 5%); }
  .photo-story__track.is-ready { touch-action: pan-y pinch-zoom; }
  .photo-story__track.is-ready, .photo-story__dots { scrollbar-width: none; }
  .photo-story__track.is-ready::-webkit-scrollbar, .photo-story__dots::-webkit-scrollbar { display: none; }
  .photo-story__figure { flex: 0 0 100%; min-width: 0; margin: 0; padding: .75rem; scroll-snap-align: start; scroll-margin-top: 110px; }
  .photo-story__image { position: relative; display: block; aspect-ratio: 4 / 3; background: #111; border-radius: 8px; }
  .photo-story__image img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
  .photo-story figcaption { display: flex; flex-direction: column; gap: .75rem; min-width: 0; padding-top: 1rem; color: #fff; font-size: 1rem; line-height: 1.6; }
  .photo-story__number { color: var(--site-primary, #f1ff32); font-size: .8rem; width: fit-content; }
  .photo-story__caption, .photo-story__caption-full, .photo-story__text { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
  .photo-story__credit { color: #d1d5db; font-size: .8rem; overflow-wrap: anywhere; }
  .photo-story__details summary { width: fit-content; min-height: 44px; padding: .65rem .7rem; color: var(--site-primary-contrast, #111); background: var(--site-primary, #f1ff32); border-radius: 5px; font-size: .85rem; font-weight: 600; cursor: pointer; }
  .photo-story__detail-content { display: grid; gap: .75rem; padding-top: .75rem; }
  .photo-story__navigation { display: flex; align-items: center; gap: .5rem; margin-top: .75rem; }
  .photo-story__arrow { flex: none; width: 44px; height: 44px; padding: 0; color: var(--site-primary-contrast, #111); background: var(--site-primary, #f1ff32); border: 0; border-radius: 5px; font-size: 1.75rem; line-height: 1; }
  .photo-story__dots { position: relative; display: flex; flex: 1; min-width: 0; overflow-x: auto; }
  .photo-story__dot { display: grid; place-items: center; flex: 1 0 44px; min-width: 44px; height: 44px; padding: 0; border: 0; background: transparent; }
  .photo-story__dot span { width: 18px; height: 4px; border-radius: 999px; background: #9ca3af; }
  .photo-story__dot.is-active span { width: 26px; background: var(--site-primary, #f1ff32); }
  .photo-story a:focus-visible, .photo-story button:focus-visible, .photo-story summary:focus-visible { outline: 2px solid var(--site-primary, #f1ff32); outline-offset: 2px; }
  @media (min-width: 768px) {
    .photo-story__figure { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 1.25rem; padding: 1rem; }
    .photo-story figcaption { padding: .25rem 0; }
  }
  @media (max-width: 575px) {
    .photo-story { padding: 1rem; }
    .photo-story__heading { align-items: baseline; gap: .5rem; }
    .photo-story__heading h2 { font-size: 1.05rem; }
  }
</style>
