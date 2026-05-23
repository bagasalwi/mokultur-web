<script lang="ts">
  import type { PageData } from './$types';
  import { PUBLIC_API_URL } from '$env/static/public';
  import CurhatCard from '$components/curhatan/CurhatCard.svelte';

  export let data: PageData;

  $: c = data.curhatan;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: slug = c.curhatan.substring(0, 60).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+$/, '');
  $: canonicalUrl = `${PUBLIC_API_URL}/curhat-${c.id}/${slug}`;
  $: metaDesc = c.curhatan.substring(0, 157) + (c.curhatan.length > 157 ? '…' : '');

  // — Upvote —
  let likes = data.curhatan.like ?? 0;
  let voted = false;

  // — Share —
  let shareOpen = false;
  let copyDone = false;

  // — Download —
  let downloadLoading = false;

  // — Lapor —
  let laporOpen = false;
  let laporSelected: number | null = null;
  let laporLoading = false;
  let laporDone = false;
  let laporError = '';

  const laporOptions = [
    { id: 1, label: 'Ada kekerasan / ancaman',    icon: 'bi-exclamation-triangle-fill', iconClass: 'text-warning', desc: 'Termasuk intimidasi atau glorifikasi kekerasan.' },
    { id: 2, label: 'Bocorin data pribadi orang',  icon: 'bi-shield-exclamation',        iconClass: 'text-danger',  desc: 'Nama, kontak, atau identitas yg gak seharusnya dibuka.' },
    { id: 3, label: 'Ujaran kebencian',            icon: 'bi-emoji-angry-fill',          iconClass: 'text-danger',  desc: 'Nyerang identitas atau kelompok, melewati batas wajar.' },
  ];

  function closeLapor() {
    laporOpen = false;
    laporSelected = null;
    laporError = '';
  }

  function formatDate(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async function handleUpvote() {
    if (voted) return;
    voted = true;
    likes += 1;
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/curhatan/${c.id}/upvote`, { method: 'POST' });
      const json = await res.json();
      likes = json.likes ?? likes;
    } catch {
      likes -= 1;
      voted = false;
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      copyDone = true;
      setTimeout(() => { copyDone = false; }, 2000);
    } catch { /* ignore */ }
  }

  async function handleLapor() {
    if (!laporSelected || laporLoading) return;
    laporError = '';
    laporLoading = true;
    try {
      await fetch(`${PUBLIC_API_URL}/api/curhatan/${c.id}/lapor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laporan: laporSelected }),
      });
      laporDone = true;
    } catch {
      laporError = 'Gagal mengirim laporan. Coba lagi.';
    } finally {
      laporLoading = false;
    }
  }

  // — Canvas download helpers —
  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const para of text.split(/\n/)) {
      if (!para.trim()) { lines.push(''); continue; }
      const words = para.split(/\s+/);
      let line = '';
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
        else line = test;
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  function loadImage(url: string | null): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      if (!url) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function cssVar(name: string, fallback: string): string {
    if (typeof document === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function parseColor(input: string | null): { r: number; g: number; b: number } | null {
    if (!input) return null;
    const s = input.trim();
    if (s.startsWith('#')) {
      let h = s.slice(1);
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      if (h.length === 6) return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
    }
    const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    return null;
  }

  async function generateCanvas(): Promise<HTMLCanvasElement> {
    const W = 1080, H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const siteDark = cssVar('--site-dark', '#0a0a0a');
    const sitePrimary = cssVar('--site-primary', '#f1ff32');
    const siteAccentGlow = cssVar('--site-accent-glow', '#a51d2d');
    const accentRgb = parseColor(siteAccentGlow) ?? { r: 165, g: 29, b: 45 };

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, siteDark);
    bg.addColorStop(0.52, '#101827');
    bg.addColorStop(1, '#1f2937');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const accent = ctx.createRadialGradient(W, 0, 0, W, 0, 620);
    accent.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.75)`);
    accent.addColorStop(1, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0)`);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, H);

    const PAD_X = 80, PAD_TOP = 90, PAD_BOTTOM = 110;

    const [logo, gambarImg] = await Promise.all([
      loadImage(data.settings?.site_logo ?? null),
      loadImage(c.gambar),
    ]);

    if (logo) {
      const logoH = 56;
      const logoW = (logo.width / logo.height) * logoH;
      ctx.drawImage(logo, W - PAD_X - logoW, PAD_TOP, logoW, logoH);
    }

    let cursorY = PAD_TOP + 80;
    const textLen = (c.curhatan || '').length;
    let showImg = !!gambarImg;
    let imgMaxH = 300;
    if (textLen > 220) showImg = false;
    else if (textLen > 180) imgMaxH = 220;

    if (showImg && gambarImg) {
      const ratio = gambarImg.width / gambarImg.height;
      const drawW = W - PAD_X * 2;
      let drawH = drawW / ratio;
      if (drawH > imgMaxH) drawH = imgMaxH;
      const r = 20;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(PAD_X + r, cursorY);
      ctx.arcTo(PAD_X + drawW, cursorY, PAD_X + drawW, cursorY + drawH, r);
      ctx.arcTo(PAD_X + drawW, cursorY + drawH, PAD_X, cursorY + drawH, r);
      ctx.arcTo(PAD_X, cursorY + drawH, PAD_X, cursorY, r);
      ctx.arcTo(PAD_X, cursorY, PAD_X + drawW, cursorY, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(gambarImg, PAD_X, cursorY, drawW, drawH);
      ctx.restore();
      cursorY += drawH + 36;
    }

    const maxW = W - PAD_X * 2;
    const footerY = H - PAD_BOTTOM;
    const textBottomLimit = footerY - 24;
    const quoteSpaceReserved = 90;
    const availableH = textBottomLimit - (cursorY + quoteSpaceReserved);

    let chosenSize = 32, chosenLines: string[] = [], chosenLineHeight = Math.round(32 * 1.3);
    for (let size = 64; size >= 32; size -= 4) {
      ctx.font = `800 ${size}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      const lines = wrapText(ctx, c.curhatan, maxW);
      const lh = Math.round(size * 1.3);
      chosenSize = size; chosenLines = lines; chosenLineHeight = lh;
      if (lines.length * lh <= availableH) break;
    }

    const quoteSize = chosenSize >= 56 ? 180 : 140;
    ctx.fillStyle = sitePrimary;
    ctx.font = `italic 700 ${quoteSize}px Georgia, "Times New Roman", serif`;
    ctx.textBaseline = 'top';
    ctx.fillText('"', PAD_X - 10, cursorY - 50);
    cursorY += quoteSpaceReserved - 10;

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${chosenSize}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textBaseline = 'top';

    const maxLinesFit = Math.max(1, Math.floor((textBottomLimit - cursorY) / chosenLineHeight));
    const linesToDraw = chosenLines.slice(0, maxLinesFit);
    if (chosenLines.length > maxLinesFit && linesToDraw.length > 0) {
      const last = linesToDraw[linesToDraw.length - 1];
      linesToDraw[linesToDraw.length - 1] = (last.replace(/\s*\S+$/, '') || last) + '…';
    }
    for (const line of linesToDraw) { ctx.fillText(line, PAD_X, cursorY); cursorY += chosenLineHeight; }

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD_X, footerY);
    ctx.lineTo(W - PAD_X, footerY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('— ' + c.curhatanDari, PAD_X, footerY + 26);

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(window.location.host.replace(/^www\./, '') + '/curhat', W - PAD_X, footerY + 32);
    ctx.textAlign = 'left';

    return canvas;
  }

  async function handleDownload() {
    downloadLoading = true;
    try {
      const canvas = await generateCanvas();
      const a = document.createElement('a');
      a.download = `curhat-${c.id}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch (err) {
      console.error('Unduh gagal:', err);
    } finally {
      downloadLoading = false;
    }
  }

  $: shareTitle = encodeURIComponent(`Curhatan ${c.curhatanDari}`);
  $: shareLink = encodeURIComponent(canonicalUrl);
  $: waUrl = `https://api.whatsapp.com/send?text=${shareTitle}%0A%0A${shareLink}`;
  $: twUrl = `https://twitter.com/share?text=${shareTitle}&url=${shareLink}`;
  $: fbUrl = `https://www.facebook.com/sharer.php?u=${shareLink}`;
</script>

<svelte:head>
  <title>Curhatan {c.curhatanDari} — {siteName}</title>
  <meta name="description" content={metaDesc} />
  <link rel="canonical" href={canonicalUrl} />
  {#if c.gambar}
    <meta property="og:image" content={c.gambar} />
    <meta name="twitter:image" content={c.gambar} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<section class="section-md container-xl">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10 col-xl-9">

      <div class="mb-3">
        <a href="/curhatan" class="curhat-backlink">
          <i class="bi bi-arrow-left"></i> Balik ke Curhatan
        </a>
      </div>

      <article class="home-collab-card curhat-detail-hero">
        {#if c.gambar}
          <figure class="curhat-detail-hero__media">
            <img src={c.gambar} loading="lazy" alt={c.curhatan.substring(0, 60)} />
          </figure>
        {/if}

        <span class="curhat-detail-hero__quote" aria-hidden="true">&ldquo;</span>
        <p class="curhat-detail-hero__text">{c.curhatan}</p>

        <div class="home-collab-card__chips mt-3">
          {#if c.userId}
            <span class="curhat-detail-hero__meta-chip">
              <i class="bi bi-patch-check-fill"></i> {c.curhatanDari}
            </span>
          {:else}
            <span class="curhat-detail-hero__meta-chip">
              <i class="bi bi-incognito"></i> {c.curhatanDari}
            </span>
          {/if}
          <span class="curhat-detail-hero__meta-chip">
            <i class="bi bi-eye-fill"></i> {c.view.toLocaleString('id-ID')} dilihat
          </span>
          <span class="curhat-detail-hero__meta-chip">
            <i class="bi bi-clock"></i> {formatDate(c.createdAt)}
          </span>
        </div>

        <div class="curhat-detail-hero__actions">
          <button class="theme-btn theme-btn--primary" class:active={voted} on:click={handleUpvote}>
            <span>{likes}</span> <i class="bi bi-heart-fill"></i> Suka
          </button>
          <button class="theme-btn theme-btn--ghost" on:click={() => shareOpen = true}>
            <i class="bi bi-share"></i> Bagikan
          </button>
          <button class="theme-btn theme-btn--ghost" disabled={downloadLoading} on:click={handleDownload}>
            <i class="bi bi-download"></i> {downloadLoading ? 'Memproses...' : 'Unduh'}
          </button>
          <button class="theme-btn theme-btn--ghost" on:click={() => laporOpen = true}>
            <i class="bi bi-flag"></i> Lapor
          </button>
        </div>
      </article>

    </div>
  </div>

  <!-- Related -->
  {#if data.related.length > 0}
    <div class="mt-5">
      <h2 class="h4 fw-boldest mb-3">Curhatan lain</h2>
      <div class="row g-3 mt-1">
        {#each data.related as item}
          <div class="col-6 col-md-4 col-lg-3">
            <CurhatCard {item} excerptLimit={160} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<!-- Share Modal -->
{#if shareOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);"
       on:click|self={() => { shareOpen = false; copyDone = false; }}>
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content curhat-modal">
        <div class="modal-body curhat-modal__body">
          <div class="curhat-modal__header">
            <div>
              <span class="badge badge-main">Bagikan</span>
              <h5 class="curhat-modal__title">Sebar ke mana?</h5>
            </div>
            <button type="button" class="btn-close" on:click={() => { shareOpen = false; copyDone = false; }}></button>
          </div>
          <p class="curhat-modal__description">Pilih platform favoritmu, atau salin link-nya langsung.</p>
          <div class="curhat-share-grid">
            <a href={waUrl} target="_blank" rel="noopener" class="curhat-share-tile curhat-share-tile--whatsapp">
              <i class="bi bi-whatsapp"></i><span>WhatsApp</span>
            </a>
            <a href={twUrl} target="_blank" rel="noopener" class="curhat-share-tile curhat-share-tile--twitter">
              <i class="bi bi-twitter-x"></i><span>Twitter</span>
            </a>
            <a href={fbUrl} target="_blank" rel="noopener" class="curhat-share-tile curhat-share-tile--facebook">
              <i class="bi bi-facebook"></i><span>Facebook</span>
            </a>
            <button class="curhat-share-tile curhat-share-tile--copy" on:click={handleCopyLink}>
              <i class="bi {copyDone ? 'bi-check2' : 'bi-link-45deg'}"></i>
              <span>{copyDone ? 'Tersalin!' : 'Salin link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Lapor Modal -->
{#if laporOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);" on:click|self={closeLapor}>
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content curhat-modal">
        <div class="modal-body curhat-modal__body">
          <div class="curhat-modal__header">
            <div>
              <span class="badge badge-main">Lapor</span>
              <h5 class="curhat-modal__title">Ada yang ganjal di curhatan ini?</h5>
            </div>
            <button type="button" class="btn-close" on:click={closeLapor}></button>
          </div>
          <p class="curhat-modal__description">Pilih satu, biar admin bisa cek.</p>

          {#if laporDone}
            <div class="text-center py-3">
              <i class="bi bi-check-circle-fill text-success display-5 mb-2 d-block"></i>
              <p class="fw-semibold mb-0">Laporan berhasil dikirim. Terima kasih!</p>
            </div>
          {:else}
            <div class="curhat-report-list">
              {#each laporOptions as opt}
                <button
                  class="curhat-report-option"
                  class:active={laporSelected === opt.id}
                  on:click={() => laporSelected = opt.id}
                >
                  <span class="curhat-report-option__icon {opt.iconClass}">
                    <i class="bi {opt.icon}"></i>
                  </span>
                  <span class="curhat-report-option__content">
                    <strong>{opt.label}</strong>
                    <small>{opt.desc}</small>
                  </span>
                </button>
              {/each}
            </div>
            {#if laporError}
              <p class="curhat-modal__error mb-0" style="color:#dc2626; font-size:0.8rem; margin-top:0.5rem;">{laporError}</p>
            {/if}
            <div class="curhat-modal__footer">
              <button
                class="theme-btn theme-btn--primary"
                disabled={!laporSelected || laporLoading}
                on:click={handleLapor}
              >
                <i class="bi bi-send"></i> {laporLoading ? 'Mengirim...' : 'Kirim laporan'}
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
