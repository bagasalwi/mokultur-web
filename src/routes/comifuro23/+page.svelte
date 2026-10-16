<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { page } from '$app/stores';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';
  import CF23Render from '$lib/cf23/render.js';
  import type { CardData, Slot, TemplateId } from '$lib/cf23/render.js';
  import { loadCf23Assets } from '$lib/cf23/assets';

  /**
   * mokultur.com/comifuro23 — the CF23 cosplay card generator, ported from the
   * supplied vanilla app.js. Everything happens in the browser: photos are read
   * with object URLs and drawn to a canvas, never uploaded.
   *
   * Built for phones first: the preview sits on top and can be dragged and
   * pinched, the form only shows the days the chosen format uses, and the
   * download/share bar stays on screen.
   */
  type Day = 1 | 2;
  type DayState = { character: string; series: string; accent: string; image: HTMLImageElement | null; url: string | null; fileName: string };
  type Crop = { zoom: number; panX: number; panY: number };

  const R = CF23Render;
  const TITLE = 'Kartu Cosplay Comic Frontier 23 (CF23)';
  const DESCRIPTION = 'Bikin kartu cosplay CF23 untuk feed dan story Instagram: upload foto Day 1 dan Day 2, isi nama dan karakter, lalu download PNG. Gratis, langsung di browser, foto tidak di-upload.';
  const FORMATS: { id: TemplateId; label: string; size: string }[] = [
    { id: 'day1', label: 'Feed Day 1', size: '4:5' },
    { id: 'day2', label: 'Feed Day 2', size: '4:5' },
    { id: 'story', label: 'Story Day 1 + 2', size: '9:16' },
  ];
  const DAY_LABEL: Record<Day, string> = { 1: 'Sabtu, 31 Oktober', 2: 'Minggu, 1 November' };
  const STORE_KEY = 'cf23-card-profile';

  let template = $state<TemplateId>('day1');
  let name = $state('');
  let username = $state('');
  let days = $state<Record<Day, DayState>>({
    1: { character: '', series: '', accent: R.DEFAULT_ACCENT[1], image: null, url: null, fileName: '' },
    2: { character: '', series: '', accent: R.DEFAULT_ACCENT[2], image: null, url: null, fileName: '' },
  });
  // Position and zoom per format per day: the Feed and Story frames are different shapes.
  let crops = $state<Record<string, Crop>>({});
  let status = $state('');
  let statusError = $state(false);
  let busy = $state(false);
  let canShare = $state(false);
  let fontsReady = $state(false);

  let canvas = $state<HTMLCanvasElement>();
  let previewBox = $state<HTMLElement>();
  let actionBar = $state<HTMLElement>();
  let slots: Slot[] = [];
  let frame = 0;

  const activeDays = $derived(R.TEMPLATES[template].days as Day[]);
  const missing = $derived(activeDays.filter((day) => !days[day].image));
  const ready = $derived(missing.length === 0);
  const currentLabel = $derived(FORMATS.find((format) => format.id === template)?.label ?? '');

  function crop(day: Day, id: TemplateId = template): Crop {
    const key = `${id}:${day}`;
    return crops[key] ?? { zoom: 1, panX: 0, panY: -0.4 };
  }

  function setCrop(day: Day, next: Partial<Crop>) {
    const key = `${template}:${day}`;
    crops[key] = { ...crop(day), ...next };
    schedule();
  }

  function buildData(id: TemplateId): CardData {
    const out = {} as CardData['days'];
    for (const day of [1, 2] as Day[]) {
      const state = days[day];
      const c = crop(day, id);
      out[day] = {
        character: state.character,
        series: state.series,
        accent: state.accent,
        photo: state.image ? { image: state.image, zoom: c.zoom, panX: c.panX, panY: c.panY } : null,
      };
    }
    return { name, username, days: out };
  }

  function draw() {
    frame = 0;
    if (!canvas) return;
    const t = R.TEMPLATES[template];
    if (canvas.width !== t.width || canvas.height !== t.height) {
      canvas.width = t.width;
      canvas.height = t.height;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) slots = R.render(ctx, template, buildData(template), { hints: true }).slots;
  }

  function schedule() {
    if (!frame && typeof requestAnimationFrame !== 'undefined') frame = requestAnimationFrame(draw);
  }

  // Redraw whenever anything the card shows changes.
  $effect(() => {
    void [template, name, username, days[1].character, days[1].series, days[1].accent, days[1].image, days[2].character, days[2].series, days[2].accent, days[2].image, fontsReady];
    schedule();
  });

  $effect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ name, username })); } catch { /* private mode */ }
  });

  function setStatus(message: string, isError = false) {
    status = message;
    statusError = isError;
  }

  // ---- Photos --------------------------------------------------------------

  function pickPhoto(day: Day, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const state = days[day];
      if (state.url) URL.revokeObjectURL(state.url);
      days[day] = { ...state, image: img, url, fileName: file.name };
      for (const key of Object.keys(crops)) if (key.endsWith(`:${day}`)) delete crops[key];
      setStatus('');
      schedule();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      input.value = '';
      setStatus('Foto ini tidak bisa dibaca browser. Coba simpan ulang sebagai JPG atau PNG.', true);
    };
    img.src = url;
  }

  function resetCrop(day: Day) {
    delete crops[`${template}:${day}`];
    schedule();
  }

  // ---- Drag & pinch on the preview ------------------------------------------

  type Pointer = { x: number; y: number };
  const pointers = new Map<number, Pointer>();
  let drag: { day: Day; x: number; y: number; panX: number; panY: number; maxX: number; maxY: number } | null = null;
  let pinch: { day: Day; distance: number; zoom: number } | null = null;

  function toCanvas(event: { clientX: number; clientY: number }): Pointer {
    const rect = canvas!.getBoundingClientRect();
    const k = canvas!.width / rect.width;
    return { x: (event.clientX - rect.left) * k, y: (event.clientY - rect.top) * k };
  }

  function hit(p: Pointer): Slot | null {
    return slots.find((s) => days[s.day].image && p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) ?? null;
  }

  function spread(): number {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(event: PointerEvent) {
    const p = toCanvas(event);
    const slot = drag ? slots.find((s) => s.day === drag!.day) ?? null : hit(p);
    if (!slot) return;
    event.preventDefault();
    pointers.set(event.pointerId, p);
    // Capture keeps a drag alive past the canvas edge; some browsers refuse it, which is harmless.
    try { canvas!.setPointerCapture(event.pointerId); } catch { /* not capturable */ }
    if (pointers.size === 2) {
      // Second finger: switch from dragging to pinching the same photo.
      pinch = { day: slot.day, distance: spread(), zoom: crop(slot.day).zoom };
      drag = null;
    } else if (pointers.size === 1) {
      const c = crop(slot.day);
      drag = { day: slot.day, x: p.x, y: p.y, panX: c.panX, panY: c.panY, maxX: slot.maxX, maxY: slot.maxY };
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    const p = toCanvas(event);
    pointers.set(event.pointerId, p);
    if (pinch && pointers.size === 2) {
      setCrop(pinch.day, { zoom: Math.max(1, Math.min(4, pinch.zoom * (spread() / Math.max(1, pinch.distance)))) });
    } else if (drag) {
      const next: Partial<Crop> = {};
      if (drag.maxX > 0) next.panX = Math.max(-1, Math.min(1, drag.panX + (p.x - drag.x) / drag.maxX));
      if (drag.maxY > 0) next.panY = Math.max(-1, Math.min(1, drag.panY + (p.y - drag.y) / drag.maxY));
      setCrop(drag.day, next);
    }
  }

  function onPointerUp(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) drag = null;
    else if (pointers.size === 1 && !drag) {
      // One finger left after a pinch: carry on dragging with it.
      const [rest] = [...pointers.values()];
      const slot = hit(rest);
      if (slot) { const c = crop(slot.day); drag = { day: slot.day, x: rest.x, y: rest.y, panX: c.panX, panY: c.panY, maxX: slot.maxX, maxY: slot.maxY }; }
    }
  }

  function onWheel(event: WheelEvent) {
    const slot = hit(toCanvas(event));
    if (!slot) return;
    event.preventDefault();
    setCrop(slot.day, { zoom: Math.max(1, Math.min(4, crop(slot.day).zoom * Math.exp(-event.deltaY * 0.0015))) });
  }

  // ---- Output --------------------------------------------------------------

  function fileName(id: TemplateId): string {
    const slug = (username || name).toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `cf23-${id}${slug ? `-${slug}` : ''}.png`;
  }

  async function makeFile(): Promise<File> {
    const blob = await R.toBlob(template, buildData(template));
    return new File([blob], fileName(template), { type: 'image/png' });
  }

  async function download() {
    if (!ready || busy) return;
    busy = true;
    setStatus('Menyiapkan gambar…');
    try {
      const file = await makeFile();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`Tersimpan: ${file.name}`);
    } catch {
      setStatus('Gambar gagal dibuat. Coba lagi, atau pakai foto dengan ukuran lebih kecil.', true);
    } finally {
      busy = false;
    }
  }

  /** Phones: hand the PNG to the share sheet, so it can go straight to Photos or Instagram. */
  async function share() {
    if (!ready || busy) return;
    busy = true;
    setStatus('Menyiapkan gambar…');
    try {
      const file = await makeFile();
      await navigator.share({ files: [file], title: 'Kartu Cosplay CF23', text: '#CF23 #Comifuro23 · mokultur.com/comifuro23' });
      setStatus('');
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') setStatus('');
      else setStatus('Tidak bisa membuka menu bagikan. Pakai tombol Download.', true);
    } finally {
      busy = false;
    }
  }

  function scrollToPreview() {
    previewBox?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
      if (saved?.name) name = String(saved.name).slice(0, 40);
      if (saved?.username) username = String(saved.username).slice(0, 32);
    } catch { /* ignore */ }
    // The homepage card passes the name it was typed with.
    const fromLink = $page.url.searchParams.get('nama');
    if (fromLink) name = fromLink.slice(0, 40);

    try {
      const probe = new File([new Blob()], 'probe.png', { type: 'image/png' });
      canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
    } catch { canShare = false; }

    draw();
    void loadCf23Assets().then(async () => { fontsReady = true; await tick(); draw(); });

    // The site's floating chat button rises above a bottom bar through this variable.
    const lift = new ResizeObserver(() => {
      document.body.style.setProperty('--app-bottom-nav', `${actionBar?.offsetHeight ?? 0}px`);
    });
    if (actionBar) lift.observe(actionBar);
    return () => {
      lift.disconnect();
      document.body.style.removeProperty('--app-bottom-nav');
    };
  });

  onDestroy(() => {
    if (typeof URL === 'undefined') return;
    for (const day of [1, 2] as Day[]) if (days[day].url) URL.revokeObjectURL(days[day].url!);
  });
