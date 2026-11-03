# Design System: Seputar Otaku (new.seputarotaku.com)

Referensi tampilan untuk deployment kedua codebase ini. Tujuannya satu: situs
ini tidak boleh terbaca sebagai "Mokultur dengan warna merah". Semua yang
tercatat di sini berlaku hanya saat `SITE_THEME=seputarotaku`; mokultur.com
tidak berubah sama sekali. Spesimen visualnya ada di
`docs/seputarotaku-styleguide.html`; sumber brand-nya di
`docs/seputarotaku-reference/`.

Status: **diimplementasikan** di `src/styles/themes/_seputarotaku.scss`
(saklar `SITE_THEME=seputarotaku`, lihat bab 5). Komponen yang belum diberi
tema: strip atas masthead (belum ada markup-nya), halaman kontak, media
partner, dan curhatan; keduanya masih memakai gaya Mokultur dengan token
warna yang sama.

---

## 1. Arah: "Hinomaru & Kotak Merah"

Sumber utamanya adalah **template post Instagram Seputar Otaku** (contoh di
`docs/seputarotaku-reference/ig-post.jpg`, dicek 2026-11-03), karena itulah
wajah brand yang dilihat pembaca setiap hari. Yang ada di post itu:

- Latar **hitam** (#0b0c0e) dengan **glow merah tua** dari pojok kiri atas.
- Logo: cakram merah berisi S + wordmark "seputar otaku" lowercase dua baris.
- **Kotak merah kategori** ("JAPAN"): uppercase tebal, sudut sedikit membulat,
  di **atas** judul.
- Judul **putih, tebal, sentence-case**, huruf geometris bulat (bukan
  kondensed, bukan uppercase).
- Baris **"Oleh Mochizou"**: byline kecil, nama ditebalkan.
- Tidak ada garis miring, tidak ada warna kedua, tidak ada ornamen lain.

Banner YouTube mereka (pita merah miring, wordmark techno) tidak dipakai lagi
sebagai sumber motif; post adalah bahasa yang konsisten, banner hanya satu
artefak.

Di web, bahasa post itu dipakai begini:

- **Chrome gelap, bidang baca terang.** Masthead (baris merek), hero, footer,
  dan satu panel gelap per halaman memakai `.glow`: hitam dengan glow merah
  di pojok kiri atas. Daftar berita dan isi artikel tetap putih supaya nyaman
  dibaca lama.
- **Kotak merah = kategori.** Di semua kartu berfoto, hero, dan kepala
  artikel, kategori adalah badge merah di atas judul, persis post. Di daftar
  padat (baris, sidebar, hasil pencarian) kategori menjadi teks merah di
  baris meta supaya daftar tetap tenang.
- **Satu keluarga huruf, Figtree**, pengganti terdekat untuk huruf geometris
  bulat di post (a dua tingkat, g satu tingkat, ujung t miring). Judul 700/800
  sentence-case dengan tracking rapat; hanya label yang uppercase.
- **Cakram merah (hinomaru)** adalah satu-satunya bentuk bulat: logo, avatar,
  penanda judul bagian. Selain itu satu radius 6px (panel besar 10px).
- **Byline "Oleh Nama"** dipakai persis seperti post: di hero, Terbaru, dan
  kepala artikel.

Mode per permukaan: beranda dan arsip = **Read** (padat, mudah dipindai);
detail artikel = **Read** (nyaman dibaca lama); dashboard pembaca, pencarian,
auth = **Operate**.

### Yang sengaja dibedakan dari Mokultur

| Mokultur (incumbent) | Seputar Otaku |
|---|---|
| Inter di semua tempat | Figtree, satu keluarga untuk judul, label, dan isi |
| Tombol pill 999px, hover terangkat + bayangan | Tombol radius 6px, sentence-case, hover ganti warna, tanpa bayangan |
| Badge kategori warna aksen, sudut membulat besar | Kotak merah 4px uppercase persis template post; di daftar padat jadi teks merah di baris meta |
| Section head: garis aksen kiri 4px | Section head: garis tinta 2px di atas + cakram merah, judul sentence-case 800 |
| Kartu putih membulat 12px, bayangan, `card-hover` | Tanpa kartu; foto 6px + teks dipisah garis 1px |
| Hero: gradien gelap di atas foto | Hero: panel hitam berglow merah, badge + judul putih di bidang solid di bawah foto |
| Navbar putih, cookie card hitam melayang | Masthead hitam berglow + baris kategori putih, cookie bar penuh di bawah |
| Archive hero gelap membulat 28px | Archive header putih bergaris tinta, judul besar sentence-case, tab bergaris |
| Panel "Pick" gelap | Panel putih berbingkai tinta 2px, kata "Pick" di kotak merah |

---

## 2. Token

Semua token diawali `--so-`. Nilai merek tetap bisa diubah dari dashboard:
`--so-red` membaca `--site-primary`, `--so-ink` membaca `--site-dark`.

```css
html[data-theme='seputarotaku'] {
  /* Warna */
  --so-red:        var(--site-primary, #c01c28);
  --so-red-deep:   #8e1420;      /* hover, teks merah kecil di atas putih */
  --so-red-tint:   #fdeceb;      /* latar sorotan, selection */
  --so-ink:        var(--site-dark, #121417);
  --so-ink-2:      #2a2f36;      /* hover di atas tinta */
  --so-black:      #0b0c0e;      /* latar post: masthead, hero, footer */
  --so-glow:       rgba(192, 28, 40, 0.55); /* glow merah di pojok bidang hitam */
  --so-paper:      #ffffff;      /* bidang konten */
  --so-ground:     #f5f6f8;      /* latar halaman, abu dingin */
  --so-text:       #15181c;
  --so-muted:      #5b6472;      /* meta, caption; condong biru, bukan abu netral */
  --so-rule:       #dfe3e8;      /* garis 1px */
  --so-rule-ink:   var(--so-ink);/* garis 2px struktural */
  --so-ok:         #1f7a4d;
  --so-warn:       #b8640f;

  /* Tipografi: satu keluarga */
  --so-font-ui:      'Figtree', 'Plus Jakarta Sans', 'Segoe UI', Roboto, Arial, sans-serif;
  --so-font-display: var(--so-font-ui);
  --so-font-label:   var(--so-font-ui);

  /* Bentuk */
  --so-radius:     6px;          /* foto, tombol, input, chip; badge 4px */
  --so-radius-lg:  10px;         /* panel besar: hero, Pick, modal, spotlight */

  /* Ritme */
  --so-gutter:     1.5rem;       /* 1rem ≤575px */
  --so-section:    2.5rem;       /* jarak antar bagian beranda; 1.75rem ponsel */
  --so-gap:        1.25rem;
  --so-gap-sm:     0.75rem;

  /* Gerak */
  --so-ease:       cubic-bezier(0.2, 0.8, 0.2, 1);
  --so-fast:       140ms;
  --so-base:       220ms;
}
```

Kontras: `--so-muted` di atas putih 6.3:1; `--so-red` di atas putih 5.9:1;
putih di atas `--so-red` 5.9:1; putih di atas `--so-black` 19:1. Teks merah
boleh dipakai sampai 0.75rem.

**Bidang hitam** (`.glow`):

```css
.glow {
  position: relative;
  background-color: var(--so-black);
  background-image: radial-gradient(42rem 26rem at 0 0, var(--so-glow), transparent 62%);
  color: #fff;
}
/* baris masthead pendek: glow lebih lembut supaya tidak jadi garis merah */
.navbar-brand-row.glow, .navbar-compact.glow { --so-glow: rgba(192, 28, 40, 0.38); }
```

Ukuran gradien tetap dalam rem, bukan persen, supaya glow terlihat sama di
masthead setinggi 64px dan di hero setinggi 600px.

### Font

| Peran | Keluarga | Bobot | Catatan |
|---|---|---|---|
| Display | Figtree | 800 | H1 artikel, H1 arsip, judul hero, judul bagian, angka peringkat, wordmark |
| Judul | Figtree | 700 | Judul kartu, baris daftar; 600 untuk judul kecil di sidebar dan hasil pencarian |
| UI & badan | Figtree | 400, 500 | Teks antarmuka dan isi artikel |
| Label | Figtree | 700 | Kategori, waktu, caption, tab, badge: uppercase, tracking 0.06em, ≤0.75rem |

Lisensi OFL; di-host sendiri di `static/fonts/Figtree-[wght].woff2` (variable,
subset Latin, `font-display: swap`), dideklarasikan di
`src/styles/themes/_seputarotaku-fonts.scss`. Deklarasi `@font-face` yang
tidak dipakai tidak diunduh browser, jadi aman ikut di bundel Mokultur.
Kalau font asli template post diketahui dan lisensinya mengizinkan, ganti di
satu tempat: `--so-font-ui`.

### Skala tipe

| Token | Ukuran / leading | Bobot | Dipakai |
|---|---|---|---|
| display-xl | clamp(1.875rem, 4vw, 2.75rem) / 1.08, tracking -0.025em | 800 | H1 artikel, H1 arsip |
| display-lg | clamp(1.5rem, 2.6vw, 2.125rem) / 1.1, tracking -0.02em | 800 | Judul hero utama, EventSpotlight |
| display-md | 1.25rem / 1.15, tracking -0.015em | 800 | Judul bagian, sentence-case |
| sorotan (`.hl`) | mengikuti judulnya, radius 0.2em | 800 | Satu kata kunci di kotak merah: "Pick" |
| title-lg | 1.25rem / 1.18 | 700 | Judul kartu besar |
| title | 1.0625rem / 1.22 | 700 | Judul kartu, baris daftar, rail hero |
| title-sm | 1rem / 1.3 | 600 | Judul di sidebar, read-also, hasil pencarian |
| body-lg | 1.0625rem / 1.75 | 400 | Isi artikel (maks 68ch) |
| body | 0.9375rem / 1.6 | 400 | Antarmuka |
| body-sm | 0.875rem / 1.5 | 400/500 | Deskripsi kartu, footer, byline |
| label | 0.75rem / 1 | 700 uppercase 0.06em | Kategori teks, meta, tab |
| badge | 0.6875rem / 1 | 700 uppercase 0.06em | Kotak merah kategori, kotak tinta status |
| label-xs | 0.6875rem / 1 | 700 uppercase | Caption, pintasan |

Semua judul `letter-spacing` negatif dan `text-wrap: balance`. Angka selalu
`font-variant-numeric: tabular-nums` di label dan tabel. Byline: "Oleh " 400 +
nama 700, `body-sm`.

---

## 3. Fondasi

### Grid & kontainer
`container-xl` Bootstrap tetap (1140/1320px). Gutter `--so-gutter`. Beranda
dua kolom: utama `minmax(0, 1fr)` + sidebar 320px, gap 2.5rem; ≤991px satu
kolom. Tidak ada `.container` kustom baru.

### Permukaan & kedalaman
Tiga lapisan: `--so-ground` (halaman), `--so-paper` (bidang konten, tanpa
bayangan, dipisah garis), dan `.glow` (chrome: baris merek masthead, hero,
footer, plus satu bidang gelap di tengah halaman: TechSection immersive di
beranda, "Baca selanjutnya" di artikel, EventSpotlight di event). Teks di
bidang gelap selalu di latar solid, tidak pernah di atas foto dengan gradasi.
Satu-satunya bayangan di situs adalah pada lapisan melayang (search palette,
auth modal, menu akun): `0 12px 32px rgba(18,20,23,.18)`.

### Garis
- 1px `--so-rule`: pemisah baris daftar, sidebar, footer kolom.
- 2px `--so-ink`: struktur (atas section head, bawah masthead, bingkai panel).
- 3px `--so-red`: hanya keadaan aktif (tab, link navbar aktif) dan
  NavProgress.

### Bentuk
Satu radius: `--so-radius` 6px untuk foto, thumbnail, tombol, input, chip,
pagination; badge 4px; panel besar (hero, Pick, modal, spotlight, "Baca
selanjutnya") `--so-radius-lg` 10px. Masthead dan footer tanpa radius (penuh
lebar). Bulat hanya cakram logo, avatar, dan penanda judul bagian.

### Gerak
Satu momen yang diarahkan: **garis bawah merah tumbuh dari kiri** pada judul
yang di-hover (`background-size` 0→100%, `--so-base`, `--so-ease`). Selain
itu hanya transisi warna `--so-fast`. Tidak ada `translateY`, tidak ada
`scale`, tidak ada animasi masuk per bagian. `prefers-reduced-motion`
mematikan `background-size` transition dan NavProgress hanya muncul/hilang.

### Permukaan browser
```css
::selection { background: var(--so-red-tint); color: var(--so-ink); }
:focus-visible { outline: 2px solid var(--so-red); outline-offset: 2px; }
input, textarea { caret-color: var(--so-red); accent-color: var(--so-red); }
* { scrollbar-width: thin; scrollbar-color: #b9c0ca var(--so-ground); }
a { text-underline-offset: 0.15em; text-decoration-thickness: 1.5px; }
```

---

## 4. Komponen

Nama file mengacu ke `src/components/`. "Dasar" = kelas global di
`custom.scss` yang di-override tema. Komponen fitur yang dimatikan untuk situs
ini (WEB_FEATURES kosong: talent, ratecard, moku, comifuro23, reels,
newsletter, push, swg) **tidak dibuatkan tema**; begitu pula anime dan forum.

### 4.1 Layout

**Navbar / masthead** (`layout/Navbar.svelte`, varian `times`)
- Strip atas 32px, latar `--so-ink`, teks putih 70%: kiri "ANIME · JEJEPANGAN
  · TOKUSATSU" (label), kanan ikon sosial 16px dan tombol "Masuk" (label
  putih, border putih 40%, radius 4px). Ponsel: strip disembunyikan.
