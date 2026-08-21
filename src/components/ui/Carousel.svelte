<script lang="ts" generics="T">
  import { onDestroy, onMount } from 'svelte';

  /** One entry per slide. Slide contents come from the default slot. */
  export let items: T[] = [];
  export let label = 'Anime';
  export let interval = 5500;

  let active = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let paused = false;
  let reduceMotion = false;

  // Drag state. `moved` distinguishes a swipe from a click so links inside a
  // slide keep working.
  let dragging = false;
  let startX = 0;
  let dragX = 0;
  let moved = false;
  let viewport: HTMLDivElement | undefined;

  const DRAG_THRESHOLD = 60;
  const CLICK_SLOP = 10;

  function go(index: number) {
    if (items.length === 0) return;
    active = ((index % items.length) + items.length) % items.length;
  }

  function start() {
    stop();
    if (items.length < 2 || paused || reduceMotion) return;
    timer = setInterval(() => go(active + 1), interval);
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function pause() {
    paused = true;
    stop();
  }

  function resume() {
    paused = false;
    start();
  }

  /** Manual navigation restarts the clock, so a slide never flips mid-read. */
  function select(index: number) {
    go(index);
    start();
  }

  function onPointerDown(e: PointerEvent) {
    if (items.length < 2 || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    dragX = 0;
    pause();
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    dragX = e.clientX - startX;
    if (Math.abs(dragX) > CLICK_SLOP) {
      moved = true;
      // Claim the pointer only once this is clearly a drag, so a plain click
      // still reaches the link underneath.
      viewport?.setPointerCapture(e.pointerId);
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;

    if (viewport?.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);

    if (Math.abs(dragX) >= DRAG_THRESHOLD) {
      select(dragX < 0 ? active + 1 : active - 1);
    }

    dragX = 0;
    resume();
  }

  /** Swallow the click that follows a drag so it does not open the link. */
  function onClickCapture(e: MouseEvent) {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  }

  /**
   * A slight turn, not a full flip: the change reads as a crossfade with a bit
   * of depth behind it. A full 90deg would swing the slide edge-on, which is
   * both showy and briefly blank.
   */
  const TILT = 10;

  /**
   * How far a slide is rotated. The active one follows the finger for live
   * feedback; the rest wait just off-axis on the side they will enter from.
   *
   * State comes in as arguments instead of being read from the closure. A
   * `rotation(i)` that reached for `active` itself hid that dependency from the
   * compiler, so the transform was computed once and then froze — every slide
   * but the first stayed stuck at its initial angle.
   */
  function rotationOf(index: number, current: number, isDragging: boolean, offset: number): number {
    if (index === current) {
      return isDragging ? Math.max(-TILT, Math.min(TILT, (offset / 400) * -TILT)) : 0;
    }
    return index > current ? TILT : -TILT;
  }

  $: rotations = items.map((_, i) => rotationOf(i, active, dragging, dragX));

  onMount(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = query.matches;

    const onChange = (e: MediaQueryListEvent) => {
      reduceMotion = e.matches;
      start();
    };

    query.addEventListener('change', onChange);
    start();

    return () => query.removeEventListener('change', onChange);
  });

  // Without this the interval keeps firing against a destroyed component after
  // the user navigates away.
  onDestroy(stop);
</script>

{#if items.length}
  <section
    class="carousel"
    aria-roledescription="carousel"
    aria-label={label}
    on:mouseenter={pause}
    on:mouseleave={resume}
    on:focusin={pause}
    on:focusout={resume}
  >
    <!-- The viewport is a drag surface, not a control: keyboard users get the
         prev/next buttons and dots below, which do the same job. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="carousel__viewport"
      class:carousel__viewport--dragging={dragging}
      bind:this={viewport}
      on:pointerdown={onPointerDown}
      on:pointermove={onPointerMove}
      on:pointerup={onPointerUp}
      on:pointercancel={onPointerUp}
      on:click|capture={onClickCapture}
    >
      {#each items as item, i (i)}
        <div
          class="carousel__slide"
          class:carousel__slide--active={i === active}
          style={`transform: rotateY(${rotations[i]}deg)`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} dari ${items.length}`}
          aria-hidden={i !== active}
          inert={i !== active ? true : undefined}
        >
          <slot {item} index={i} />
        </div>
      {/each}
    </div>

    {#if items.length > 1}
      <button class="carousel__nav carousel__nav--prev" type="button" on:click={() => select(active - 1)} aria-label="Slide sebelumnya">
        <i class="bi bi-chevron-left"></i>
      </button>
      <button class="carousel__nav carousel__nav--next" type="button" on:click={() => select(active + 1)} aria-label="Slide berikutnya">
        <i class="bi bi-chevron-right"></i>
      </button>

      <div class="carousel__dots" role="tablist" aria-label="Pilih slide">
        {#each items as _, i (i)}
          <button
            type="button"
            role="tab"
            class="carousel__dot"
            class:carousel__dot--active={i === active}
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            on:click={() => select(i)}
          ></button>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .carousel {
    position: relative;
    /* The arrows overlay the slide, so whether they fit depends on the
       carousel's own width — it is only 40% of the row on the homepage. */
    container-type: inline-size;
  }

  .carousel__viewport {
    display: grid;
    /* Depth for the flip; without it rotateY just squashes the slide flat. */
    perspective: 1600px;
    cursor: grab;
    /* Horizontal drags belong to the carousel, vertical ones to the page. */
    touch-action: pan-y;
  }

  .carousel__viewport--dragging {
    cursor: grabbing;
  }

  /* Slides are stacked so the carousel keeps the height of its tallest slide
     and never jumps as content changes length.

     The change is a crossfade with a slight turn behind it: both slides move at
     once, so the outgoing one is still fading while the incoming is arriving and
     there is never a gap. Keeping the angle small is what stops it reading as a
     showy card flip. */
  .carousel__slide {
    grid-area: 1 / 1;
    opacity: 0;
    /* Inactive slides sit on top of the active one in paint order, so without
       this they would swallow clicks meant for the visible slide. */
    pointer-events: none;
    transform-origin: center center;
    backface-visibility: hidden;
    transition:
      transform 0.35s cubic-bezier(0.33, 1, 0.68, 1),
      opacity 0.3s ease;
  }

  .carousel__slide--active {
    opacity: 1;
    pointer-events: auto;
  }

  .carousel__viewport--dragging .carousel__slide {
    /* Follow the finger without easing lag. */
    transition: none;
  }

  .carousel__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 1.1rem;
    opacity: 0;
    transition: opacity 0.2s ease, background-color 0.2s ease;
  }

  .carousel:hover .carousel__nav,
  .carousel__nav:focus-visible {
    opacity: 1;
  }

  .carousel__nav:hover {
    background: var(--site-primary, #55ad9b);
  }

  .carousel__nav--prev {
    left: 0.6rem;
  }

  .carousel__nav--next {
    right: 0.6rem;
  }

  .carousel__dots {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 0.75rem;
  }

  .carousel__dot {
    width: 0.5rem;
    height: 0.5rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.2);
    transition: width 0.25s ease, background-color 0.25s ease;
  }

  .carousel__dot--active {
    width: 1.4rem;
    background: var(--site-primary, #55ad9b);
  }

  @media (prefers-reduced-motion: reduce) {
    .carousel__slide {
      transition: opacity 0.2s ease;
      transform: none !important;
    }
  }

  /* Too narrow for arrows that sit on top of the content — the dots below
     stay, and they do the same job. */
  @container (max-width: 420px) {
    .carousel__nav {
      display: none;
    }
  }
</style>
