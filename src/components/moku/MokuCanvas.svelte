<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import type { MokuExpression } from '$lib/chat/expressions';
  import type { Moku, MokuClip, MokuFrame, loadMoku } from '$lib/moku/renderer';
  import { MOKU_3D_URL } from '$lib/generated/moku-3d';

  /**
   * Moku-san drawn live from the 2.5D model, filling its container: the chat
   * panel's avatar and the /moku stage. The renderer and three.js come from
   * static/moku/moku-3d.js (scripts/build-moku.mjs), fetched on mount. Until
   * the model is in, and for good where WebGL is unavailable or the visitor
   * saves data, `poster` (a still of the same framing) stands in.
   */

  /** The part of the 1800×1338 illustration to show; a wider or taller box shows more around it. */
  export let frame: MokuFrame;
  export let poster: string;
  /** Draws only while true, e.g. while the chat panel is open. */
  export let active = true;
  export let fps = 30;
  /** When Moku-san waves on arrival: once per visit, every time, or never. */
  export let greet: 'session' | 'always' | 'never' = 'session';

  const MODEL_URL = '/moku/moku.glb?v=1';
  const GREETED_KEY = 'mokultur_moku_greeted';
  // The face's centre in the illustration, for telling a tap on the head from one on the body.
  const FACE: [number, number] = [925, 640];

  const dispatch = createEventDispatcher<{ ready: void }>();

  let canvas: HTMLCanvasElement;
  let moku: Moku | null = null;
  export let ready = false;
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

  /**
   * Which part of Moku-san a point on screen falls on. Mirrors the renderer's
   * framing: a box wider than `frame` widens it about its centre, a taller one
   * adds room above.
   */
  export function partAt(clientX: number, clientY: number): 'head' | 'body' | null {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const [x0, y0, x1, y1] = frame;
    const fw = x1 - x0;
    const fh = y1 - y0;
    let [left, right, top] = [x0, x1, y0];
    if (r.width / r.height > fw / fh) {
      const w = fh * (r.width / r.height);
      left = (x0 + x1) / 2 - w / 2;
      right = left + w;
    } else {
      top = y1 - fw / (r.width / r.height);
    }
    const x = left + ((clientX - r.left) / r.width) * (right - left);
    const y = top + ((clientY - r.top) / r.height) * (y1 - top);
    if (Math.hypot(x - FACE[0], y - FACE[1]) < 330) return 'head';
    if (y > 930 && x > 420 && x < 1560) return 'body';
    return null;
  }

  function frameLoop(now: number) {
    raf = requestAnimationFrame(frameLoop);
    if (now - last < 1000 / fps - 1) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    moku?.update(dt);
  }

  function start() {
    if (raf || !moku) return;
    last = performance.now();
    raf = requestAnimationFrame(frameLoop);
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

  function shouldGreet(): boolean {
    if (greet === 'never') return false;
    if (greet === 'always') return true;
    let greeted = false;
    try {
      greeted = sessionStorage.getItem(GREETED_KEY) === '1';
      sessionStorage.setItem(GREETED_KEY, '1');
    } catch {
      /* storage blocked */
    }
    return !greeted;
  }

  onMount(async () => {
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', follow, { passive: true });
    if (!canAnimate()) return;
    try {
      // A static file, not a Vite import, so the service worker does not precache three.js for everyone.
      const renderer: { loadMoku: typeof loadMoku } = await import(/* @vite-ignore */ MOKU_3D_URL);
      const loaded = await renderer.loadMoku(canvas, MODEL_URL, frame);
      if (destroyed) {
        loaded.dispose();
        return;
      }
      moku = loaded;
      resizer = new ResizeObserver(() => moku?.resize());
      resizer.observe(canvas);
      if (pendingExpression) moku.setExpression(pendingExpression);
      ready = true;
      dispatch('ready');
      if (shouldGreet()) play('Wave');
    } catch (e) {
      // No WebGL, or the model did not load: the still stays.
      console.warn('[moku] unavailable:', e);
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

<span class="moku-canvas" class:is-ready={ready} aria-hidden="true">
  <img src={poster} alt="" decoding="async" />
  <canvas bind:this={canvas}></canvas>
</span>

<style>
  .moku-canvas {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
  }

  .moku-canvas img,
  .moku-canvas canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  /* The still is rendered at the frame's shape and placed as the renderer frames it:
     the whole frame in view, centred across and resting on the bottom edge. */
  .moku-canvas img {
    object-fit: contain;
    object-position: 50% 100%;
  }

  .moku-canvas canvas {
    opacity: 0;
  }

  .moku-canvas.is-ready canvas {
    opacity: 1;
  }

  .moku-canvas.is-ready img {
    visibility: hidden;
  }

  @media (prefers-reduced-motion: no-preference) {
    .moku-canvas canvas {
      transition: opacity 240ms ease-out;
    }
  }
</style>