- Baris merek 64px, `.glow` dengan glow lembut (0.38): logo cakram 36px +
  wordmark putih Figtree 800 1.375rem lowercase dua baris ("seputar / otaku",
  seperti logo di post). Kanan: pencarian (ikon putih, label "Cari" ≥768px),
  avatar merah. Ponsel: burger kiri, logo tengah, pencarian kanan; tinggi
  56px.
- Baris kategori 44px: link Figtree 700 0.875rem uppercase tracking 0.03em,
  warna `--so-text`; hover merah; aktif garis bawah 3px merah menempel pada
  garis tinta 2px di bawah baris. Ponsel: scroll horizontal, tanpa wrap,
  gradasi putih di tepi kanan sebagai petunjuk.
- Scrolled: baris merek dan kategori digabung jadi satu baris `.glow` 56px
  (logo 28px, wordmark satu baris 1.125rem, link putih 0.8125rem), tanpa
  bayangan.
- Sheet menu ponsel: panel putih dari kiri, lebar 84%, bingkai kanan tinta
  2px; daftar kategori Figtree 700 1.125rem dipisah garis; tautan ekstra
  (Seputar Otaku's Pick, Semua artikel, Penulis) sebagai label; sosial di
  bawah.
- Menu akun: panel putih bingkai tinta 2px radius 10px, item dengan ikon 16px.

**Footer** (`layout/Footer.svelte`)
- `.glow`, garis atas 4px `--so-red`. Padding 3rem/2rem.
- Kolom 1: logo cakram + wordmark putih, tagline `body-sm` putih 70%.
- Kolom tautan: judul kolom label putih 50%, tautan Figtree 500 0.9375rem
  putih 85%, hover putih + garis bawah merah.
- Sosial: tombol 36px radius 6px, border putih 25%, hover latar merah.
- Baris bawah dipisah garis putih 12%: © tahun · nama situs kiri, "Kebijakan
  Privasi · Kontak · Pengaturan cookie" kanan, keduanya label putih 50%.

**NavProgress**: bar 3px merah di bawah masthead (bukan di tepi atas layar).

**CookieConsent**: bar penuh di tepi bawah, latar `--so-paper`, garis atas
tinta 2px, padding 1rem gutter. Judul `title-sm`, teks `body-sm`, tiga aksi
(ghost, outline, primer merah). ≤575px aksi menumpuk penuh lebar. Bukan kartu
hitam melayang.

### 4.2 Tombol, label, kontrol (dasar: `.theme-btn`, `.badge-main`, form)

**Tombol** `.theme-btn`: tinggi 40px (sm 32px), padding 0 1rem, radius 6px,
Figtree 700 0.875rem sentence-case, ikon 16px gap 0.5rem.
- primary: latar merah, teks putih; hover `--so-red-deep`.
- dark: latar tinta, teks putih; hover `--so-ink-2`.
- surface/outline: latar putih, border 1.5px tinta, teks tinta; hover latar
  `--so-ground`.
- ghost: transparan, teks tinta, hover latar `--so-ground`; di atas hitam
  teks putih, hover putih 10%.
- icon: 40×40.
- Tidak ada box-shadow, tidak ada transform. `is-loading`: teks 60%, spinner
  cakram 14px berputar.

**Kategori** `.badge-main`: **kotak merah** persis post: latar `--so-red`,
teks putih Figtree 700 0.6875rem uppercase tracking 0.06em, padding 0.35rem
0.5rem, radius 4px, **di atas judul**. Dipakai di hero, kartu vertical,
magazine, feature-tile, kepala artikel. Di daftar padat (horizontal, minimal,
compact-news, rank, hasil pencarian, read-also) kategori jadi teks label
merah di baris meta tanpa latar.

**Status** (`Live`, `Terkini`, `Preview`, `Tersalin`): badge yang sama dengan
latar `--so-ink` (`Tersalin` memakai `--so-ok`). Berdampingan dengan badge
kategori, kategori selalu di kiri. Maksimal dua badge per judul.

**Sorotan** `.hl`: kotak merah di balik satu kata kunci di judul bagian
("Pick"); radius 0.2em, padding 0.06em 0.4em, bobot 800. Satu per judul.

**Chip/tag** (`PopularTags`, `GenreChips`, interest): radius 6px, border 1px
`--so-rule`, Figtree 500 0.875rem, "#" berwarna merah; aktif latar tinta teks
putih. Minimum tinggi 36px (interest editor 44px).

**Input**: tinggi 44px, border 1.5px `--so-rule`, radius 6px, Figtree 1rem;
focus border tinta + outline merah 2px offset 2px; error border merah + pesan
`label-xs` merah di bawah. Label field `label` `--so-muted`.
Select/checkbox/radio `accent-color` merah. Textarea radius 6px.

**Tab** (archive nav, PopularArticlesCard, AuthModal): label 700 uppercase,
padding 0.75rem 0, dipisah garis 1px; aktif garis bawah 3px merah, teks
tinta.

### 4.3 Judul bagian (`ui/SectionHead.svelte`)
Garis tinta 2px di atas, padding-top 0.75rem. Kiri: cakram merah 10px +
judul `display-md` (Figtree 800 sentence-case). Subjudul `body-sm` muted di
bawah judul. Slot aksi ("Lihat semua →") di kanan sebagai Figtree 700
0.875rem, panah bergerak 2px ke kanan saat hover. Tidak ada border-left.

### 4.4 Kartu artikel (`articles/ArticleCard.svelte`, `common/ArticleCard.svelte`)
Semua varian berbagi: foto radius 6px, tanpa border/bayangan; judul Figtree
700 sentence-case; hover judul = garis bawah merah tumbuh. Kartu berfoto
menyusun seperti post: foto, badge kategori, judul, (deskripsi), meta.
- **vertical** (default situs): foto 16:10, badge, judul `title`, deskripsi
  `body-sm` 2 baris, meta waktu label muted. Grid 4 kolom desktop, 2 kolom
  ≤767px.
- **horizontal**: thumb 3:2 120px kiri, judul `title`, meta "KATEGORI ·
  waktu" di bawah; dipisah garis.
- **magazine**: foto 4:5 radius 6px, gradasi tinta dari bawah, badge lalu
  judul putih di dalam bidang bawah.
- **minimal**: thumb 72px, judul `title-sm`, meta; tanpa deskripsi.
- **compact-news**: tanpa foto, kategori di kiri sebagai kolom label 88px,
  judul `title-sm`.
- **feature-tile**: foto 3:2, badge, judul `title-lg`.
- **borderless-feed**: seperti horizontal tanpa garis, gap 1rem.

### 4.5 Beranda

**Hero** (`hero/Hero.svelte`, rekomendasi `top-stories`)
- Panel `.glow` radius 10px penuh lebar kontainer; ini versi web dari post
  mereka.
- Kolom utama 7/12: foto 16:9 radius 6px; di bawahnya badge kategori, judul
  `display-lg` putih, deskripsi putih 70% maks 2 baris, lalu byline "Oleh
  **Nama**" + waktu label putih 60%. Teks di bidang solid, bukan gradasi di
  atas foto.
- Rail 5/12: empat baris dipisah garis putih 14%, thumb 96×64, badge
  kategori, judul `title` putih, waktu label. Baris pertama mendapat badge
  status tinta "TERKINI" di sebelah kategori.
- Varian lain (cinematic, split, ticker, masthead, editorial-grid,
  spotlight-stack) mengikuti panel `.glow` yang sama; cinematic kehilangan
  gradasi dan memakai bidang solid di bawah foto untuk teks.

**Terbaru** (`home/LatestList.svelte`, `latest_section_style` disarankan
`news-list`): baris 1px, thumb 3:2 lebar 180px (ponsel 104px), judul
`title`, deskripsi `body-sm` (sembunyi ≤575px), meta "KATEGORI · 4 jam lalu ·
Oleh **Penulis**". Setiap baris penuh dapat diklik; hover hanya judul.

**Seputar Otaku's Pick** (`home/ReaderSection.svelte`): panel `--so-paper`
bingkai tinta 2px radius 10px, padding 1.5rem. Judul `display-md` 1.5rem
dengan kata "Pick" sebagai sorotan `.hl`. Deskripsi, lalu grid kartu vertical
4 kolom. CTA "Pilih minat →" tombol primary. Bukan panel gelap.

**Liputan & Press Release / EventSection** (`standard`): SectionHead + grid
kartu vertical 4 kolom + tombol "Lihat semua".

**TechSection** (`immersive`): satu-satunya bidang gelap di tengah beranda.
`.glow` radius 10px, judul bagian putih dengan cakram merah, kartu magazine,
garis putih 12%.

**NewsroomBlock**: lead feature-tile kiri + empat compact-news kanan dipisah
garis; judul blok dari SectionHead.

**WritersCard**: judul sidebar; daftar avatar cakram 32px + nama Figtree 700 +
jumlah artikel label.

**AdBanner**: bingkai 1px `--so-rule` radius 6px, label "IKLAN" `label-xs`
muted di sudut kanan atas.

**Artikel Lainnya**: grid vertical 4 kolom, tanpa kartu, dipisah gap 1.5rem,
garis tinta 2px di atas bagian.

Komponen beranda yang dimatikan: `Cf23PromoCard`, `MokuThreadsPromo`,
`ReelsSection`, `AnimePosterRail`, `AnimeSeasonSection`, `NewsletterSignup`,
`CurhatPromoCard`.

### 4.6 Sidebar (`sidebar/*`, `common/PopularArticlesCard`, `common/PopularTags`)

**SideCard** (bingkai semua widget): tanpa kotak. Judul `display-md`
1.0625rem dengan cakram merah 8px, garis tinta 2px di bawah judul, lead
`body-sm` muted, konten, footer dipisah garis 1px. Varian `dark` (satu widget
per halaman): `.glow` radius 10px, teks putih.

**PopularArticlesCard** ("Terpopuler"): tab label (Hari ini / Minggu ini);
peringkat 1 = foto 16:9 + angka "1" Figtree 800 2.5rem merah di pojok kiri
atas foto (latar putih, radius bawah-kanan 6px); peringkat 2–5 = baris angka
Figtree 800 1.5rem merah kolom 2rem + judul `title-sm` + meta, dipisah garis.

**PopularTags**: chip sesuai 4.2.

**SocialFollowCard** ("Ikuti Seputar Otaku"): baris ikon platform 20px
tinta + nama akun Figtree 700 + platform label muted + tombol "Ikuti" outline
sm kanan; dipisah garis. Tanpa gradasi warna platform.

**GoogleNewsFollow**: tombol dark penuh lebar dengan ikon; varian inline di
artikel: baris bingkai 1px radius 6px.

**ContactCard**: email/WhatsApp sebagai baris label + nilai Figtree 700;
tombol outline.

**MediaPartnerCard**: grid logo 3 kolom, tiap logo bingkai 1px radius 6px,
grayscale → berwarna saat hover.

### 4.7 Artikel (`routes/article/[id]/[slug]`, `article_detail_style`
disarankan `classic`)

