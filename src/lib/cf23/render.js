// @ts-nocheck -- vendored render engine, typed by render.d.ts
/*!
 * CF23 Cosplay Card — render engine
 * Menggambar template Feed Day 1, Feed Day 2, dan Story Day 1 + 2 ke <canvas>.
 *
 * Ported from the supplied cf23-generator (UMD) to an ES module for
 * mokultur.com/comifuro23. The artwork is unchanged; the one addition is the
 * small Mokultur credit (logo + mokultur.com/comifuro23) drawn by brandMark().
 */
const CF23Render = (function () {
  'use strict';

  // ---------- Palet (diambil dari ilustrasi poster CF23) ----------
  var COLORS = {
    plum: '#3E0F3D',
    violet: '#683087',
    lilac: '#8154BD',
    orange: '#FF9664',
    pink: '#F52B77',
    peach: '#FDCF9E',
    cream: '#FFECE8',
    brown: '#531F12',
    mauve: '#7D465B'
  };

  var DISPLAY = '"Lilita One", "Arial Black", sans-serif';
  var BODY = '"Baloo 2", "Trebuchet MS", sans-serif';

  // ---------- Info event (ubah di sini kalau perlu) ----------
  var EVENT = {
    name: 'COMIC FRONTIER 23',
    venueShort: 'ICE BSD',
    venue: 'ICE BSD, Tangerang',
    venueFull: 'Indonesia Convention Exhibition',
    dateRange: 'ICE BSD · 31 Okt – 1 Nov 2026',
    hashtags: '#CF23 #Comifuro23',
    days: {
      1: { dow: 'SABTU', date: '31', month: 'OKT 2026' },
      2: { dow: 'MINGGU', date: '1', month: 'NOV 2026' }
    }
  };

  var TEMPLATES = {
    day1: { id: 'day1', label: 'Feed Day 1', width: 1080, height: 1350, days: [1] },
    day2: { id: 'day2', label: 'Feed Day 2', width: 1080, height: 1350, days: [2] },
    story: { id: 'story', label: 'Story Day 1 + 2', width: 1080, height: 1920, days: [1, 2] }
  };

  var ACCENTS = [
    { name: 'Pink', value: '#F52B77' },
    { name: 'Oranye', value: '#FF9664' },
    { name: 'Peach', value: '#FDCF9E' },
    { name: 'Ungu', value: '#8154BD' }
  ];
  var DEFAULT_ACCENT = { 1: '#F52B77', 2: '#FF9664' };

  // ---------- Path ikon (koordinat viewBox) ----------
  var BAT = 'M32 9 C30 5 28 5 27 8 C24 3 16 1 2 7 C9 9 11 13 11 17 C15 14 19 15 21 19 C24 16 29 17 32 24 C35 17 40 16 43 19 C45 15 49 14 53 17 C53 13 55 9 62 7 C48 1 40 3 37 8 C36 5 34 5 32 9 Z';
  var MOON = 'M62 6 A44 44 0 1 0 96 66 A36 36 0 1 1 62 6 Z';
  var CAMERA = 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M15.8 13.5a3.8 3.8 0 1 1-7.6 0a3.8 3.8 0 1 1 7.6 0z';
  var PIN = 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M14.5 9.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0z';

  var DEG = Math.PI / 180;

  // ---------- Kredit Mokultur (logo kecil + URL halaman) ----------
  var BRAND = { logo: null, url: 'mokultur.com/comifuro23' };

  /** Muat logo dari domain yang sama, supaya canvas tidak "tainted" dan download tetap jalan. */
  function loadBrand(src) {
    if (typeof Image === 'undefined') return Promise.resolve();
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { BRAND.logo = img; resolve(); };
      img.onerror = function () { resolve(); };
      img.src = src;
    });
  }

  /** Logo kecil di atas, URL di bawahnya; `align` 'right' atau 'center' terhadap x, mulai dari `top`. */
  function brandMark(ctx, x, top, o) {
    var logoH = o.logoHeight;
    var logoW = BRAND.logo ? logoH * (BRAND.logo.naturalWidth || BRAND.logo.width) / (BRAND.logo.naturalHeight || BRAND.logo.height) : 0;
    ctx.save();
    if (BRAND.logo) {
      ctx.imageSmoothingQuality = 'high';
      var lx = o.align === 'right' ? x - logoW : x - logoW / 2;
      ctx.drawImage(BRAND.logo, lx, top, logoW, logoH);
    }
    setSpacing(ctx, 0.5);
    setFont(ctx, '800', o.size, BODY);
    ctx.globalAlpha = o.alpha == null ? 0.92 : o.alpha;
    ctx.fillStyle = o.fill;
    ctx.textAlign = o.align === 'right' ? 'right' : 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(BRAND.url, x, top + (BRAND.logo ? logoH + o.gap : 0) + o.size * 0.8);
    ctx.restore();
  }

  // ---------- Helper dasar ----------
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(ctx, cx, cy, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function band(ctx, cx, cy, w, h, r, deg, fill) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(deg * DEG);
    rr(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function drawPath(ctx, d, box, o) {
    ctx.save();
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
    if (o.rotate) ctx.rotate(o.rotate * DEG);
    ctx.scale(box.w / o.vb[0], box.h / o.vb[1]);
    ctx.translate(-o.vb[0] / 2, -o.vb[1] / 2);
    var p = new Path2D(d);
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(p); }
    if (o.stroke) {
      ctx.strokeStyle = o.stroke;
      ctx.lineWidth = o.lineWidth || 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(p);
    }
    ctx.restore();
  }

  function bat(ctx, x, y, w, deg) {
    drawPath(ctx, BAT, { x: x, y: y, w: w, h: w * 28 / 64 }, { vb: [64, 28], rotate: deg, fill: COLORS.plum });
  }

  function pumpkin(ctx, x, y, w, h, deg) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(deg * DEG);
    ctx.scale(w / 100, h / 92);
    ctx.translate(-50, -46);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = COLORS.brown;
    ctx.lineWidth = 7;
    ctx.stroke(new Path2D('M47 16 C46 8 50 3 56 2'));
    ctx.lineWidth = 4;
    [[30, 24, 32], [70, 24, 32], [50, 22, 34]].forEach(function (e) {
      ctx.beginPath();
      ctx.ellipse(e[0], 54, e[1], e[2], 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.orange;
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = COLORS.plum;
    ctx.fill(new Path2D('M30 46 L40 36 L44 50 Z M70 46 L60 36 L56 50 Z'));
    ctx.fill(new Path2D('M28 62 Q50 82 72 62 L64 66 L58 60 L50 68 L42 60 L36 66 Z'));
    ctx.restore();
  }

  function setFont(ctx, weight, size, family) {
    ctx.font = weight + ' ' + size + 'px ' + family;
  }

  function setSpacing(ctx, px) {
    if ('letterSpacing' in ctx) ctx.letterSpacing = (px || 0) + 'px';
  }

  function fitSize(ctx, text, weight, size, family, maxW, minSize) {
    var s = size;
    setFont(ctx, weight, s, family);
    while (maxW && s > (minSize || 12) && ctx.measureText(text).width > maxW) {
      s -= 2;
      setFont(ctx, weight, s, family);
    }
    return s;
  }

  // Teks dengan outline tebal + bayangan solid (gaya stiker poster)
  function outlined(ctx, text, x, y, o) {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = 'alphabetic';
    setSpacing(ctx, o.letterSpacing);
    var weight = o.weight || '400';
    var family = o.family || DISPLAY;
    fitSize(ctx, text, weight, o.size, family, o.maxWidth, o.minSize);
    var width = ctx.measureText(text).width;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    var stroke = o.stroke || COLORS.brown;
    if (o.shadow) {
      ctx.lineWidth = o.strokeWidth || 0;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      if (o.strokeWidth) ctx.strokeText(text, x, y + o.shadow);
      ctx.fillText(text, x, y + o.shadow);
    }
    if (o.strokeWidth) {
      ctx.lineWidth = o.strokeWidth;
      ctx.strokeStyle = stroke;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = o.fill;
    ctx.fillText(text, x, y);
    ctx.restore();
    return width;
  }

  function plain(ctx, text, x, y, o) {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    setSpacing(ctx, o.letterSpacing);
    fitSize(ctx, text, o.weight || '400', o.size, o.family || BODY, o.maxWidth, o.minSize);
    ctx.fillStyle = o.fill;
    ctx.fillText(text, x, y);
    var w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }

  // Satu baris dengan beberapa bobot huruf, mengecil otomatis kalau terlalu panjang
  function richLine(ctx, parts, x, y, o) {
    var size = o.size;
    function measure(s) {
      var total = 0;
      parts.forEach(function (p) {
        setFont(ctx, p.weight, s, BODY);
        total += ctx.measureText(p.text).width;
      });
      return total;
    }
    ctx.save();
    setSpacing(ctx, 0);
    while (size > 14 && measure(size) > o.maxWidth) size -= 1;
    var total = measure(size);
    var cx = o.align === 'right' ? x - total : o.align === 'center' ? x - total / 2 : x;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    parts.forEach(function (p) {
      ctx.globalAlpha = p.alpha != null ? p.alpha : 1;
      setFont(ctx, p.weight, size, BODY);
      ctx.fillStyle = o.fill;
      ctx.fillText(p.text, cx, y);
      cx += ctx.measureText(p.text).width;
    });
    ctx.restore();
  }

  function pill(ctx, o) {
    ctx.save();
    setSpacing(ctx, o.letterSpacing);
    setFont(ctx, o.weight || '400', o.size, o.family || BODY);
    var tw = ctx.measureText(o.text).width;
    var iconW = o.icon ? o.iconSize : 0;
    var gap = o.icon ? (o.gap || 8) : 0;
    var w = o.padL + iconW + gap + tw + o.padR;
    var x = o.anchor === 'right' ? o.x - w : o.anchor === 'center' ? o.x - w / 2 : o.x;
    var bw = o.borderWidth;
    rr(ctx, x + bw / 2, o.y + bw / 2, w - bw, o.height - bw, (o.height - bw) / 2);
    ctx.fillStyle = o.bg;
    ctx.fill();
    ctx.lineWidth = bw;
    ctx.strokeStyle = o.border;
    ctx.stroke();
    var cy = o.y + o.height / 2;
    if (o.icon) {
      drawPath(ctx, o.icon, { x: x + o.padL, y: cy - o.iconSize / 2, w: o.iconSize, h: o.iconSize },
        { vb: [24, 24], stroke: o.iconColor, lineWidth: 2.2 });
    }
    ctx.fillStyle = o.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.text, x + o.padL + iconW + gap, cy + (o.nudge || 0));
    ctx.restore();
    return { x: x, w: w };
  }

  function stamp(ctx, cx, cy, r, deg, bg, info) {
    var s = r / 86;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(deg * DEG);
    ctx.beginPath();
    ctx.arc(6 * s, 6 * s, r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.brown;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.brown;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r - 8 * s, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    plain(ctx, info.dow, 0, -33 * s, { size: Math.round(22 * s), weight: '800', fill: COLORS.plum, align: 'center', letterSpacing: 2 * s, maxWidth: r * 1.5 });
    plain(ctx, info.date, 0, 22 * s, { size: Math.round(64 * s), family: DISPLAY, fill: COLORS.plum, align: 'center' });
    plain(ctx, info.month, 0, 48 * s, { size: Math.round(20 * s), weight: '800', fill: COLORS.plum, align: 'center', letterSpacing: s });
    ctx.restore();
  }

  function drawCover(ctx, photo, x, y, w, h) {
    var img = photo.image;
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var sc = Math.max(w / iw, h / ih) * clamp(photo.zoom || 1, 1, 4);
    var dw = iw * sc;
    var dh = ih * sc;
    var maxX = (dw - w) / 2;
    var maxY = (dh - h) / 2;
    var ox = clamp(photo.panX || 0, -1, 1) * maxX;
    var oy = clamp(photo.panY || 0, -1, 1) * maxY;
    ctx.fillStyle = COLORS.plum;
    ctx.fillRect(x, y, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, x + (w - dw) / 2 + ox, y + (h - dh) / 2 + oy, dw, dh);
    return { maxX: maxX, maxY: maxY };
  }

  function drawPlaceholder(ctx, x, y, w, h, p) {
    ctx.fillStyle = COLORS.violet;
    ctx.fillRect(x, y, w, h);
    var gap = p.gap;
    var lineH = p.titleSize * 1.05;
    var total = p.icon + gap + lineH * p.title.length + gap + p.subSize * 1.3 * p.sub.length;
    var top = y + h / 2 - total / 2;
    drawPath(ctx, CAMERA, { x: x + w / 2 - p.icon / 2, y: top, w: p.icon, h: p.icon }, { vb: [24, 24], stroke: COLORS.peach, lineWidth: 1.6 });
    var ty = top + p.icon + gap;
    p.title.forEach(function (line) {
      ty += lineH;
      plain(ctx, line, x + w / 2, ty - lineH * 0.18, { size: p.titleSize, family: DISPLAY, fill: COLORS.cream, align: 'center', letterSpacing: 1, maxWidth: w - 40 });
    });
    ty += gap;
    p.sub.forEach(function (line) {
      ty += p.subSize * 1.3;
      plain(ctx, line, x + w / 2, ty - p.subSize * 0.3, { size: p.subSize, weight: '500', fill: COLORS.peach, align: 'center', maxWidth: w - 40 });
    });
  }

  // Bingkai foto bergaya stiker. Mengembalikan area foto (tanpa rotasi) untuk hit-test drag.
  function photoFrame(ctx, f, photo, placeholder, decorate) {
    var cx = f.x + f.w / 2;
    var cy = f.y + f.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(f.rot * DEG);
    var x = -f.w / 2;
    var y = -f.h / 2;
    rr(ctx, x + f.shadow, y + f.shadow, f.w, f.h, f.radius);
    ctx.fillStyle = COLORS.brown;
    ctx.fill();
    rr(ctx, x, y, f.w, f.h, f.radius);
    ctx.fill();
    rr(ctx, x + f.border, y + f.border, f.w - 2 * f.border, f.h - 2 * f.border, f.radius - f.border);
    ctx.fillStyle = COLORS.cream;
    ctx.fill();

    var inset = f.border + f.pad;
    var ix = x + inset;
    var iy = y + inset;
    var iw = f.w - inset * 2;
    var ih = f.h - inset * 2;
    var range = { maxX: 0, maxY: 0 };
    ctx.save();
    rr(ctx, ix, iy, iw, ih, f.innerRadius);
    ctx.clip();
    if (photo && photo.image) range = drawCover(ctx, photo, ix, iy, iw, ih);
    else drawPlaceholder(ctx, ix, iy, iw, ih, placeholder);
    ctx.restore();

    if (!(photo && photo.image)) {
      ctx.save();
      rr(ctx, ix + 2, iy + 2, iw - 4, ih - 4, f.innerRadius - 2);
      ctx.setLineDash([16, 12]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = COLORS.peach;
      ctx.stroke();
      ctx.restore();
    }

    if (decorate) decorate(x, y, f.w, f.h);
    ctx.restore();

    return { x: cx + ix, y: cy + iy, w: iw, h: ih, maxX: range.maxX, maxY: range.maxY };
  }

  function field(value, hint, hints) {
    var v = (value || '').trim();
    if (v) return { text: v, alpha: 1 };
    if (hints) return { text: hint, alpha: 0.5 };
    return null;
  }

  function cleanHandle(u) {
    return (u || '').trim().replace(/^@+/, '').replace(/\s+/g, '');
  }

  // ---------- Template: Feed 1080 x 1350 ----------
  function renderFeed(ctx, day, data, hints) {
    var W = 1080, P = 56;
    var dd = data.days[day] || {};
    var accent = dd.accent || DEFAULT_ACCENT[day];
    var c = COLORS;

    ctx.fillStyle = c.plum;
    ctx.fillRect(0, 0, W, 1350);
    ellipse(ctx, 540, 130, 800, 430, c.violet);
    ellipse(ctx, 830, 140, 450, 260, c.lilac);
    band(ctx, 540, 770, 1400, 340, 170, -9, c.orange);
    ellipse(ctx, 540, 1460, 780, 450, c.mauve);
    drawPath(ctx, MOON, { x: 896, y: 44, w: 120, h: 120 }, { vb: [100, 100], fill: c.orange, stroke: c.brown, lineWidth: 4 });
    bat(ctx, 754, 170, 96, 0);
    bat(ctx, 660, 110, 60, 12);
    bat(ctx, 920, 210, 70, -10);

    var hp = pill(ctx, {
      x: P, y: P, anchor: 'left', height: 58, padL: 24, padR: 24, text: EVENT.name,
      family: DISPLAY, size: 28, letterSpacing: 2, bg: c.brown, border: c.cream, borderWidth: 4, color: c.cream, nudge: 1
    });
    plain(ctx, EVENT.venueShort, P + hp.w + 16, P + 30, { size: 24, weight: '800', fill: c.cream, baseline: 'middle', letterSpacing: 1 });

    var base = 292;
    var cw = outlined(ctx, 'COSPLAY', P, base, { size: 88, fill: c.cream, strokeWidth: 10, shadow: 7, letterSpacing: 2 });
    ctx.save();
    ctx.translate(P + cw + 28, base);
    ctx.rotate(-4 * DEG);
    outlined(ctx, 'DAY ' + day, 0, 0, { size: 172, fill: accent, strokeWidth: 14, shadow: 11, letterSpacing: 3, maxWidth: 880 - (P + cw + 28), minSize: 110 });
    ctx.restore();

    var slot = photoFrame(ctx,
      { x: 56, y: 334, w: 968, h: 784, rot: -1, radius: 40, border: 8, pad: 16, innerRadius: 26, shadow: 14 },
      dd.photo,
      { icon: 104, gap: 14, title: ['FOTO DAY ' + day], titleSize: 52, sub: ['Upload fotomu di panel'], subSize: 26 },
      function (x, y, w, h) {
        stamp(ctx, w / 2 - 60, -h / 2 + 40, 86, 10, day === 1 ? c.orange : c.peach, EVENT.days[day]);
        pumpkin(ctx, x - 30, y + h - 100, 112, 103, -8);
      });
    slot.day = day;

    var leftMax = 610;
    var name = field(data.name, '[NAMA COSPLAYER]', hints);
    if (name) outlined(ctx, name.text, P, 1206, { size: 58, fill: c.cream, strokeWidth: 8, shadow: 5, maxWidth: leftMax, minSize: 30, alpha: name.alpha });
    var handle = cleanHandle(data.username);
    var user = field(handle ? '@' + handle : '', '@[username]', hints);
    if (user) plain(ctx, user.text, P, 1248, { size: 32, weight: '800', fill: c.peach, maxWidth: leftMax, alpha: user.alpha });
    var parts = characterParts(dd, hints, '[KARAKTER]', '[JUDUL SERIES]');
    if (parts) richLine(ctx, parts, P, 1284, { size: 26, fill: c.cream, maxWidth: leftMax });

    pill(ctx, {
      x: 1024, y: 1148, anchor: 'right', height: 50, padL: 12, padR: 18, text: EVENT.venue,
      weight: '800', size: 24, bg: c.plum, border: c.cream, borderWidth: 4, color: c.cream,
      icon: PIN, iconSize: 28, iconColor: c.orange, nudge: 2
    });
    plain(ctx, EVENT.venueFull, 1024, 1232, { size: 20, weight: '700', fill: c.peach, align: 'right' });
    plain(ctx, EVENT.hashtags, 1024, 1266, { size: 22, weight: '800', fill: c.cream, align: 'right', letterSpacing: 1 });
    brandMark(ctx, 1024, 1280, { size: 18, logoHeight: 30, gap: 4, fill: c.peach, align: 'right' });

    return [slot];
  }

  function characterParts(dd, hints, charHint, seriesHint) {
    var ch = field(dd.character, charHint, hints);
    var se = field(dd.series, seriesHint, hints);
    if (!ch && !se) return null;
    var parts = [];
    if (ch) {
      parts.push({ text: 'sebagai ', weight: '500' });
      parts.push({ text: ch.text, weight: '800', alpha: ch.alpha });
      if (se) parts.push({ text: ' · ', weight: '500' });
    }
    if (se) parts.push({ text: se.text, weight: '500', alpha: se.alpha });
    return parts;
  }

  // ---------- Template: Story 1080 x 1920 ----------
  function renderStory(ctx, data, hints) {
    var c = COLORS;
    ctx.fillStyle = c.plum;
    ctx.fillRect(0, 0, 1080, 1920);
    ellipse(ctx, 550, 170, 850, 550, c.violet);
    ellipse(ctx, 870, 150, 450, 310, c.lilac);
    band(ctx, 540, 1030, 1480, 420, 210, -12, c.orange);
    ellipse(ctx, 540, 2020, 840, 600, c.mauve);
    drawPath(ctx, MOON, { x: 880, y: 150, w: 130, h: 130 }, { vb: [100, 100], fill: c.orange, stroke: c.brown, lineWidth: 4 });
    bat(ctx, 80, 210, 96, -8);
    bat(ctx, 190, 300, 58, 14);
    bat(ctx, 896, 320, 74, -12);

    pill(ctx, {
      x: 540, y: 190, anchor: 'center', height: 60, padL: 26, padR: 26, text: EVENT.name,
      family: DISPLAY, size: 30, letterSpacing: 2, bg: c.brown, border: c.cream, borderWidth: 4, color: c.cream, nudge: 1
    });
    outlined(ctx, 'COSPLAY', 540, 382, { size: 136, fill: c.cream, strokeWidth: 14, shadow: 10, letterSpacing: 3, align: 'center' });
    pill(ctx, {
      x: 540, y: 410, anchor: 'center', height: 52, padL: 14, padR: 22, text: EVENT.dateRange,
      weight: '800', size: 28, bg: c.plum, border: c.cream, borderWidth: 4, color: c.cream,
      icon: PIN, iconSize: 30, iconColor: c.orange, gap: 10, nudge: 2
    });

    var slots = [];
    var cols = [
      { day: 1, x: 56, rot: -2, labelX: -18, labelRot: -6, stampRot: 10 },
      { day: 2, x: 562, rot: 2, labelX: -10, labelRot: -4, stampRot: -8 }
    ];
    cols.forEach(function (col) {
      var dd = data.days[col.day] || {};
      var accent = dd.accent || DEFAULT_ACCENT[col.day];
      var slot = photoFrame(ctx,
        { x: col.x, y: 552, w: 462, h: 852, rot: col.rot, radius: 34, border: 7, pad: 14, innerRadius: 22, shadow: 12 },
        dd.photo,
        { icon: 84, gap: 12, title: ['FOTO', 'DAY ' + col.day], titleSize: 40, sub: ['Upload fotomu', 'di panel'], subSize: 22 },
        function (x, y, w, h) {
          stamp(ctx, w / 2 - 47, h / 2 - 35, 69, col.stampRot, col.day === 1 ? c.orange : c.peach, EVENT.days[col.day]);
          if (col.day === 1) pumpkin(ctx, x - 36, y + h - 70, 104, 96, -10);
          ctx.save();
          ctx.translate(x + col.labelX, y + 27);
          ctx.rotate(col.labelRot * DEG);
          outlined(ctx, 'DAY ' + col.day, 0, 0, { size: 104, fill: accent, strokeWidth: 12, shadow: 8, letterSpacing: 2 });
          ctx.restore();
        });
      slot.day = col.day;
      slots.push(slot);

      var ch = field(dd.character, '[KARAKTER DAY ' + col.day + ']', hints);
      if (ch) outlined(ctx, ch.text, col.x + 8, 1474, { size: 36, fill: c.cream, strokeWidth: 6, shadow: 4, maxWidth: 446, minSize: 22, alpha: ch.alpha });
      var se = field(dd.series, '[JUDUL SERIES]', hints);
      if (se) plain(ctx, se.text, col.x + 8, 1504, { size: 24, weight: '700', fill: c.peach, maxWidth: 446, minSize: 16, alpha: se.alpha });
    });

    var name = field(data.name, '[NAMA COSPLAYER]', hints);
    if (name) outlined(ctx, name.text, 540, 1624, { size: 72, fill: c.cream, strokeWidth: 10, shadow: 6, align: 'center', maxWidth: 940, minSize: 36, alpha: name.alpha });
    var handle = cleanHandle(data.username);
    var user = field(handle ? '@' + handle : '', '@[username]', hints);
    if (user) plain(ctx, user.text, 540, 1668, { size: 36, weight: '800', fill: c.peach, align: 'center', maxWidth: 940, alpha: user.alpha });
    plain(ctx, EVENT.hashtags, 540, 1704, { size: 24, weight: '800', fill: c.cream, align: 'center', letterSpacing: 1 });
    brandMark(ctx, 540, 1760, { size: 26, logoHeight: 56, gap: 8, fill: c.peach, align: 'center' });

    return slots;
  }

  /**
   * Gambar satu template.
   * @param {CanvasRenderingContext2D} ctx  canvas berukuran template.width x template.height
   * @param {'day1'|'day2'|'story'} templateId
   * @param {object} data { name, username, days: { 1: {character, series, accent, photo}, 2: {...} } }
   *   photo = { image: HTMLImageElement|ImageBitmap, zoom: 1..4, panX: -1..1, panY: -1..1 } atau null
   * @param {object} [options] { hints: true } menampilkan placeholder [TEKS] untuk field kosong (untuk preview)
   * @returns {{slots: Array<{day,x,y,w,h,maxX,maxY}>}} area foto untuk drag/zoom di UI
   */
  function render(ctx, templateId, data, options) {
    var hints = !!(options && options.hints);
    data = data || {};
    data.days = data.days || {};
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var slots;
    if (templateId === 'story') slots = renderStory(ctx, data, hints);
    else slots = renderFeed(ctx, templateId === 'day2' ? 2 : 1, data, hints);
    ctx.restore();
    return { slots: slots };
  }

  function loadFonts() {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('400 100px "Lilita One"', 'COSPLAY'),
      document.fonts.load('500 30px "Baloo 2"', 'Aa'),
      document.fonts.load('700 30px "Baloo 2"', 'Aa'),
      document.fonts.load('800 30px "Baloo 2"', 'Aa')
    ]).then(function () {}, function () {});
  }

  function toBlob(templateId, data, type) {
    var t = TEMPLATES[templateId];
    var canvas = document.createElement('canvas');
    canvas.width = t.width;
    canvas.height = t.height;
    render(canvas.getContext('2d'), templateId, data, { hints: false });
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('Gagal membuat gambar')); }, type || 'image/png');
    });
  }

  return {
    COLORS: COLORS,
    EVENT: EVENT,
    TEMPLATES: TEMPLATES,
    ACCENTS: ACCENTS,
    DEFAULT_ACCENT: DEFAULT_ACCENT,
    BRAND: BRAND,
    render: render,
    loadFonts: loadFonts,
    loadBrand: loadBrand,
    toBlob: toBlob
  };
})();

export default CF23Render;
