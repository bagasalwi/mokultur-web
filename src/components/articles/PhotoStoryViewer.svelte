<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { PhotoStory } from '$lib/api';
  import { imgUrl } from '$lib/img';
  export let story: PhotoStory;
  let dialog: HTMLDialogElement;
  let active = 0, zoomed = false;
  let previousOverflow: string | null = null;
  let previousFocus: HTMLElement | null = null;
  let touchStart: { x: number; y: number } | null = null;
  $: photo = story.photos[active];
  export function open(index: number) {
    if (!story.photos[index]) return;
    active = index; zoomed = false;
    if (!dialog.open) {
      previousOverflow = document.body.style.overflow;
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.style.overflow = 'hidden'; dialog.showModal();
    }
  }
  function close() { dialog?.close(); }
  function restore() {
    if (previousOverflow !== null) { document.body.style.overflow = previousOverflow; previousOverflow = null; }
    previousFocus?.focus(); previousFocus = null;
  }
  async function select(index: number) {
    active = (index + story.photos.length) % story.photos.length; zoomed = false;
    await tick(); dialog?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function keyboard(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); void select(active + (event.key === 'ArrowRight' ? 1 : -1)); }
  }
  function touchend(event: TouchEvent) {
    if (!touchStart || zoomed) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) void select(active + (dx < 0 ? 1 : -1));
    touchStart = null;
  }
  onDestroy(() => { close(); restore(); });
</script>

<dialog bind:this={dialog} class="story-viewer" aria-labelledby="story-viewer-title" on:keydown={keyboard} on:close={restore}>
  <div class="story-viewer__shell">
    <header><h2 id="story-viewer-title">Foto {active + 1} / {story.photos.length}</h2><button type="button" on:click={() => zoomed = !zoomed} aria-pressed={zoomed}>{zoomed ? 'Sesuaikan foto' : 'Perbesar foto'}</button><button type="button" on:click={close} aria-label="Tutup galeri">Tutup ×</button></header>
    {#if photo}
      <div class="story-viewer__stage" class:zoomed on:touchstart={(event) => { const touch = event.touches[0]; touchStart = { x: touch.clientX, y: touch.clientY }; }} on:touchend={touchend} role="group" aria-label="Foto, geser untuk berpindah"><img src={imgUrl(photo.url, 1600) ?? photo.url} alt={photo.alt} width={photo.width ?? undefined} height={photo.height ?? undefined} /></div>
      <div class="story-viewer__details" aria-live="polite"><p>{photo.caption}</p>{#if photo.credit}<small>Foto: {photo.credit}</small>{/if}</div>
      <nav class="story-viewer__navigation" aria-label="Navigasi foto">
        <button type="button" on:click={() => select(active - 1)} aria-label="Foto sebelumnya">‹ Sebelumnya</button>
        <div class="story-viewer__thumbnails">{#each story.photos as item, index (item.galleryId)}<button type="button" on:click={() => select(index)} aria-current={index === active ? 'true' : undefined} aria-label={`Lihat foto ${index + 1}`}><img src={imgUrl(item.url, 160) ?? item.url} alt="" loading="lazy" /></button>{/each}</div>
        <button type="button" on:click={() => select(active + 1)} aria-label="Foto berikutnya">Berikutnya ›</button>
      </nav>
    {/if}
  </div>
</dialog>

<style>
  .story-viewer { width: 100%; max-width: none; height: 100%; max-height: none; margin: 0; padding: 0; border: 0; background: #111; color: #fff; }
  .story-viewer::backdrop { background: #111; }
  .story-viewer__shell { height: 100dvh; display: flex; flex-direction: column; }
  header { display: flex; gap: .5rem; align-items: center; padding: .75rem; flex-shrink: 0; }
  h2 { color: #fff; font-size: 1rem; margin: 0 auto 0 0; }
  button { color: #fff; background: #222; border: 1px solid #666; border-radius: 5px; padding: .5rem .75rem; font: inherit; font-size: .85rem; min-height: 44px; }
  button:hover, button[aria-pressed="true"] { color: var(--site-primary, #f1ff32); border-color: var(--site-primary, #f1ff32); }
  button:focus-visible { outline: 3px solid var(--site-primary, #f1ff32); outline-offset: 2px; }
  .story-viewer__stage { flex: 1; min-height: 0; overflow: auto; display: flex; align-items: center; justify-content: center; touch-action: pan-y; }
  .story-viewer__stage img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
  .story-viewer__stage.zoomed { display: block; touch-action: auto; }
  .story-viewer__stage.zoomed img { max-width: none; max-height: none; width: max(100%, 1600px); height: auto; }
  .story-viewer__details { padding: .6rem 1rem; max-height: 24vh; overflow: auto; flex-shrink: 0; overflow-wrap: anywhere; }
  .story-viewer__details p { margin: 0; white-space: pre-line; font-size: .95rem; }
  .story-viewer__details small { color: #ccc; }
  .story-viewer__navigation { display: flex; align-items: center; gap: .75rem; padding: .75rem; flex-shrink: 0; }
  .story-viewer__navigation > button { flex-shrink: 0; }
  .story-viewer__thumbnails { flex: 1; min-width: 0; display: flex; gap: .5rem; padding: 4px; overflow-x: auto; }
  .story-viewer__thumbnails button { padding: 0; flex-shrink: 0; width: 64px; height: 48px; overflow: hidden; }
  .story-viewer__thumbnails button[aria-current="true"] { border: 3px solid var(--site-primary, #f1ff32); }
  .story-viewer__thumbnails img { width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 575px) { .story-viewer__navigation { flex-wrap: wrap; gap: .5rem; } .story-viewer__thumbnails { order: 3; flex-basis: 100%; } .story-viewer__navigation > button:last-child { margin-left: auto; } header button { padding-inline: .5rem; } }
</style>