**Kepala artikel**: susunan post di atas putih. Breadcrumb label muted; badge
kategori merah; judul `display-xl` maks 20 kata ditampilkan penuh; deskripsi
`body-lg` muted; baris penulis: avatar cakram 32px, "Oleh **Nama**" + tautan,
tanggal dan waktu baca label tabular. Foto hero 16:9 penuh lebar kolom radius
6px, caption `label-xs` muted di bawah, rata kiri. Tidak ada garis hias di
bawah kepala.

**Baris aksi** (`ShareButtons`, `BookmarkButton` share, Komentar): tombol
outline sm 36px radius 6px dengan ikon; label "Bagikan", "Simpan", "Komentar"
muncul ≥768px. Keadaan tersimpan: latar tinta ikon putih. "Tersalin":
`--so-ok`.

**Isi** `.bodyArticle`: Figtree `body-lg`, maks 68ch, warna `--so-text`.
- h2 Figtree 800 1.5rem tracking -0.02em, h3 1.25rem, h4 700 1.125rem;
  margin atas 2rem, bawah 0.75rem.
- Tautan merah, garis bawah 1.5px offset 0.15em; hover `--so-red-deep`.
- Blockquote: tanpa border-left; Figtree 600 1.25rem leading 1.35, cakram
  merah 10px di awal, padding 1rem 0, garis 1px atas-bawah.
