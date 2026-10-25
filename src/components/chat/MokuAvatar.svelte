<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { MokuExpression } from '$lib/chat/expressions';
  import type { Moku, MokuClip, MokuFrame, loadMoku } from '$lib/moku/renderer';
  import { MOKU_3D_URL } from '$lib/generated/moku-3d';

  /**
   * Moku's head and shoulders in the chat panel header, drawn live from the
   * 2.5D model. The renderer and three.js come from static/moku/moku-3d.js
   * (scripts/build-moku.mjs), fetched only once the panel opens. It blinks, looks
   * toward the pointer, and takes the face of each reply. Until the model is
   * in, and for good where WebGL is unavailable or the visitor saves data, a
   * still of the same framing stands in.
   */

  /** Draws only while true: the chat panel is open and on screen. */
  export let active = true;

  const MODEL_URL = '/moku/moku.glb?v=1';
  const POSTER_URL = '/moku/moku-avatar.png?v=1';
  // Head and shoulders of the model's 1800×1338 illustration, in a square.
  const FRAME: MokuFrame = [540, 200, 1310, 970];
  // The motion is slow (breathing, drift, blinks); 30 fps is plenty and halves the work on phones.
  const FRAME_MS = 1000 / 30;
  const GREETED_KEY = 'mokultur_moku_greeted';

  let canvas: HTMLCanvasElement;
  let moku: Moku | null = null;
  let ready = false;
  let raf = 0;
  let last = 0;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let resizer: ResizeObserver | undefined;
  // An expression asked for before the model is in; shown as soon as it is.
  let pendingExpression: MokuExpression | null = null;
  let destroyed = false;
  const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  export function express(name: MokuExpression) {
    clearTimeout(holdTimer);
    if (moku) moku.setExpression(name);
    else pendingExpression = name;
  }

  /** Shows `name` for `seconds`, then goes back to netral. */
  export function hold(name: MokuExpression, seconds: number) {
    express(name);
    holdTimer = setTimeout(() => moku?.setExpression('netral'), seconds * 1000);
  }

  /** Mouth movement while words arrive. */
  export function talk(seconds: number) {
    moku?.talk(seconds);
  }

  export function play(name: MokuClip) {
    if (!reduceMotion) moku?.play(name);
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (now - last < FRAME_MS) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    moku?.update(dt);
  }

  function start() {
    if (raf || !moku) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function sync() {
    if (moku && active && !document.hidden) start();
    else stop();
  }

  $: active, ready, typeof document !== 'undefined' && sync();

  /** The 2.4 MB model is only worth fetching where it can be drawn, and not on a data saver. */
  function canAnimate(): boolean {
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
    try {
      const probe = document.createElement('canvas');
      return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
    } catch {
      return false;
    }
  }

  function follow(event: PointerEvent) {
    if (!moku || !active) return;
    const r = canvas.getBoundingClientRect();
    const s = Math.max(260, r.width * 1.2);
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    moku.target.set(clamp((event.clientX - (r.left + r.width / 2)) / s), clamp(-(event.clientY - (r.top + r.height * 0.4)) / s));
  }

  onMount(async () => {
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', follow, { passive: true });
    if (!canAnimate()) return;
    try {
      // A static file, not a Vite import, so the service worker does not precache three.js for everyone.
      const renderer: { loadMoku: typeof loadMoku } = await import(/* @vite-ignore */ MOKU_3D_URL);
      const loaded = await renderer.loadMoku(canvas, MODEL_URL, FRAME);
      if (destroyed) { loaded.dispose(); return; }
      moku = loaded;
      resizer = new ResizeObserver(() => moku?.resize());
      resizer.observe(canvas);
      if (pendingExpression) moku.setExpression(pendingExpression);
      ready = true;
      // A wave the first time Moku shows up in a visit.
      let greeted = false;
      try { greeted = sessionStorage.getItem(GREETED_KEY) === '1'; sessionStorage.setItem(GREETED_KEY, '1'); } catch { /* storage blocked */ }
      if (!greeted) play('Wave');
    } catch (e) {
      // No WebGL, or the model did not load: the still stays.
      console.warn('[moku] avatar unavailable:', e);
    }
  });

  onDestroy(() => {
    destroyed = true;
    if (typeof window === 'undefined') return;
    stop();
    clearTimeout(holdTimer);
    resizer?.disconnect();
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('pointermove', follow);
    moku?.dispose();
    moku = null;
  });
</script>

<span class="moku" class:is-ready={ready} aria-hidden="true">
  <img src={POSTER_URL} alt="" width="48" height="48" decoding="async" />
  <canvas bind:this={canvas}></canvas>
</span>

<style>
  .moku {
    position: relative;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    overflow: hidden;
    border: 2px solid var(--site-primary, #f1ff32);
    border-radius: 12px;
    background: var(--site-primary, #f1ff32);
  }

  .moku img,
  .moku canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .moku canvas {
    opacity: 0;
  }

  .moku.is-ready canvas {
    opacity: 1;
  }

  .moku.is-ready img {
    visibility: hidden;
  }

  @media (prefers-reduced-motion: no-preference) {
    .moku canvas {
      transition: opacity 200ms ease-out;
    }
  }
</style>
