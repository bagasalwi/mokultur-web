---
name: Mokultur
description: Identitas editorial Mokultur untuk berita budaya pop dan bacaan personal.
colors:
  primary: "var(--site-primary)"
  primary-contrast: "var(--site-primary-contrast)"
  dark: "var(--site-dark)"
  accent-glow: "var(--site-accent-glow)"
  badge-text: "var(--site-badge-text)"
  navbar-bg: "var(--navbar-bg)"
  navbar-text: "var(--navbar-text)"
  white: "#ffffff"
  surface: "#fafafa"
  text: "#1a1a1a"
  text-secondary: "#6b7280"
  reader-secondary: "#555555"
  border: "#e5e5e5"
typography:
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 800
    letterSpacing: "-0.03em"
  section-title:
    fontSize: "1.1rem"
    fontWeight: 800
    letterSpacing: "-0.02em"
  reader-title:
    fontSize: "1.25rem"
    fontWeight: 750
    lineHeight: 1.4
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  article-body:
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  reader-panel: "22px"
  archive-hero: "28px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1rem"
  button-surface:
    backgroundColor: "{colors.white}"
    textColor: "{colors.dark}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1rem"
  button-dark:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1rem"
  button-ghost:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1rem"
  badge-category:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.badge-text}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.3rem 0.6rem"
  interest-option:
    textColor: "#111111"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  article-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
  archive-header:
    textColor: "{colors.white}"
    rounded: "{rounded.archive-hero}"
    padding: "2rem"
---

# Design System: Mokultur

## Overview

**Creative North Star: "Editorial Mokultur"**

Dokumen ini mencatat identitas situs yang sudah dibangun: halaman putih, judul tebal, foto artikel, aksen dari dashboard, dan header arsip gelap. Nama di atas merupakan deskripsi incumbent, bukan arah merek baru. Bahasa antarmuka pembaca adalah Indonesia; konten dan judul menjadi pusat perhatian.

Sistem menggunakan SvelteKit, Bootstrap 5.3, Inter yang di-host sendiri, dan ikon Bootstrap. Halaman pembaca memperluas komponen beranda dan arsip yang sama. Varian navbar, kartu artikel, dan detail artikel tetap mengikuti pengaturan situs; satu varian bukan aturan untuk seluruh situs.

**Key Characteristics:**

- Judul tebal dan foto konten sebagai penanda hierarki.
- Latar baca putih, header arsip gelap, aksen yang mengikuti dashboard.
- Tombol pill, badge kategori bersudut kecil, dan garis aksen pada judul bagian.
- Komposisi responsif dengan aksi yang dapat membungkus di ponsel.

Sumber: `src/styles/_variables.scss`, `src/styles/custom.scss`, `src/styles/_reader.scss`, `src/routes/+layout.svelte`, `src/components/ui/SectionHead.svelte`, dan `src/components/articles/ArticleCard.svelte`. Cakupan spesifikasi ini adalah fondasi publik serta komponen pembaca; varian khusus anime, event, dan dashboard tetap memiliki aturan lokalnya.

## Colors

Warna merek adalah pengaturan hidup; warna netral memberi struktur dan menjaga keterbacaan.

### Primary

- **Aksen situs** (`primary`): tombol utama, badge kategori, garis judul bagian, dan pilihan minat aktif.
- **Kontras aksen** (`primary-contrast`): teks aksi dan minat di atas aksen. Badge incumbent memakai `badge-text`; badge daftar pembaca memakai `primary-contrast`.
- **Cahaya aksen** (`accent-glow`): lapisan radial pada header arsip incumbent.

### Neutral

- **Jangkar gelap** (`dark`): teks aksi, tautan pembaca, dan dasar header gelap.
- **Putih dan permukaan lembut** (`white`, `surface`): halaman baca dan bidang penampung konten.
- **Teks dan teks pendukung** (`text`, `text-secondary`, `reader-secondary`): isi, metadata, dan penjelasan.
- **Garis pemisah** (`border`): bidang dan struktur kartu; baris pembaca memiliki pemisah lokal yang lebih tegas.
- **Warna navbar** (`navbar-bg`, `navbar-text`): mengikuti pengaturan navbar secara terpisah.