- Figure: gambar radius 6px, caption `label-xs` muted.
- Tabel: garis 1px, header label, angka tabular.
- Kode/pre: latar `--so-ground`, 1px rule, radius 6px.
- Paragraf pertama tidak diberi drop cap.

**Read-also** ("Baca juga"): blok di dalam isi, garis tinta 2px atas, label
"BACA JUGA" merah, judul `title-sm`, thumb 72px kanan.

**Baca selanjutnya** (`article-next`, ponsel): `.glow` radius 10px, label
putih 50% "BERIKUTNYA", judul Figtree 700 putih, panah.

**Komentar**: judul bagian `display-md`; form: textarea radius 6px, tombol
primary "Kirim"; tamu melihat kotak bingkai 1px radius 6px "Masuk untuk
berkomentar" dengan tombol outline. Daftar komentar: avatar cakram 32px, nama
Figtree 700, waktu label, isi body; balasan menjorok 2.5rem dengan garis 1px
kiri (1px, bukan aksen).

**PhotoStory** (`photo_story` aktif): header tinta, galeri grid 3 kolom radius
6px, viewer layar penuh `--so-black` dengan caption label.

**ArticleStoryShare**: tombol outline sm "Bagikan ke Story".

**Sidebar artikel**: SocialFollowCard, GoogleNewsFollow, Rekomendasi (baris
minimal), PopularTags, AdBanner.