</script>

<svelte:head>
  <title>{TITLE} — Mokultur</title>
  <meta name="description" content={DESCRIPTION} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={absoluteUrl('/comifuro23')} />
  <link rel="preload" href="/fonts/LilitaOne.woff2?v=1" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="/fonts/Baloo2.woff2?v=1" as="font" type="font/woff2" crossorigin="anonymous" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={TITLE} />
  <meta property="og:description" content={DESCRIPTION} />
  <meta property="og:url" content={absoluteUrl('/comifuro23')} />
  <meta property="og:image" content={absoluteUrl('/assets/og/comifuro23.jpg')} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={TITLE} />
  <meta name="twitter:description" content={DESCRIPTION} />
  <meta name="twitter:image" content={absoluteUrl('/assets/og/comifuro23.jpg')} />
  <meta name="theme-color" content="#3E0F3D" />
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Kartu Cosplay CF23', path: '/comifuro23' }]))}<\/script>`}
</svelte:head>

<div class="cf23">
  <header class="cf23-head container-xl">
    <p class="cf23-event"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i>Comic Frontier 23 · ICE BSD · 31 Okt – 1 Nov 2026</p>
    <h1>Kartu cosplay CF23</h1>
    <p class="cf23-lead">Upload foto cosplay-mu, isi nama dan karakter, lalu simpan untuk feed atau story. Semua diproses di HP-mu, fotonya tidak dikirim ke mana pun.</p>
  </header>

  <div class="cf23-layout container-xl">
    <section class="cf23-stage" aria-label="Preview" bind:this={previewBox}>
      <div class="cf23-formats" role="radiogroup" aria-label="Pilih format">
        {#each FORMATS as format}
          <button type="button" role="radio" aria-checked={template === format.id} class:is-active={template === format.id} onclick={() => { template = format.id; setStatus(''); }}>
            {format.label}<small>{format.size}</small>
          </button>
        {/each}
      </div>

      <div class="cf23-canvas" class:is-story={template === 'story'}>
        <canvas
          bind:this={canvas}
          width="1080"
          height="1350"
          aria-label={`Preview ${currentLabel}. Geser untuk mengatur posisi foto.`}
          onpointerdown={onPointerDown}
          onpointermove={onPointerMove}
          onpointerup={onPointerUp}
          onpointercancel={onPointerUp}
          onwheel={onWheel}
        ></canvas>
      </div>
      <p class="cf23-hint"><i class="bi bi-arrows-move" aria-hidden="true"></i>Geser foto di preview untuk atur posisi, cubit (pinch) atau pakai slider untuk zoom.</p>
    </section>

    <form class="cf23-panel" onsubmit={(event) => event.preventDefault()} novalidate>
      <fieldset class="cf23-group">
        <legend>Kamu</legend>
        <label class="cf23-field">
          <span>Nama cosplayer</span>
          <input type="text" bind:value={name} maxlength="40" autocomplete="nickname" enterkeyhint="next" />
        </label>
        <label class="cf23-field">
          <span>Username Instagram / X</span>
          <input type="text" bind:value={username} maxlength="32" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="@username" enterkeyhint="done" />
        </label>
      </fieldset>

      {#each activeDays as day (day)}
        {@const state = days[day]}
        {@const c = crop(day)}
        <fieldset class="cf23-group">
          <legend>Day {day} <small>{DAY_LABEL[day]}</small></legend>

          <label class="cf23-upload" class:has-photo={state.image}>
            <input type="file" accept="image/*" onchange={(event) => pickPhoto(day, event)} />
            <i class="bi {state.image ? 'bi-arrow-repeat' : 'bi-camera-fill'}" aria-hidden="true"></i>
            <span>
              <strong>{state.image ? `Ganti foto Day ${day}` : `Pilih foto Day ${day}`}</strong>
              <small>{state.fileName || 'JPG atau PNG dari galeri'}</small>
            </span>
          </label>

          {#if state.image}
            <div class="cf23-zoom">
              <label class="cf23-field">
                <span>Zoom</span>
                <input type="range" min="1" max="4" step="0.01" value={c.zoom} oninput={(event) => setCrop(day, { zoom: Number(event.currentTarget.value) })} />
              </label>
              <button type="button" class="cf23-ghost" onclick={() => resetCrop(day)}>Reset</button>
            </div>
          {/if}

          <label class="cf23-field">
            <span>Karakter</span>
            <input type="text" bind:value={days[day].character} maxlength="40" enterkeyhint="next" />
          </label>
          <label class="cf23-field">
            <span>Judul series</span>
            <input type="text" bind:value={days[day].series} maxlength="48" enterkeyhint="done" />
          </label>

          <div class="cf23-swatches" role="radiogroup" aria-label={`Warna tulisan Day ${day}`}>
            <span>Warna tulisan</span>
            {#each R.ACCENTS as accent}
              <button
                type="button"
                role="radio"
                aria-checked={state.accent === accent.value}
                aria-label={accent.name}
                title={accent.name}
                style:background={accent.value}
                onclick={() => { days[day].accent = accent.value; }}
              ></button>
            {/each}
          </div>
        </fieldset>
      {/each}

      <p class="cf23-privacy"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i>Foto hanya diproses di perangkatmu dan tidak disimpan oleh Mokultur.</p>
    </form>
  </div>

  <div class="cf23-actions" role="region" aria-label="Simpan kartu" bind:this={actionBar}>
    <div class="cf23-actions__inner container-xl">
      <p class="cf23-status" class:is-error={statusError} role="status" aria-live="polite">
        {#if status}{status}{:else if !ready}Upload foto Day {missing.join(' dan Day ')} dulu untuk menyimpan {currentLabel}.{:else}{currentLabel} siap disimpan.{/if}
      </p>
      <div class="cf23-actions__buttons">
        <button type="button" class="cf23-ghost cf23-ghost--light cf23-to-preview" onclick={scrollToPreview} aria-label="Lihat preview"><i class="bi bi-eye" aria-hidden="true"></i></button>
        {#if canShare}
          <button type="button" class="cf23-primary" onclick={share} disabled={!ready || busy}><i class="bi bi-share-fill" aria-hidden="true"></i>Simpan / Bagikan</button>
          <button type="button" class="cf23-ghost cf23-ghost--light" onclick={download} disabled={!ready || busy} aria-label="Download PNG"><i class="bi bi-download" aria-hidden="true"></i></button>
        {:else}
          <button type="button" class="cf23-primary" onclick={download} disabled={!ready || busy}><i class="bi bi-download" aria-hidden="true"></i>Download PNG</button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .cf23 {
    --plum: #3e0f3d;
    --violet: #683087;
    --lilac: #8154bd;
    --orange: #ff9664;
    --pink: #f52b77;
    --peach: #fdcf9e;
    --cream: #ffece8;
    --brown: #531f12;
    --paper: #fff8f5;
    --display: 'Lilita One', 'Arial Black', sans-serif;
    --body: 'Baloo 2', 'Trebuchet MS', sans-serif;
    background: var(--plum);
    color: var(--cream);
    font-family: var(--body);
  }

  .cf23-head {
    padding-top: clamp(1.5rem, 4vw, 3rem);
    padding-bottom: 0.5rem;

    h1 {
      margin: 0.35rem 0 0.5rem;
      font-family: var(--display);
      font-weight: 400;
      font-size: clamp(2.4rem, 8vw, 4.2rem);
      line-height: 1;
      letter-spacing: 0.02em;
      color: var(--cream);
      -webkit-text-stroke: 8px var(--brown);
      paint-order: stroke fill;
      text-shadow: 0 5px 0 var(--brown);
    }
  }

  .cf23-event {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 0.3rem 0.8rem;
    border: 2px solid var(--cream);
    border-radius: 999px;
    background: var(--brown);
    font-size: 0.875rem;
    font-weight: 800;

    i { color: var(--orange); }
  }

  .cf23-lead {
    max-width: 60ch;
    margin: 0;
    color: var(--peach);
    font-size: 1.05rem;
    line-height: 1.45;
  }

  .cf23-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
    padding-top: 1.25rem;

    @media (min-width: 992px) {
      grid-template-columns: minmax(0, 1fr) minmax(340px, 440px);
      gap: 2.5rem;
      align-items: start;
    }
  }

  .cf23-stage {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
    scroll-margin-top: calc(var(--nav-offset, 100px) + 0.5rem);

    @media (min-width: 992px) {
      position: sticky;
      top: calc(var(--nav-offset, 100px) + 1rem);
    }
  }

  .cf23-formats {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    scrollbar-width: none;
    margin: 0 -0.25rem;
    padding: 0.25rem;

    &::-webkit-scrollbar { display: none; }

    button {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: baseline;
      gap: 0.35rem;
      min-height: 44px;
      padding: 0.45rem 1rem;
      border: 3px solid var(--cream);
      border-radius: 999px;
      background: transparent;
      color: var(--cream);
      font-family: var(--display);
      font-size: 1.05rem;
      letter-spacing: 0.02em;
      cursor: pointer;

      small {
        font-family: var(--body);
        font-size: 0.75rem;
        font-weight: 800;
        opacity: 0.75;
      }
    }

    .is-active {
      border-color: var(--brown);
      background: var(--orange);
      color: var(--brown);
      box-shadow: 3px 3px 0 var(--brown);
    }

    button:focus-visible {
      outline: 3px solid var(--pink);
      outline-offset: 3px;
    }
  }

  .cf23-canvas {
    display: flex;
    justify-content: center;
    padding: 0.75rem;
    border-radius: 1.5rem;
    background: var(--violet);

    canvas {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: min(64svh, 720px);
      border-radius: 0.75rem;
      box-shadow: 6px 6px 0 var(--brown);
      touch-action: none;
      cursor: grab;
    }

    &.is-story canvas {
      max-height: min(72svh, 820px);
    }

    @media (min-width: 992px) {
      padding: 1.25rem;

      canvas { max-height: calc(100svh - var(--nav-offset, 100px) - 12rem); }
      &.is-story canvas { max-height: calc(100svh - var(--nav-offset, 100px) - 12rem); }
    }
  }

  .cf23-hint {
    display: flex;
    gap: 0.45rem;
    margin: 0;
    color: var(--peach);
    font-size: 0.95rem;
    line-height: 1.4;

    i { flex-shrink: 0; margin-top: 0.1rem; }
  }

  .cf23-panel {
    padding: 0.25rem 1.25rem 1.25rem;
    border: 4px solid var(--brown);
    border-radius: 1.5rem;
    background: var(--cream);
    color: var(--brown);
    box-shadow: 6px 6px 0 var(--brown);
  }

  .cf23-group {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-width: 0;
    margin: 0;
    padding: 1.1rem 0;
    border: 0;
    border-bottom: 3px dashed var(--peach);

    legend {
      float: left;
      width: 100%;
      margin-bottom: 0.25rem;
      padding: 0;
      font-family: var(--display);
      font-size: 1.75rem;
      line-height: 1.1;

      small {
        margin-left: 0.4rem;
        color: var(--lilac);
        font-family: var(--body);
        font-size: 1rem;
        font-weight: 800;
      }
    }

    legend + * { clear: both; }
  }

  .cf23-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    > span {
      font-size: 0.95rem;
      font-weight: 800;
    }

    input[type='text'] {
      min-height: 50px;
      padding: 0.6rem 0.9rem;
      border: 3px solid var(--brown);
      border-radius: 14px;
      background: var(--paper);
      color: var(--brown);
      // 16px+ so iOS Safari does not zoom the page on focus.
      font: 600 1.05rem/1.3 var(--body);

      &::placeholder { color: #9a6b5f; }
    }

    input[type='range'] {
      width: 100%;
      min-height: 44px;
      accent-color: var(--pink);
    }
  }

  .cf23-upload {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-height: 64px;
    padding: 0.65rem 1rem;
    border: 3px solid var(--brown);
    border-radius: 16px;
    background: var(--peach);
    box-shadow: 4px 4px 0 var(--brown);
    cursor: pointer;

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    i { font-size: 1.6rem; }

    span {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    strong {
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1.2;
    }

    small {
      overflow: hidden;
      color: #7a4a3e;
      font-size: 0.85rem;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.has-photo { background: #fff; }

    &:focus-within {
      outline: 3px solid var(--pink);
      outline-offset: 2px;
    }
  }

  .cf23-zoom {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;

    .cf23-field { flex: 1; }
  }

  .cf23-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-width: 48px;
    min-height: 48px;
    padding: 0.35rem 0.9rem;
    border: 3px solid var(--brown);
    border-radius: 14px;
    background: transparent;
    color: var(--brown);
    font: 800 1rem var(--body);
    cursor: pointer;

    &:disabled { opacity: 0.45; cursor: not-allowed; }
    &:focus-visible { outline: 3px solid var(--pink); outline-offset: 2px; }
  }

  .cf23-ghost--light {
    border-color: var(--cream);
    color: var(--cream);
    font-size: 1.25rem;
  }

  .cf23-swatches {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;

    > span {
      width: 100%;
      font-size: 0.95rem;
      font-weight: 800;
    }

    button {
      width: 44px;
      height: 44px;
      padding: 0;
      border: 3px solid var(--brown);
      border-radius: 50%;
      cursor: pointer;
    }

    [aria-checked='true'] {
      box-shadow: 0 0 0 3px var(--cream), 0 0 0 6px var(--brown);
    }

    button:focus-visible {
      outline: 3px solid var(--pink);
      outline-offset: 6px;
    }
  }

  .cf23-privacy {
    display: flex;
    gap: 0.45rem;
    margin: 1rem 0 0;
    color: #7a4a3e;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.4;

    i { color: var(--lilac); margin-top: 0.1rem; }
  }

  // Always within thumb reach: the save bar sticks to the bottom of the screen
  // while the generator is in view, and lets go before the site footer.
  .cf23-actions {
    position: sticky;
    bottom: 0;
    z-index: 1020;
    margin-top: 2rem;
    padding: 0.7rem 0 calc(0.7rem + env(safe-area-inset-bottom));
    border-top: 3px solid var(--brown);
    background: color-mix(in srgb, var(--plum) 94%, transparent);
    backdrop-filter: blur(10px);
  }

  .cf23-actions__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .cf23-status {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: var(--peach);
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.3;

    &.is-error { color: #ffb3c8; }
  }

  .cf23-actions__buttons {
    display: flex;
    flex-shrink: 0;
    gap: 0.5rem;
  }

  .cf23-to-preview {
    @media (min-width: 992px) { display: none; }
  }

  .cf23-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 52px;
    padding: 0.4rem 1.15rem;
    border: 3px solid var(--brown);
    border-radius: 16px;
    background: var(--pink);
    color: var(--cream);
    font-family: var(--display);
    font-size: 1.2rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
    box-shadow: 4px 4px 0 var(--brown);
    cursor: pointer;

    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &:not(:disabled):active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 var(--brown); }
    &:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }

    @media (prefers-reduced-motion: no-preference) {
      transition: transform 80ms ease-out, box-shadow 80ms ease-out;
    }
  }

  @media (max-width: 420px) {
    .cf23-status { font-size: 0.8rem; }
    .cf23-primary { padding-inline: 0.85rem; font-size: 1.05rem; }
  }
</style>
