<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { absoluteUrl, buildBreadcrumb } from '$lib/seo';
  import CF23Render from '$lib/cf23/render.js';
  import type { CardData, Slot, TemplateId } from '$lib/cf23/render.js';
  import { loadCf23Assets } from '$lib/cf23/assets';

  /**
   * mokultur.com/comifuro23 — the CF23 Cosplan Card generator (a cosplan is
   * who you will cosplay on each day of the event), ported from the
   * supplied vanilla app.js. Everything happens in the browser: photos are read
   * with object URLs and drawn to a canvas, never uploaded.
   *
   * Built for phones first: the preview sits on top and can be dragged and
   * pinched, the form only shows the days the chosen format uses, and the
   * download bar stays on screen.
   */
  type Day = 1 | 2;
  /** `image` is the original, used for the PNG; `preview` is a smaller copy redrawn on every drag frame. */
  type DayState = { character: string; series: string; accent: string; image: HTMLImageElement | null; preview: HTMLImageElement | null; url: string | null; fileName: string };
  type Crop = { zoom: number; panX: number; panY: number };

  let { data } = $props();

  const R = CF23Render;
  const HASHTAGS = '#CF23 #Comifuro23 #Cosplan #Mokultur';
  const ALL: TemplateId[] = ['day1', 'day2', 'story'];
  const TITLE = 'Cosplan Card Comic Frontier 23 (CF23)';
  const DESCRIPTION = 'Bikin Cosplan Card CF23: umumkan rencana cosplay Day 1 dan Day 2 di feed dan story Instagram. Upload foto, isi nama dan karakter, lalu download PNG. Gratis, langsung di browser, foto tidak di-upload.';
  /** `title`/`sub` are the two lines of the format switch; `label` is the full name used in messages. */
  const FORMATS: { id: TemplateId; label: string; title: string; sub: string }[] = [
    { id: 'day1', label: 'Feed Day 1', title: 'Day 1', sub: 'Feed · 4:5' },
    { id: 'day2', label: 'Feed Day 2', title: 'Day 2', sub: 'Feed · 4:5' },
    { id: 'story', label: 'Story Day 1 + 2', title: 'Story', sub: 'Day 1+2 · 9:16' },
  ];
  const DAY_LABEL: Record<Day, string> = { 1: 'Sabtu, 31 Oktober', 2: 'Minggu, 1 November' };
  const STORE_KEY = 'cf23-card-profile';

  let template = $state<TemplateId>('day1');
  let name = $state('');
  let days = $state<Record<Day, DayState>>({
    1: { character: '', series: '', accent: R.DEFAULT_ACCENT[1], image: null, preview: null, url: null, fileName: '' },
    2: { character: '', series: '', accent: R.DEFAULT_ACCENT[2], image: null, preview: null, url: null, fileName: '' },
  });
  // Position and zoom per format per day: the Feed and Story frames are different shapes.
  let crops = $state<Record<string, Crop>>({});
  let status = $state('');
  let statusError = $state(false);
  let busy = $state(false);
  let fontsReady = $state(false);
  // Touch screens: the preview fills most of a phone screen, so it only takes
  // over touches (drag, pinch) in "Atur foto" mode; otherwise it scrolls the page.
  let coarse = $state(false);
  let adjusting = $state(false);
  const hasPhoto = $derived(activeDaysHavePhoto());
  const editable = $derived(!coarse || adjusting);

  let canvas = $state<HTMLCanvasElement>();
  let previewBox = $state<HTMLElement>();
  let slots: Slot[] = [];
  let frame = 0;

  const activeDays = $derived(R.TEMPLATES[template].days as Day[]);
  function activeDaysHavePhoto(): boolean {
    return (R.TEMPLATES[template].days as Day[]).some((day) => days[day].image);
  }
  const currentLabel = $derived(FORMATS.find((format) => format.id === template)?.label ?? '');
  // Every format whose photos are in: saving always takes all of them at once.
  const readyFormats = $derived(ALL.filter((id) => (R.TEMPLATES[id].days as Day[]).every((day) => days[day].image)));
  const readyLabel = $derived(readyFormats.map((id) => FORMATS.find((format) => format.id === id)?.label ?? id).join(', '));
  /** The first day still without a photo, Day 1 before Day 2. */
  const nextMissing = $derived(([1, 2] as Day[]).find((day) => !days[day].image) ?? null);

  // Mokultur's Instagram, from the site's social links, for the posting call to action.
  const instagram = $derived.by(() => {
    const link = (data?.socials ?? []).find((social: { platform: string; username: string }) => /instagram/i.test(social.platform) && social.username?.startsWith('@'));
    return { handle: link?.username ?? '@mokultur', url: link?.url ?? 'https://www.instagram.com/mokultur/' };
  });

  /** A ready-to-paste caption from what the visitor typed: the cosplan, one line per day. */
  const caption = $derived.by(() => {
    const who = (day: Day) => {
      const { character, series } = days[day];
      const c = character.trim();
      const t = series.trim();
      return c && t ? `${c} (${t})` : c || t;
    };
    const [one, two] = [who(1), who(2)];
    const plan = one && two && one === two
      ? [`Day 1 & 2: ${one}`]
      : [one && `Day 1: ${one}`, two && `Day 2: ${two}`].filter(Boolean);
    return [
      'Cosplan Comic Frontier 23 ✨', ...plan, '',
      '📍 ICE BSD · 31 Okt – 1 Nov 2026', 'Sampai ketemu di CF23! Bikin Cosplan Card-mu di mokultur.com/comifuro23', '',
      `${instagram.handle} ${HASHTAGS}`,
    ].join('\n');
  });
  let copied = $state(false);

  function crop(day: Day, id: TemplateId = template): Crop {
    const key = `${id}:${day}`;
    return crops[key] ?? { zoom: 1, panX: 0, panY: -0.4 };
  }

  function setCrop(day: Day, next: Partial<Crop>) {
    const key = `${template}:${day}`;
    crops[key] = { ...crop(day), ...next };
    schedule();
  }

  /** `final` draws the original photos (the PNG); otherwise the light preview copies. */
  function buildData(id: TemplateId, final = false): CardData {
    const out = {} as CardData['days'];
    for (const day of [1, 2] as Day[]) {
      const state = days[day];
      const c = crop(day, id);
      out[day] = {
        character: state.character,
        series: state.series,
        accent: state.accent,
        photo: state.image ? { image: final ? state.image : state.preview ?? state.image, zoom: c.zoom, panX: c.panX, panY: c.panY } : null,
      };
    }
    return { name, username: null, days: out };
  }

  function draw() {
    frame = 0;
    // One first render, once the fonts are in: drawing before them meant three
    // full renders during page load, the bulk of its main-thread time on phones.
    if (!canvas || !fontsReady) return;
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
    void [template, name, days[1].character, days[1].series, days[1].accent, days[1].image, days[2].character, days[2].series, days[2].accent, days[2].image, fontsReady];
    schedule();
  });

  $effect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ name })); } catch { /* private mode */ }
  });

  function setStatus(message: string, isError = false) {
    status = message;
    statusError = isError;
  }

  // ---- Photos --------------------------------------------------------------

  /**
   * Phone photos are often 12 MP or more (about 48 MB each once decoded). The
   * preview works from a copy at most PREVIEW_EDGE on its long side, so the
   * original is only decoded when the PNG is made — that keeps memory down on
   * phones (iOS Safari is strict). The copy is an <img>, not an ImageBitmap or
   * canvas: Chrome caches the high-quality downscale of an <img>, while a bitmap
   * drawn with imageSmoothingQuality 'high' was measured 4x slower per frame.
   */
  const PREVIEW_EDGE = 2048;
  async function previewCopy(img: HTMLImageElement): Promise<HTMLImageElement> {
    const long = Math.max(img.naturalWidth, img.naturalHeight);
    if (long <= PREVIEW_EDGE) return img;
    const k = PREVIEW_EDGE / long;
    const copy = document.createElement('canvas');
    copy.width = Math.round(img.naturalWidth * k);
    copy.height = Math.round(img.naturalHeight * k);
    const ctx = copy.getContext('2d');
    if (!ctx) return img;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, copy.width, copy.height);
    const blob = await new Promise<Blob | null>((resolve) => copy.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return img;
    const small = new Image();
    small.src = URL.createObjectURL(blob);
    try { await small.decode(); } catch { URL.revokeObjectURL(small.src); return img; }
    return small;
  }

  function releasePreview(state: DayState) {
    if (state.preview instanceof HTMLImageElement && state.preview !== state.image && state.preview.src.startsWith('blob:')) URL.revokeObjectURL(state.preview.src);
  }

  function pickPhoto(day: Day, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const preview = await previewCopy(img);
      const state = days[day];
      if (state.url) URL.revokeObjectURL(state.url);
      releasePreview(state);
      days[day] = { ...state, image: img, preview, url, fileName: file.name };
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
    if (event.pointerType !== 'mouse' && !editable) return;
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
    const slug = name.toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `cf23-cosplan-card-${id}${slug ? `-${slug}` : ''}.png`;
  }

  async function makeFile(id: TemplateId = template): Promise<File> {
    const blob = await R.toBlob(id, buildData(id, true));
    return new File([blob], fileName(id), { type: 'image/png' });
  }

  function saveFile(file: File) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /**
   * Saves every ready format in one go: Feed Day 1 and Day 2 as soon as their
   * photo is in, and Story once both are. Always a plain download (no share
   * sheet), one PNG after another; a browser may ask once to allow multiple
   * downloads.
   */
  async function saveAll() {
    if (busy) return;
    if (!readyFormats.length) { pickMissing(); return; }
    const ids = [...readyFormats];
    busy = true;
    setStatus(ids.length > 1 ? `Menyiapkan ${ids.length} gambar…` : 'Menyiapkan gambar…');
    const more = nextMissing ? ` Tambah foto Day ${nextMissing} untuk format lainnya.` : '';
    try {
      const files: File[] = [];
      for (const id of ids) files.push(await makeFile(id));
      for (const [index, file] of files.entries()) {
        if (index) await new Promise((resolve) => setTimeout(resolve, 450));
        saveFile(file);
      }
      setStatus(`${files.length} PNG tersimpan. Posting dan tag ${instagram.handle}!${more}`);
    } catch {
      setStatus('Gambar gagal dibuat. Coba lagi, atau pakai foto dengan ukuran lebih kecil.', true);
    } finally {
      busy = false;
    }
  }

  /**
   * The three templates without name, character, series or photo, with the
   * photo windows transparent, for people who lay the card over a photo in
   * their own editor. Needs no photo; uses the colours picked for each day.
   */
  let busyBlank = $state(false);
  async function downloadBlank() {
    if (busyBlank) return;
    busyBlank = true;
    setStatus('Menyiapkan template polosan…');
    try {
      const data = buildData('day1');
      const files: File[] = [];
      for (const id of ALL) {
        const blob = await R.toBlob(id, data, 'image/png', { blank: true });
        files.push(new File([blob], `cf23-cosplan-card-template-${id}.png`, { type: 'image/png' }));
      }
      for (const [index, file] of files.entries()) {
        if (index) await new Promise((resolve) => setTimeout(resolve, 450));
        saveFile(file);
      }
      setStatus('3 template polosan tersimpan. Area fotonya transparan.');
    } catch {
      setStatus('Template gagal dibuat. Coba lagi.', true);
    } finally {
      busyBlank = false;
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      copied = true;
      setTimeout(() => (copied = false), 2200);
    } catch {
      setStatus('Caption tidak bisa disalin otomatis. Tahan teksnya lalu pilih Salin.', true);
    }
  }

  /** The save bar's first job: while no format is ready, its main button picks the next photo. */
  function pickMissing() {
    const input = document.getElementById(`cf23-photo-${nextMissing ?? 1}`) as HTMLInputElement | null;
    input?.click();
  }

  function scrollToPreview() {
    previewBox?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
      if (saved?.name) name = String(saved.name).slice(0, 40);
    } catch { /* ignore */ }
    // The homepage card passes the name it was typed with.
    const fromLink = $page.url.searchParams.get('nama');
    if (fromLink) name = fromLink.slice(0, 40);


    // loadCf23Assets never rejects; the timer only covers a font request that hangs.
    coarse = window.matchMedia('(pointer: coarse)').matches;
    const fallback = setTimeout(() => (fontsReady = true), 3000);
    void loadCf23Assets().then(() => { clearTimeout(fallback); fontsReady = true; });
  });

  onDestroy(() => {
    // onDestroy also runs after server rendering, where there are no DOM classes or object URLs.
    if (typeof window === 'undefined') return;
    for (const day of [1, 2] as Day[]) {
      if (days[day].url) URL.revokeObjectURL(days[day].url!);
      releasePreview(days[day]);
    }
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
  <meta property="og:image" content={absoluteUrl('/assets/og/comifuro23.jpg?v=6')} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={TITLE} />
  <meta name="twitter:description" content={DESCRIPTION} />
  <meta name="twitter:image" content={absoluteUrl('/assets/og/comifuro23.jpg?v=6')} />
  <meta name="theme-color" content="#3E0F3D" />
  {@html `<script type="application/ld+json">${JSON.stringify(buildBreadcrumb([{ name: 'Cosplan Card CF23', path: '/comifuro23' }]))}<\/script>`}
</svelte:head>

<div class="cf23">
  <header class="cf23-head container-xl">
    <h1>Cosplan Card CF23</h1>
    <p class="cf23-meta"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i>Comic Frontier 23 · ICE BSD · 31 Okt – 1 Nov 2026</p>
    <p class="cf23-lead">Umumkan cosplan-mu: mau jadi siapa di Day 1 dan Day 2. Upload foto cosplay atau costest-mu, isi nama dan karakter, lalu simpan untuk feed atau story. Fotonya tetap di HP-mu, tidak dikirim ke mana pun.</p>
  </header>

  <div class="cf23-layout container-xl">
    <section class="cf23-stage" aria-label="Preview" bind:this={previewBox}>
      <div class="cf23-formats" role="radiogroup" aria-label="Pilih format">
        {#each FORMATS as format}
          <button type="button" role="radio" aria-checked={template === format.id} class:is-active={template === format.id} onclick={() => { template = format.id; adjusting = false; setStatus(''); }}>
            <span>{format.title}</span><small>{format.sub}</small>
          </button>
        {/each}
      </div>

      <div class="cf23-canvas" class:is-story={template === 'story'} class:is-adjusting={coarse && adjusting}>
        <canvas
          bind:this={canvas}
          style:touch-action={editable ? 'none' : 'pan-y'}
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
      {#if hasPhoto}
        <div class="cf23-tools">
          {#if coarse}
            <button type="button" class="cf23-adjust" class:is-on={adjusting} aria-pressed={adjusting} onclick={() => (adjusting = !adjusting)}>
              <i class="bi {adjusting ? 'bi-check2' : 'bi-arrows-move'}" aria-hidden="true"></i>{adjusting ? 'Selesai' : 'Atur foto'}
            </button>
          {/if}
          <p class="cf23-hint">
            {#if !coarse}<i class="bi bi-arrows-move" aria-hidden="true"></i>Geser foto untuk atur posisi, scroll atau pakai slider untuk zoom.
            {:else if adjusting}Geser foto, cubit (pinch) untuk zoom. Ketuk Selesai untuk lanjut scroll.
            {:else}Ketuk Atur foto untuk menggeser dan zoom foto.{/if}
          </p>
        </div>
      {/if}
    </section>

    <form class="cf23-panel" onsubmit={(event) => event.preventDefault()} novalidate>
      <fieldset class="cf23-group cf23-group--you" aria-label="Nama atau Instagram">
        <label class="cf23-field">
          <span>Nama/Instagram kamu</span>
          <input type="text" bind:value={name} maxlength="40" autocomplete="nickname" autocapitalize="off" spellcheck="false" placeholder="Rina atau @rinacos" enterkeyhint="done" />
        </label>
      </fieldset>

      <!-- Both days always: a visitor fills Day 1 and Day 2 in one go, whatever the preview shows. -->
      {#each [1, 2] as const as day (day)}
        {@const state = days[day]}
        {@const c = crop(day)}
        {@const inUse = activeDays.includes(day)}
        <fieldset class="cf23-group">
          <legend>Day {day} <small>{DAY_LABEL[day]}</small></legend>

          <label class="cf23-upload" class:has-photo={state.image}>
            <input id={`cf23-photo-${day}`} type="file" accept="image/*" onchange={(event) => pickPhoto(day, event)} />
            <i class="bi {state.image ? 'bi-arrow-repeat' : 'bi-camera-fill'}" aria-hidden="true"></i>
            <span>
              <strong>{state.image ? `Ganti foto Day ${day}` : `Pilih foto Day ${day}`}</strong>
              <small>{state.fileName || 'JPG atau PNG dari galeri'}</small>
            </span>
          </label>

          {#if state.image && !inUse}
            <button type="button" class="cf23-ghost cf23-show-day" onclick={() => { template = day === 1 ? 'day1' : 'day2'; adjusting = false; }}>
              <i class="bi bi-eye" aria-hidden="true"></i>Lihat & atur foto Day {day} di preview
            </button>
          {:else if state.image}
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

    <section class="cf23-post" aria-labelledby="cf23-post-title">
      <h2 id="cf23-post-title">Posting <span class="cf23-nowrap">Cosplan Card-mu!</span></h2>
      <p class="cf23-post__lead">Umumkan cosplan-mu di Instagram sebelum hari-H dan tag <a href={instagram.url} target="_blank" rel="noopener noreferrer">{instagram.handle}</a> biar kami bisa lihat. Pakai <strong>#CF23 #Comifuro23</strong> ya!</p>

      <ol class="cf23-post__steps">
        <li><span>1</span>Simpan Cosplan Card: semua format yang siap tersimpan sekaligus.</li>
        <li><span>2</span>Posting Feed Day 1 / Day 2, dan Story Day 1 + 2 di Instagram.</li>
        <li><span>3</span>Tempel caption di bawah, lalu tag {instagram.handle}.</li>
      </ol>

      <button type="button" class="cf23-all" onclick={saveAll} disabled={!readyFormats.length || busy}>
        <i class="bi bi-download" aria-hidden="true"></i>
        <span>
          <strong>Download semua ({readyFormats.length || 3} PNG)</strong>
          <small>{readyFormats.length ? readyLabel : 'Upload foto Day 1 dan Day 2 dulu'}</small>
        </span>
      </button>

      <label class="cf23-caption">
        <span>Caption</span>
        <textarea readonly rows="7" value={caption}></textarea>
      </label>
      <div class="cf23-post__actions">
        <button type="button" class="cf23-ghost cf23-ghost--cream" onclick={copyCaption}><i class="bi {copied ? 'bi-check2' : 'bi-clipboard'}" aria-hidden="true"></i>{copied ? 'Tersalin!' : 'Salin caption'}</button>
        <a class="cf23-ghost cf23-ghost--cream" href={instagram.url} target="_blank" rel="noopener noreferrer"><i class="bi bi-instagram" aria-hidden="true"></i>Buka Instagram</a>
      </div>

      <button type="button" class="cf23-blank" onclick={downloadBlank} disabled={busyBlank}>
        <i class="bi bi-download" aria-hidden="true"></i>
        <span>
          <strong>Download template polosan (3 PNG)</strong>
          <small>Tanpa nama, karakter, series & foto. Area foto transparan, tinggal taruh fotomu di bawahnya.</small>
        </span>
      </button>
    </section>
  </div>

  <div class="cf23-actions" role="region" aria-label="Simpan Cosplan Card">
    <div class="cf23-actions__inner container-xl">
      <p class="cf23-status" class:is-error={statusError} role="status" aria-live="polite">{status}</p>
      <div class="cf23-actions__buttons">
        <button type="button" class="cf23-ghost cf23-ghost--light cf23-to-preview" onclick={scrollToPreview} aria-label="Lihat preview"><i class="bi bi-eye" aria-hidden="true"></i></button>
        {#if !readyFormats.length}
          <button type="button" class="cf23-primary" onclick={pickMissing}><i class="bi bi-camera-fill" aria-hidden="true"></i>Upload foto Day {nextMissing ?? 1}</button>
        {:else}
          <button type="button" class="cf23-primary" onclick={saveAll} disabled={busy}>
            <i class="bi bi-download" aria-hidden="true"></i>Download {readyFormats.length > 1 ? `semua (${readyFormats.length})` : 'PNG'}
          </button>
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
    // The site footer keeps a 4rem top margin (custom.scss) that shows as a white
    // strip under this full-bleed page; pull the footer up against the plum.
    margin-bottom: -4rem;
  }

  .cf23-head {
    padding-top: clamp(1.25rem, 4vw, 3rem);
    padding-bottom: 0.25rem;

    h1 {
      margin: 0 0 0.45rem;
      font-family: var(--display);
      font-weight: 400;
      font-size: clamp(2.2rem, 9.5vw, 4.2rem);
      line-height: 1;
      letter-spacing: 0.02em;
      color: var(--cream);
      -webkit-text-stroke: 8px var(--brown);
      paint-order: stroke fill;
      text-shadow: 0 5px 0 var(--brown);
    }
  }

  .cf23-meta {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin: 0 0 0.5rem;
    color: var(--cream);
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1.35;

    i { color: var(--orange); }
  }

  .cf23-lead {
    max-width: 60ch;
    margin: 0;
    color: var(--peach);
    font-size: 1rem;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .cf23-nowrap { white-space: nowrap; }

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

  // All three formats in view at once on a phone: an even, three-part switch.
  .cf23-formats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
    max-width: 30rem;

    button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.05rem;
      min-height: 56px;
      padding: 0.35rem 0.25rem;
      border: 3px solid var(--cream);
      border-radius: 16px;
      background: transparent;
      color: var(--cream);
      cursor: pointer;

      span {
        font-family: var(--display);
        font-size: 1.15rem;
        line-height: 1.05;
        letter-spacing: 0.02em;
      }

      small {
        font-size: 0.75rem;
        font-weight: 800;
        line-height: 1.2;
        opacity: 0.8;
        white-space: nowrap;
      }
    }

    .is-active {
      border-color: var(--brown);
      background: var(--orange);
      color: var(--brown);
      box-shadow: 3px 3px 0 var(--brown);

      small { opacity: 1; }
    }

    button:focus-visible {
      outline: 3px solid var(--pink);
      outline-offset: 3px;
    }
  }

  .cf23-canvas {
    position: relative;
    display: flex;
    justify-content: center;
    padding: 0.6rem;
    border-radius: 1.25rem;
    background: var(--violet);

    canvas {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: min(64svh, 720px);
      border-radius: 0.75rem;
      background: var(--plum);
      box-shadow: 6px 6px 0 var(--brown);
      cursor: grab;
    }

    &.is-adjusting {
      outline: 3px dashed var(--orange);
      outline-offset: -3px;
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

  .cf23-tools {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cf23-adjust {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 44px;
    padding: 0.35rem 0.9rem;
    border: 3px solid var(--brown);
    border-radius: 999px;
    background: var(--cream);
    color: var(--brown);
    font: 800 0.95rem var(--body);
    box-shadow: 3px 3px 0 var(--brown);
    cursor: pointer;

    &.is-on {
      background: var(--orange);
    }

    &:focus-visible { outline: 3px solid var(--pink); outline-offset: 2px; }
  }

  .cf23-hint {
    display: flex;
    gap: 0.45rem;
    margin: 0;
    color: var(--peach);
    font-size: 0.9rem;
    line-height: 1.4;

    i { flex-shrink: 0; margin-top: 0.1rem; }
  }

  .cf23-panel {
    padding: 0.25rem clamp(1rem, 4vw, 1.25rem) 1.25rem;
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

  // No heading on the first group: its labels already say "Nama kamu".
  .cf23-group--you {
    padding-top: 1.25rem;
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

  // Zoom is per format; for a day the current preview does not show, offer to switch to it.
  .cf23-show-day {
    align-self: flex-start;
    font-size: 0.95rem;
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

  .cf23-post {
    padding: clamp(1rem, 4vw, 1.25rem);
    border: 3px dashed var(--peach);
    border-radius: 1.5rem;
    color: var(--cream);

    @media (min-width: 992px) {
      grid-column: 2;
    }

    h2 {
      margin: 0 0 0.4rem;
      color: var(--cream);
      font-family: var(--display);
      font-size: 1.75rem;
      font-weight: 400;
      line-height: 1.1;
      -webkit-text-stroke: 5px var(--brown);
      paint-order: stroke fill;
      text-shadow: 0 3px 0 var(--brown);
    }

    a { color: var(--orange); font-weight: 800; }
  }

  .cf23-post__lead {
    margin: 0;
    color: var(--peach);
    line-height: 1.45;

    strong { color: var(--cream); }
  }

  .cf23-post__steps {
    display: grid;
    gap: 0.5rem;
    margin: 1rem 0;
    padding: 0;
    list-style: none;
    font-weight: 600;
    line-height: 1.35;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
    }

    span {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 1.6rem;
      height: 1.6rem;
      border: 2px solid var(--brown);
      border-radius: 50%;
      background: var(--orange);
      color: var(--brown);
      font-family: var(--display);
      font-size: 0.95rem;
    }
  }

  .cf23-all {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    width: 100%;
    min-height: 64px;
    padding: 0.6rem 1rem;
    border: 3px solid var(--brown);
    border-radius: 16px;
    background: var(--orange);
    color: var(--brown);
    text-align: left;
    box-shadow: 4px 4px 0 var(--brown);
    cursor: pointer;

    i { font-size: 1.5rem; }

    span { display: flex; flex-direction: column; }

    strong {
      font-family: var(--display);
      font-size: 1.25rem;
      font-weight: 400;
      letter-spacing: 0.02em;
    }

    small { font-size: 0.85rem; font-weight: 700; }

    &:disabled { opacity: 0.55; cursor: not-allowed; }
    &:not(:disabled):active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 var(--brown); }
    &:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }
  }

  .cf23-caption {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-top: 1rem;

    > span { font-weight: 800; }

    textarea {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 3px solid var(--brown);
      border-radius: 14px;
      background: var(--paper);
      color: var(--brown);
      font: 600 1rem/1.4 var(--body);
      resize: none;
      // Grows to fit the caption where supported, so nothing hides behind a scrollbar.
      field-sizing: content;
    }
  }

  .cf23-blank {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 60px;
    margin-top: 1rem;
    padding: 0.6rem 0.9rem;
    border: 3px solid var(--cream);
    border-radius: 16px;
    background: transparent;
    color: var(--cream);
    text-align: left;
    cursor: pointer;

    i { font-size: 1.35rem; color: var(--orange); }

    span { display: flex; flex-direction: column; min-width: 0; }

    strong { font-size: 1rem; font-weight: 800; line-height: 1.25; }

    small { color: var(--peach); font-size: 0.85rem; font-weight: 600; line-height: 1.35; }

    &:hover { background: rgb(255 236 232 / 0.08); }
    &:disabled { opacity: 0.55; cursor: progress; }
    &:focus-visible { outline: 3px solid var(--pink); outline-offset: 2px; }
  }

  .cf23-post__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 0.75rem;

    > * { min-width: 0; }
  }

  .cf23-ghost--cream {
    border-color: var(--cream);
    color: var(--cream);
    text-decoration: none;
    white-space: nowrap;

    &:hover { background: rgb(255 236 232 / 0.1); color: var(--cream); }
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
    flex-direction: column;
    gap: 0.45rem;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
  }

  .cf23-status {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: var(--peach);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.3;

    &:empty { display: none; }
    &.is-error { color: #ffb3c8; }
  }

  .cf23-actions__buttons {
    display: flex;
    gap: 0.5rem;

    .cf23-primary { flex: 1; justify-content: center; }

    @media (min-width: 768px) {
      flex-shrink: 0;
      margin-left: auto;

      .cf23-primary { flex: 0 0 auto; }
    }
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