### 4.8 Arsip (category, tag, author, index-article, search, untuk-kamu)

**Archive header** (dasar `.archive-hero`): bukan panel gelap. Latar
`--so-paper`, garis tinta 2px atas-bawah, padding 2rem gutter. Judul
`display-xl` dengan cakram merah 12px, deskripsi `body-lg` muted, hitung
artikel label ("128 ARTIKEL"). Chips/sub-navigasi sebagai tab (4.2).
Kategori mendapat tombol "Ikuti topik" outline di kanan.

**Daftar**: `latest-row` seperti Terbaru. Search: field 52px bingkai tinta
2px radius 6px, ikon kiri, hasil berbaris; "tidak ada hasil" sebagai kotak
bingkai 1px dengan saran kategori.

**Pagination**: kotak 40px radius 6px bingkai 1px `--so-rule`, angka Figtree
600 tabular; aktif latar tinta teks putih; hover teks merah; prev/next ikon.

**Author** (`creator-profile-*`): header putih, avatar cakram 96px dengan
cincin merah 3px, nama `display-xl`, handle label, deskripsi; statistik
sebagai baris label + angka Figtree 800 (bukan tile metrik).

### 4.9 Event (`event/*`, `routes/event`)

**EventCard**: poster 3:4 radius 6px; tab tanggal = badge merah di pojok kiri
atas poster ("31 OKT–1 NOV"); nama Figtree 700 `title`; tempat dan harga
label muted dengan ikon 14px.