**The Live Palette Rule.** Ambil warna merek dari custom property yang diisi `src/routes/+layout.svelte`; jangan menjadikan warna dashboard saat ini sebagai konstanta baru. `--site-secondary` saat ini adalah alias primary, bukan aksen kedua.

Frontmatter sengaja menyimpan referensi CSS `var(...)`. Nilainya membutuhkan root situs; fallback historis SCSS dan layout berbeda, sehingga keduanya tidak ditafsirkan sebagai satu palet merek tetap. Ramp di sidecar hanya bahan preview, bukan token produksi.

## Typography

**Display Font:** Inter untuk judul arsip dan bagian pembaca.
**Body Font:** Inter dengan fallback sistem pada frontmatter.

**Character:** Sans serif rapat dan tebal untuk judul, dengan isi yang lebih longgar. Font Nunito dan Space Grotesk tersedia tetapi tidak menjadi fondasi pembaca; varian detail editorial incumbent menggunakan Georgia secara lokal.

### Hierarchy

- **Headline:** judul header arsip; halaman pembaca menurunkannya ke (1.75rem) pada lebar maksimum (575px).
- **Section title:** judul bagian beranda dengan garis aksen di sisi kiri.
- **Reader title:** judul daftar; turun ke (1.0625rem) pada ponsel. Kartu vertikal memakai judul (1rem), bobot (700).
- **Body:** antarmuka umum; uraian dan aksi pembaca umumnya (0.875rem).
- **Article body:** isi artikel dengan lebar maksimum (70ch), bobot dan leading dari frontmatter.
- **Label:** kategori; metadata pembaca menggunakan (0.75rem), sedangkan alasan rekomendasi menggunakan (0.8125rem).

**The Title First Rule.** Judul membawa hierarki konten. Metadata dan alasan rekomendasi tetap lebih kecil serta memakai warna pendukung.

Sumber: `_variables.scss`, `.bodyArticle` dan `.archive-hero__title` di `custom.scss`, `SectionHead.svelte`, serta `_reader.scss`.

## Layout

Halaman publik pembaca memakai container Bootstrap `container-xl`, bukan ukuran `.container` kustom. Bootstrap memberi batas (1140px) dari breakpoint (1200px) dan (1320px) dari (1400px). Gutter situs (1.5rem) turun ke (1.25rem) pada lebar maksimum (768px). Ritme berulang memakai langkah spacing pada frontmatter; section umum mempunyai padding vertikal (1.5rem).

Header arsip dan aksi memakai flex yang membungkus. Daftar pembaca satu kolom memakai thumbnail (160px), rasio (4:3), gap (24px), serta pemisah bawah. Pada lebar maksimum (575px), thumbnail menjadi (88px), gap (14px), padding baris (20px), dan deskripsi disembunyikan; judul tetap dapat membungkus. Halaman pembaca memakai padding (28px 16px 48px) di ukuran ini.

Preview beranda menggunakan tiga kolom dengan gap (24px), lalu dua kolom dengan gap (16px) pada lebar maksimum (767px). Varian daftar memakai dua kolom dan menjadi satu pada lebar maksimum (575px). Kartu mengikuti `card_style`; jumlah kolom bukan kewajiban universal untuk bagian lain.

**The Wrap Before Squeeze Rule.** Aksi dan pilihan membungkus ke baris berikutnya; isi flex memakai lebar minimum nol agar judul tidak mendorong halaman keluar layar.

## Elevation & Depth

Situs menggabungkan latar putih, pemisah tipis, dan bayangan lembut. Header arsip mendapat kedalaman dari gradien gelap, cahaya aksen, dan bayangan lebar. Kartu artikel dapat terangkat saat hover; daftar pembaca tetap datar. Tombol beranda dan bookmark meniadakan bayangan tombol umum. Nilai bayangan dan transisi yang dibangun tercatat di `.impeccable/design.json`.

Gerak aksi umum singkat (160ms), dengan perpindahan hover (−1px) dan penekanan skala (0.97); kartu umum memakai transisi (200ms). Dukungan reduced motion incumbent bersifat lokal pada animasi love/comment, bukan jaminan global untuk semua transisi.