**EventSpotlight** (event berikutnya): `.glow` radius 10px, label putih 50%
"BERIKUTNYA", nama `display-lg` putih, countdown angka Figtree 800 tabular,
tombol primary.

**EventScheduleSection / EventAgendaRow**: tabel garis 1px, kolom tanggal
label tabular lebar 7rem, nama event Figtree 700, lokasi muted.

**AddToCalendar**: `<details>` dengan tombol outline sm; menu panel putih
bingkai tinta 2px radius 10px.

**EventPromoCard**: dihapus dari rotasi (fitur promosi ikut event_section
standard saja).

### 4.10 Pencarian & auth

**SearchPalette** (`search/SearchPalette.svelte`): overlay tinta 55%; panel
putih lebar 640px bingkai tinta 2px radius 10px, bayangan satu-satunya. Bar:
ikon lensa, input Figtree 1.25rem tanpa border, tombol tutup label "ESC"
radius 4px. Grup "Jelajahi kategori" sebagai chip. Hasil: baris thumb 56px +
judul `title-sm` + meta label (kategori teks merah); aktif latar
`--so-red-tint`. Footer: pintasan `label-xs`.

**AuthModal**: panel putih 440px bingkai tinta 2px radius 10px; cakram logo
48px; judul Figtree 800 1.5rem; tab Masuk/Daftar (4.2); field 4.2; tombol
primary penuh; "Lanjutkan dengan Google" outline dengan ikon; perks sebagai
daftar ikon 16px + `body-sm`. Google login saat ini tidak aktif di situs ini:
tombol disembunyikan.

### 4.11 Dashboard pembaca (`routes/dashboard`, `reader/*`, `dashboard/*`)

Mode Operate. Header halaman: judul `display-xl` + cakram, tab (Untuk Kamu /
Tersimpan / Riwayat / Aktivitas) sebagai tab 4.2, sticky di bawah masthead.
**ReaderItem**: baris 1px, thumb 160×107 radius 6px, judul `title`, alasan
rekomendasi label merah ("KARENA KAMU MENGIKUTI ANIME"). **InterestEditor**:
chip 44px, latar panel `--so-ground` bingkai 1px radius 6px, tombol "Simpan
minat" primary. **ReadingHistory**: baris berkelompok per hari, tanggal label.
**BottomNav** (ponsel): bar putih garis tinta 2px atas, 4 ikon 24px + label
0.625rem, aktif merah. **BookmarkButton** surface: outline; tersimpan: tinta.
**FollowTopic**: outline sm; diikuti: dark dengan centang. Halaman akun: form
4.2.

### 4.12 Halaman statis, kontak, media partner, error

**Pages** (`/page/[id]`): judul `display-xl`, isi seperti `.bodyArticle`,
maks 68ch, daftar isi tidak ada. **Contact**: dua kolom, form 4.2 + ContactCard.
**Media partner**: header arsip + grid logo 4 kolom bingkai 1px radius 6px,
hover berwarna; tombol "Jadi media partner" primary. **Error 404/500**: cakram
merah 96px berisi angka Figtree 800 putih, judul Figtree 800, tombol dark
"Kembali ke beranda", pencarian.