## Shapes

Sudut mengikuti fungsi: badge kecil, thumbnail, kartu, panel minat, lalu header arsip yang lebih lebar. Tombol, navigasi halaman pembaca, dan opsi minat berbentuk pill. Garis aksen SectionHead (4px) memberi identitas tanpa menambah blok dekorasi baru. Foto memakai `object-fit: cover`; daftar pembaca mempertahankan rasio (4:3).

## Components

### Buttons

Aksi pill memakai `theme-btn` dengan varian primary, surface, dark, dan ghost; warna serta padding dasar ada pada frontmatter. Hover mengangkat sedikit, active menekan, focus-visible memberi outline. Minimum tombol umum adalah (42px), varian kecil (36px); override pembaca, bookmark, dan preview beranda menjadikannya minimal (44px). Ukuran lama yang lebih kecil bukan target untuk aksi pembaca baru.

Bookmark memakai ikon bookmark Bootstrap dan `aria-pressed`; keadaan tersimpan memakai warna primary beserta primary-contrast. Kontrol sibuk dinonaktifkan dan mengganti label. Kesalahan tampil inline.

### Chips

Badge kategori memakai sudut kecil dan teks tebal. Pilihan minat memakai checkbox asli dalam label pill berukuran minimal (44px), border netral, serta primary dan primary-contrast saat dipilih. Pilihan belum tercentang tetap terang.

### Cards / Containers

Kartu artikel beranda menggunakan komponen ArticleCard incumbent dan varian dashboard. Bentuk vertikal mempunyai permukaan putih, foto, badge, judul, dan metadata. Daftar pembaca memakai baris terbuka dengan pemisah, bukan kartu tambahan. Panel minat memakai latar lokal (#f8f9fa), border netral, padding (24px) yang turun ke (16px) pada ponsel.

### Inputs / Fields

Checkbox minat (16px) memakai aksen gelap dan label yang besar. Situs juga memiliki bidang pencarian incumbent; teks input, textarea, dan select pada lebar maksimum (768px) minimal (16px) untuk menghindari zoom fokus iOS. Focus-visible pembaca memakai outline gelap (3px), offset (3px); kontrol di header gelap memakai outline putih.

### Navigation

Navbar menggunakan logo, warna, item, dan varian dari dashboard. Tautan kategori incumbent memakai uppercase, bobot (700), ukuran (0.75rem), tracking (0.06em), dan garis bawah aksen untuk hover/active. Navigasi dua halaman pembaca berada di header arsip: aktif memakai primary, tidak aktif memakai latar gelap solid dengan border terang agar tetap terbaca di atas cahaya aksen. Navbar tersedia dalam varian times, compact, masthead, split, dan minimal; mobile memakai perilaku varian yang sudah ada.

### Section Heading

SectionHead mengikat bagian baru ke situs: garis kiri primary, judul tebal, subjudul netral, dan slot aksi yang membungkus. Preview pembaca menggunakannya bersama ArticleCard, tanpa identitas komponen baru.

## Do's and Don'ts

### Do:

- **Do** gunakan token dashboard dan logo situs sebagai sumber identitas.
- **Do** pertahankan bahasa Indonesia dan hierarki judul, foto, lalu metadata.
- **Do** pakai komponen SectionHead, ArticleCard, dan theme-btn ketika memperluas permukaan publik yang sejenis.
- **Do** pertahankan target aksi pembaca minimal 44px, fokus terlihat, dan aksi yang membungkus.
- **Do** uji teks serta keadaan aktif di atas aksen dashboard dan latar header gelap.

### Don't:

- **Don't** membekukan warna atau varian dashboard sebagai aturan universal.
- **Don't** menyamakan semua sudut; badge, thumbnail, kartu, header, dan aksi memiliki bentuk berbeda.
- **Don't** mengganti identitas incumbent ketika menambah fitur pembaca.
- **Don't** memperluas kicker dekoratif lama atau bayangan pencarian ber-offset keras menjadi pola baru; keduanya bukan bagian kanonis sistem ini.