### 4.13 Curhatan (halaman masih ada, promo mati)
`CurhatCard`: bingkai 1px radius 6px, kutipan Figtree 600 1.125rem, meta
label; aksi ikon. `CurhatForm`: 4.2. Tidak perlu dikerjakan sebelum halaman
ini diputuskan tetap atau dihapus.

### 4.14 Lain-lain
**Carousel** (`ui/Carousel.svelte`): kontrol 40px radius 6px tinta, indikator
8×8 radius 2px putih 50%, aktif merah. **ShareSheet**: panel bawah putih garis
tinta 2px atas, grid ikon 4 kolom. **ArticleRankItem**: 4.6.
**ChatWidget, PushPrompt, Cf23, Talent*, Anime*, Moku*, Reels, Newsletter**:
tidak aktif, tanpa tema.

---

## 5. Implementasi

Satu codebase, satu tema tambahan, nol perubahan pada tampilan Mokultur.

1. **Saklar tema**: `SITE_THEME` di `src/lib/server/site.ts`
   (`'mokultur' | 'seputarotaku'`, default `mokultur`). `hooks.server.ts`
   menambahkan `data-theme="seputarotaku"` pada `<html>` lewat
   `transformPageChunk`, sehingga SSR dan klien sama dan tidak ada kedip.
   `+layout.server.ts` ikut mengembalikan `site.theme` untuk komponen yang
   perlu bercabang markup (Navbar strip atas, Hero, dan posisi badge
   kategori di ArticleCard).
2. **Font**: `static/themes/seputarotaku/Figtree.woff2` + `Figtree-ext.woff2`
   (variable 300–900, subset Latin dan Latin-ext, `font-display: swap`),
   dideklarasikan di `_fonts.scss`, preload hanya saat tema aktif (di
   `+layout.svelte`). Diletakkan di luar `/fonts/` supaya service worker
   mokultur.com tidak ikut mem-precache.
3. **Stylesheet**: `src/styles/themes/_seputarotaku.scss`, di-import paling
   akhir di `app.scss`. Semua selektor diawali `html[data-theme='seputarotaku']`
   sehingga spesifisitas selalu menang atas `custom.scss` tanpa `!important`.
   Urutan isi file mengikuti bab 3–4 dokumen ini.
4. **Settings dashboard** untuk situs ini: `navbar_style=times`,
   `hero_type=top-stories`, `card_style=vertical`,
   `latest_section_style=news-list`, `article_detail_style=classic`,
   `event_section_style=standard`, `tech_section_style=immersive`,
   `navbar_bg=#0b0c0e`, `navbar_text=#ffffff`, `primary_color=#c01c28`,
   `dark_color=#121417`.
5. **Tahapan**: (a) fondasi: token, font, tombol, badge, section head,
   kartu, masthead, footer, cookie; (b) beranda: hero, Terbaru, Pick, event,
   tech, sidebar; (c) artikel dan arsip; (d) pencarian, auth, dashboard,
   event, pagination, error. Tiap tahap dicek dengan screenshot desktop
   1440×1000 dan ponsel 390×844 di `.impeccable/review/seputarotaku/`, dan
   pembanding SSR mokultur.com harus tetap identik.
6. **Verifikasi Mokultur tak berubah**: `SITE_THEME` kosong → tidak ada
   atribut `data-theme`, tidak ada rule tema yang cocok; diff HTML SSR 17
   halaman seperti yang dipakai saat multisite.

## Do & Don't

**Do**
- Pakai cakram merah hanya sebagai logo, avatar, dan penanda kecil; satu per
  judul.
- Pisahkan konten dengan garis, bukan kotak.
- Kategori = kotak merah di atas judul pada kartu berfoto, hero, dan kepala
  artikel; teks merah di baris meta pada daftar padat.
- Judul sentence-case dengan tracking rapat; uppercase hanya untuk label dan
  badge.
- Byline "Oleh **Nama**" di hero, Terbaru, dan kepala artikel.
- Bidang gelap hanya `.glow` (hitam + glow merah dari pojok kiri atas) untuk
  chrome dan satu panel per halaman; bidang baca tetap putih.

**Don't**
- Jangan pill, jangan radius >10px, jangan bayangan pada kartu.
- Jangan gradasi gelap di atas foto hero; teks selalu di bidang solid.
- Jangan garis miring, jangan huruf kondensed, jangan judul uppercase.
- Jangan border-left aksen pada judul, kutipan, atau kartu.
- Jangan lebih dari dua badge per judul, dan jangan sorot seluruh judul.
- Jangan tambah warna aksen kedua; status memakai `--so-ok`/`--so-warn`
  saja. Glow merah hanya di `.glow`, bukan di bidang putih.
- Jangan pakai Inter di situs ini, termasuk sebagai fallback pertama.
