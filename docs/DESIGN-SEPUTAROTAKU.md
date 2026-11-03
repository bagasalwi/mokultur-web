# Design System: Seputar Otaku (new.seputarotaku.com)

Referensi tampilan untuk deployment kedua codebase ini. Tujuannya satu: situs
ini tidak boleh terbaca sebagai "Mokultur dengan warna merah". Semua yang
tercatat di sini berlaku hanya saat `SITE_THEME=seputarotaku`; mokultur.com
tidak berubah sama sekali. Spesimen visualnya ada di
`docs/seputarotaku-styleguide.html`.

Status: **referensi, belum diimplementasikan.** Bagian "Implementasi" di bawah
menjelaskan cara memasangnya tanpa mengganggu Mokultur.

---

## 1. Arah: "Hinomaru & Lipatan"

Identitas diambil dari logo Seputar Otaku sendiri: huruf S dari pita kertas
yang terlipat, di dalam cakram merah. Dua bentuk itu menjadi seluruh bahasa
visual situs:

- **Cakram merah (hinomaru)** adalah satu-satunya bentuk bulat di situs:
  penanda judul bagian, titik aktif, avatar, dan logo. Tidak ada tombol pill,
  tidak ada kartu membulat.
- **Lipatan kertas** menjadi motif sudut: foto unggulan, panel, dan modal
  mendapat satu sudut terpotong diagonal (`clip-path`) seperti ujung halaman
  yang dilipat. Hanya satu sudut, selalu kanan-bawah, ukuran 14px (desktop)
  atau 10px (ponsel).
- Sisanya **putih dingin, tinta, dan garis**: halaman padat seperti situs
  berita Jepang (Natalie, Famitsu, Oricon): rapat, tegas, putih, merah
  secukupnya.

Mode per permukaan: beranda dan arsip = **Read** (padat, mudah dipindai);
detail artikel = **Read** (nyaman dibaca lama); dashboard pembaca, pencarian,
auth = **Operate**.

### Yang sengaja dibedakan dari Mokultur

| Mokultur (incumbent) | Seputar Otaku |
|---|---|
| Inter di semua tempat | Barlow + Barlow Condensed, label Chakra Petch |
| Tombol pill 999px, hover terangkat + bayangan | Tombol kotak 2px, hover ganti warna, tanpa bayangan |
| Badge kategori isi penuh di atas judul | Kategori merah di baris meta **di bawah** judul |
| Section head: garis aksen kiri 4px | Section head: garis tinta 2px di atas + cakram merah |
| Kartu putih membulat 12px, bayangan, `card-hover` | Tanpa kartu; foto + teks dipisah garis 1px, sudut 0 |
| Hero gelap: gradien + teks di atas foto | Hero terang: foto di atas, judul tinta di bawah |
| Navbar hitam, cookie card hitam melayang | Masthead putih bergaris tinta, cookie bar penuh di bawah |
| Archive hero gelap membulat 28px | Archive header putih, judul kondensed besar, tab bergaris |
| Panel "Pick" gelap | Panel putih berbingkai tinta 2px dengan lipatan |

---

## 2. Token

Semua token diawali `--so-`. Nilai merek tetap bisa diubah dari dashboard:
`--so-red` membaca `--site-primary`, `--so-ink` membaca `--site-dark`.

```css
html[data-theme='seputarotaku'] {
  /* Warna */
  --so-red:        var(--site-primary, #c01c28);
  --so-red-deep:   #8e1420;      /* hover, teks merah di atas putih kecil */
  --so-red-tint:   #fdeceb;      /* latar sorotan, selection */
  --so-ink:        var(--site-dark, #121417);
  --so-ink-2:      #2a2f36;      /* teks sekunder di atas tinta */
  --so-paper:      #ffffff;      /* bidang konten */
  --so-ground:     #f5f6f8;      /* latar halaman, abu dingin */
  --so-text:       #15181c;
  --so-muted:      #5b6472;      /* meta, caption; condong biru, bukan abu netral */
  --so-rule:       #dfe3e8;      /* garis 1px */
  --so-rule-ink:   var(--so-ink);/* garis 2px struktural */
  --so-ok:         #1f7a4d;
  --so-warn:       #b8640f;

  /* Tipografi */
  --so-font-ui:      'Barlow', 'Segoe UI', Roboto, Arial, sans-serif;
  --so-font-display: 'Barlow Condensed', 'Arial Narrow', 'Barlow', sans-serif;
  --so-font-label:   'Chakra Petch', 'Barlow', sans-serif;

  /* Bentuk */
  --so-radius:     2px;          /* kontrol */
  --so-radius-img: 0;
  --so-fold:       14px;         /* sudut lipatan desktop; 10px ≤575px */
  --so-fold-clip:  polygon(0 0, 100% 0, 100% calc(100% - var(--so-fold)), calc(100% - var(--so-fold)) 100%, 0 100%);

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
putih di atas `--so-red` 5.9:1; putih di atas `--so-ink` 17:1. Teks merah
boleh dipakai sampai 0.75rem.

### Font

| Peran | Keluarga | Bobot yang dipakai | Catatan |
|---|---|---|---|
| Display | Barlow Condensed | 600, 700 | Judul artikel, judul bagian, angka peringkat, H1 arsip |
| UI & badan | Barlow | 400, 500, 600 | Teks antarmuka dan isi artikel |
| Label | Chakra Petch | 600 | Kategori, waktu, caption, tab, pintasan keyboard. Selalu uppercase, tracking 0.08em, ≤0.8rem |

Ketiganya lisensi OFL; di-host sendiri di `static/fonts/` sebagai woff2
(subset Latin), dideklarasikan di `src/styles/themes/_seputarotaku-fonts.scss`.
Deklarasi `@font-face` yang tidak dipakai tidak diunduh browser, jadi aman
ikut di bundel Mokultur.

### Skala tipe

| Token | Ukuran / leading | Font | Dipakai |
|---|---|---|---|
| display-xl | clamp(2.25rem, 5vw, 3.25rem) / 1.05, tracking -0.01em | Condensed 700 | H1 artikel, H1 arsip |
| display-lg | clamp(1.75rem, 3vw, 2.5rem) / 1.08 | Condensed 700 | Judul hero utama |
| display-md | 1.5rem / 1.15 | Condensed 700, uppercase, tracking 0.02em | Judul bagian |
| title-lg | 1.375rem / 1.2 | Condensed 600 | Judul kartu besar, rail hero |
| title | 1.125rem / 1.25 | Condensed 600 | Judul kartu, baris daftar |
| title-sm | 1rem / 1.3 | Barlow 600 | Judul di sidebar, read-also |
| body-lg | 1.0625rem / 1.75 | Barlow 400 | Isi artikel (maks 68ch) |
| body | 0.9375rem / 1.6 | Barlow 400 | Antarmuka |
| body-sm | 0.875rem / 1.5 | Barlow 400/500 | Deskripsi kartu, footer |
| label | 0.75rem / 1 | Chakra 600 uppercase | Kategori, meta, tab |
| label-xs | 0.6875rem / 1 | Chakra 600 uppercase | Caption, pintasan |

Angka selalu `font-variant-numeric: tabular-nums` di label dan tabel.

---

## 3. Fondasi

### Grid & kontainer
`container-xl` Bootstrap tetap (1140/1320px). Gutter `--so-gutter`. Beranda
dua kolom: utama `minmax(0, 1fr)` + sidebar 320px, gap 2.5rem; ≤991px satu
kolom. Tidak ada `.container` kustom baru.

### Permukaan & kedalaman
Hanya tiga lapisan: `--so-ground` (halaman), `--so-paper` (bidang konten,
tanpa bayangan, dipisah garis), dan `--so-ink` (satu pita gelap per halaman:
TechSection immersive di beranda, "Baca selanjutnya" di artikel, footer).
Satu-satunya bayangan di situs adalah pada lapisan melayang (search palette,
auth modal, menu akun): `0 12px 32px rgba(18,20,23,.18)`.

### Garis
- 1px `--so-rule`: pemisah baris daftar, sidebar, footer kolom.
- 2px `--so-ink`: struktur (atas section head, bawah masthead, bingkai panel).
- 3px `--so-red`: hanya keadaan aktif (tab, link navbar aktif) dan
  NavProgress.

### Bentuk
Gambar radius 0. Kontrol 2px. Lipatan hanya pada: foto utama hero, foto hero
artikel, panel Pick, panel auth, search palette, EventSpotlight, modal.
Thumbnail kecil (≤160px) tidak dilipat.

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
  putih, border putih 40%). Ponsel: strip disembunyikan.
- Baris merek 64px, latar `--so-paper`: logo cakram 36px + wordmark Barlow
  Condensed 700 1.5rem ("seputar otaku", lowercase seperti logo). Kanan:
  pencarian (ikon, label "Cari" ≥768px), avatar/akun. Ponsel: burger kiri,
  logo tengah, pencarian kanan; tinggi 56px.
- Baris kategori 44px: link Barlow Condensed 600 1rem uppercase tracking
  0.04em, warna `--so-text`; hover merah; aktif garis bawah 3px merah
  menempel pada garis tinta 2px di bawah baris. Ponsel: scroll horizontal,
  tanpa wrap, gradasi putih di tepi kanan sebagai petunjuk.
- Scrolled: baris merek dan kategori digabung jadi 56px (logo 28px, link
  0.9375rem), bayangan tidak ada, garis tinta tetap.
- Sheet menu ponsel: panel putih dari kiri, lebar 84%, bingkai kanan tinta
  2px; daftar kategori Condensed 1.25rem dipisah garis; tautan ekstra
  (Seputar Otaku's Pick, Semua artikel, Penulis) sebagai label; sosial di
  bawah.
- Menu akun: panel putih bingkai tinta 2px, lipatan, item dengan ikon 16px.

**Footer** (`layout/Footer.svelte`)
- Latar `--so-ink`, garis atas 4px `--so-red`. Padding 3rem/2rem.
- Kolom 1: logo cakram + wordmark putih, tagline `body-sm` putih 70%.
- Kolom tautan: judul kolom label putih 50%, tautan Barlow 500 0.9375rem
  putih 85%, hover putih + garis bawah merah.
- Sosial: tombol kotak 36px, border putih 25%, hover latar merah.
- Baris bawah dipisah garis putih 12%: © tahun · nama situs kiri, "Kebijakan
  Privasi · Kontak · Pengaturan cookie" kanan, keduanya label putih 50%.

**NavProgress**: bar 3px merah di bawah masthead (bukan di tepi atas layar).

**CookieConsent**: bar penuh di tepi bawah, latar `--so-paper`, garis atas
tinta 2px, padding 1rem gutter. Judul `title-sm`, teks `body-sm`, tiga aksi
kotak (ghost, outline, primer merah). ≤575px aksi menumpuk penuh lebar.
Bukan kartu hitam melayang.

### 4.2 Tombol, label, kontrol (dasar: `.theme-btn`, `.badge-main`, form)

**Tombol** `.theme-btn`: tinggi 40px (sm 32px), padding 0 1rem, radius 2px,
Barlow 600 0.875rem uppercase tracking 0.06em, ikon 16px gap 0.5rem.
- primary: latar merah, teks putih; hover `--so-red-deep`.
- dark: latar tinta, teks putih; hover `--so-ink-2`.
- surface/outline: latar putih, border 1.5px tinta, teks tinta; hover latar
  `--so-ground`.
- ghost: transparan, teks tinta, hover latar `--so-ground`; di atas tinta
  teks putih, hover putih 10%.
- icon: 40×40 kotak.
- Tidak ada box-shadow, tidak ada transform. `is-loading`: teks 60%, spinner
  cakram merah 14px berputar.

**Kategori** `.badge-main`: bukan badge isi. Teks label merah
(`--so-red-deep` jika <0.75rem), tanpa latar, tanpa padding. Di atas foto
(magazine/overlay) baru memakai latar merah penuh, padding 0.25rem 0.5rem,
radius 0.

**Status badge** (Live, Preview, Baru): latar merah, label putih, radius 0,
padding 0.2rem 0.45rem. Hanya ini badge berisi.

**Chip/tag** (`PopularTags`, `GenreChips`, interest): kotak radius 2px,
border 1px `--so-rule`, Barlow 500 0.875rem, "#" berwarna merah; aktif latar
tinta teks putih. Minimum tinggi 36px (interest editor 44px).

**Input**: tinggi 44px, border 1.5px `--so-rule`, radius 2px, Barlow 1rem;
focus border tinta + outline merah 2px offset 2px; error border merah + pesan
`label-xs` merah di bawah. Label field Chakra `label` `--so-muted`.
Select/checkbox/radio `accent-color` merah. Textarea radius 2px.

**Tab** (archive nav, PopularArticlesCard, AuthModal): label Chakra, padding
0.75rem 0, dipisah garis 1px; aktif garis bawah 3px merah, teks tinta.

### 4.3 Judul bagian (`ui/SectionHead.svelte`)
Garis tinta 2px di atas, padding-top 0.75rem. Kiri: cakram merah 10px +
judul `display-md`. Subjudul `body-sm` muted di bawah judul. Slot aksi
("Lihat semua →") di kanan sebagai Barlow 600 0.875rem, panah bergerak 2px ke
kanan saat hover. Tidak ada border-left.

### 4.4 Kartu artikel (`articles/ArticleCard.svelte`, `common/ArticleCard.svelte`)
Semua varian berbagi: foto radius 0, tanpa border/bayangan; judul Condensed;
baris meta di **bawah** judul: `KATEGORI` merah · waktu muted, keduanya
label; hover judul = garis bawah merah tumbuh.
- **vertical** (default situs): foto 16:10, judul `title`, deskripsi
  `body-sm` 2 baris, meta. Grid 4 kolom desktop, 2 kolom ≤767px.
- **horizontal**: thumb 160×107 kiri, judul `title`, meta; dipisah garis.
- **magazine**: foto 4:5 dengan lipatan, judul putih di atas gradasi tinta
  dari bawah, kategori badge merah isi penuh di pojok kiri atas.
- **minimal**: thumb 72px, judul `title-sm`, tanpa deskripsi.
- **compact-news**: tanpa foto, kategori di kiri sebagai kolom label 88px,
  judul `title-sm`.
- **feature-tile**: foto 3:2 dengan lipatan, judul `title-lg`.
- **borderless-feed**: seperti horizontal tanpa garis, gap 1rem.

### 4.5 Beranda

**Hero** (`hero/Hero.svelte`, rekomendasi `top-stories`)
- Kolom utama 7/12: foto 16:9 dengan lipatan; di bawahnya judul
  `display-lg`, deskripsi `body` muted maks 2 baris, meta label. Tidak ada
  teks di atas foto, tidak ada gradasi gelap.
- Rail 5/12: empat baris dipisah garis 1px, thumb 96×64, judul `title`,
  meta. Baris pertama mendapat label "TERKINI" merah.
- Latar tetap `--so-ground`; blok hero duduk di `--so-paper` dengan garis
  tinta 2px di atas dan bawah.
- Varian lain (cinematic, split, ticker, masthead, editorial-grid,
  spotlight-stack) mengikuti token yang sama; cinematic kehilangan gradasi
  dan memakai pita tinta di bawah foto untuk teks.

**Terbaru** (`home/LatestList.svelte`, `latest_section_style` disarankan
`news-list`): baris 1px, thumb 3:2 lebar 180px (ponsel 104px), judul
`title`, deskripsi `body-sm` (sembunyi ≤575px), meta "KATEGORI · 4 jam lalu ·
oleh Penulis". Setiap baris penuh dapat diklik; hover hanya judul.

**Seputar Otaku's Pick** (`home/ReaderSection.svelte`): panel `--so-paper`
bingkai tinta 2px + lipatan, padding 1.5rem. Judul `display-md` dengan kata
"Pick" diberi latar merah teks putih (badge status). Deskripsi, lalu grid
kartu vertical 4 kolom. CTA "Pilih minat →" tombol primary. Bukan panel gelap.

**Liputan & Press Release / EventSection** (`standard`): SectionHead + grid
kartu vertical 4 kolom + tombol "Lihat semua".

**TechSection** (`immersive`): satu-satunya pita gelap beranda. Latar
`--so-ink`, judul bagian putih dengan cakram merah, kartu magazine, garis
putih 12%.

**NewsroomBlock**: lead feature-tile kiri + empat compact-news kanan dipisah
garis; judul blok dari SectionHead.

**WritersCard**: judul sidebar; daftar avatar cakram 32px + nama Barlow 600 +
jumlah artikel label.

**AdBanner**: bingkai 1px `--so-rule`, label "IKLAN" `label-xs` muted di sudut
kanan atas, gambar radius 0.

**Artikel Lainnya**: grid vertical 4 kolom, tanpa kartu, dipisah gap 1.5rem,
garis tinta 2px di atas bagian.

Komponen beranda yang dimatikan: `Cf23PromoCard`, `MokuThreadsPromo`,
`ReelsSection`, `AnimePosterRail`, `AnimeSeasonSection`, `NewsletterSignup`,
`CurhatPromoCard`.

### 4.6 Sidebar (`sidebar/*`, `common/PopularArticlesCard`, `common/PopularTags`)

**SideCard** (bingkai semua widget): tanpa kotak. Judul `display-md` 1.25rem
dengan cakram merah 8px, garis tinta 2px di bawah judul, lead `body-sm`
muted, konten, footer dipisah garis 1px. Varian `dark` (satu widget per
halaman): latar tinta, lipatan, teks putih.

**PopularArticlesCard** ("Terpopuler"): tab Chakra (Hari ini / Minggu ini);
peringkat 1 = foto 16:9 + angka "1" Condensed 700 2.5rem merah di pojok kiri
atas foto; peringkat 2–5 = baris angka Condensed 700 1.5rem merah kolom
2rem + judul `title-sm` + meta, dipisah garis.

**PopularTags**: chip kotak sesuai 4.2.

**SocialFollowCard** ("Ikuti Seputar Otaku"): baris ikon platform 20px
tinta + nama akun Barlow 600 + platform label muted + tombol "Ikuti" outline
sm kanan; dipisah garis. Tanpa gradasi warna platform.

**GoogleNewsFollow**: tombol dark penuh lebar dengan ikon; varian inline di
artikel: baris kotak bingkai 1px.

**ContactCard**: email/WhatsApp sebagai baris label + nilai Barlow 600;
tombol outline.

**MediaPartnerCard**: grid logo 3 kolom, tiap logo kotak 1px rule, grayscale
→ berwarna saat hover.

### 4.7 Artikel (`routes/article/[id]/[slug]`, `article_detail_style`
disarankan `classic`)

**Kepala artikel**: latar `--so-paper`; breadcrumb label muted; judul
`display-xl` maks 20 kata ditampilkan penuh; deskripsi `body-lg` muted; baris
penulis: avatar cakram 32px, nama Barlow 600 + tautan, tanggal label
tabular; garis merah 3px lebar 56px di bawah baris penulis sebagai penutup
kepala. Foto hero 16:9 penuh lebar kolom dengan lipatan, caption `label-xs`
muted di bawah, rata kiri.

**Baris aksi** (`ShareButtons`, `BookmarkButton` share, Komentar): tombol
outline sm kotak 36px dengan ikon; label "Bagikan", "Simpan", "Komentar"
muncul ≥768px. Keadaan tersimpan: latar tinta ikon putih. "Tersalin":
`--so-ok`.

**Isi** `.bodyArticle`: Barlow `body-lg`, maks 68ch, warna `--so-text`.
- h2 Condensed 700 1.75rem, h3 1.5rem, h4 Barlow 600 1.125rem; margin atas
  2rem, bawah 0.75rem.
- Tautan merah, garis bawah 1.5px offset 0.15em; hover `--so-red-deep`.
- Blockquote: tanpa border-left; Condensed 600 1.5rem leading 1.3, cakram
  merah 10px di awal, padding 1rem 0, garis 1px atas-bawah.
- Figure: gambar radius 0, caption `label-xs` muted.
- Tabel: garis 1px, header label, angka tabular.
- Kode/pre: latar `--so-ground`, 1px rule.
- Paragraf pertama tidak diberi drop cap.

**Read-also** ("Baca juga"): blok di dalam isi, garis tinta 2px atas, label
"BACA JUGA" merah, judul `title-sm`, thumb 72px kanan.

**Baca selanjutnya** (`article-next`, ponsel): pita tinta penuh, label putih
50% "BERIKUTNYA", judul Condensed putih, panah.

**Komentar**: judul bagian `display-md`; form: textarea 2px, tombol primary
"Kirim"; tamu melihat kotak bingkai 1px "Masuk untuk berkomentar" dengan
tombol outline. Daftar komentar: avatar cakram 32px, nama Barlow 600, waktu
label, isi body; balasan menjorok 2.5rem dengan garis 1px kiri (1px, bukan
aksen).

**PhotoStory** (`photo_story` aktif): header tinta, galeri grid 3 kolom radius
0, viewer layar penuh tinta dengan caption label.

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
2px, ikon kiri, hasil berbaris; "tidak ada hasil" sebagai kotak bingkai 1px
dengan saran kategori.

**Pagination**: kotak 40px bingkai 1px `--so-rule`, angka Barlow 600
tabular; aktif latar tinta teks putih; hover teks merah; prev/next ikon.

**Author** (`creator-profile-*`): header putih, avatar cakram 96px dengan
cincin merah 3px, nama `display-xl`, handle label, deskripsi; statistik
sebagai baris label + angka Condensed (bukan tile metrik).

### 4.9 Event (`event/*`, `routes/event`)

**EventCard**: poster 3:4 radius 0; tab tanggal di pojok kiri atas poster:
latar merah, Chakra putih "31 OKT–1 NOV"; nama Condensed `title`; tempat dan
harga label muted dengan ikon 14px.

**EventSpotlight** (event berikutnya): panel tinta dengan lipatan, label
putih 50% "BERIKUTNYA", nama Condensed putih 2rem, countdown angka Condensed
tabular, tombol primary.

**EventScheduleSection / EventAgendaRow**: tabel garis 1px, kolom tanggal
label tabular lebar 7rem, nama event Barlow 600, lokasi muted.

**AddToCalendar**: `<details>` dengan tombol outline sm; menu panel putih
bingkai tinta 2px.

**EventPromoCard**: dihapus dari rotasi (fitur promosi ikut event_section
standard saja).

### 4.10 Pencarian & auth

**SearchPalette** (`search/SearchPalette.svelte`): overlay tinta 55%; panel
putih lebar 640px bingkai tinta 2px, lipatan, bayangan satu-satunya. Bar:
ikon lensa, input Barlow 1.25rem tanpa border, tombol tutup label "ESC"
Chakra. Grup "Jelajahi kategori" sebagai chip kotak. Hasil: baris thumb
56px + judul `title-sm` + meta label, aktif latar `--so-ground` + garis
kiri... **tidak**: aktif memakai latar `--so-red-tint`. Footer: pintasan
`label-xs`.

**AuthModal**: panel putih 440px bingkai tinta 2px + lipatan; cakram logo
48px; judul Condensed 1.75rem; tab Masuk/Daftar (4.2); field 4.2; tombol
primary penuh; "Lanjutkan dengan Google" outline dengan ikon; perks sebagai
daftar ikon 16px + `body-sm`. Google login saat ini tidak aktif di situs ini:
tombol disembunyikan.

### 4.11 Dashboard pembaca (`routes/dashboard`, `reader/*`, `dashboard/*`)

Mode Operate. Header halaman: judul `display-xl` + cakram, tab (Untuk Kamu /
Tersimpan / Riwayat / Aktivitas) sebagai tab 4.2, sticky di bawah masthead.
**ReaderItem**: baris 1px, thumb 160×107, judul `title`, alasan rekomendasi
label merah ("KARENA KAMU MENGIKUTI ANIME"). **InterestEditor**: chip kotak
44px, latar panel `--so-ground` bingkai 1px, tombol "Simpan minat" primary.
**ReadingHistory**: baris berkelompok per hari, tanggal label.
**BottomNav** (ponsel): bar putih garis tinta 2px atas, 4 ikon 24px + label
Chakra 0.625rem, aktif merah. **BookmarkButton** surface: outline; tersimpan:
tinta. **FollowTopic**: outline sm; diikuti: dark dengan centang.
Halaman akun: form 4.2.

### 4.12 Halaman statis, kontak, media partner, error

**Pages** (`/page/[id]`): judul `display-xl`, isi seperti `.bodyArticle`,
maks 68ch, daftar isi tidak ada. **Contact**: dua kolom, form 4.2 + ContactCard.
**Media partner**: header arsip + grid logo 4 kolom kotak 1px, hover
berwarna; tombol "Jadi media partner" primary. **Error 404/500**: cakram
merah 96px berisi angka Condensed putih, judul Condensed, tombol dark
"Kembali ke beranda", pencarian.

### 4.13 Curhatan (halaman masih ada, promo mati)
`CurhatCard`: kotak bingkai 1px, kutipan Condensed 1.25rem, meta label;
aksi ikon kotak. `CurhatForm`: 4.2. Tidak perlu dikerjakan sebelum halaman
ini diputuskan tetap atau dihapus.

### 4.14 Lain-lain
**Carousel** (`ui/Carousel.svelte`): kontrol kotak 40px tinta, indikator
kotak 8×8 putih 50%, aktif merah. **ShareSheet**: panel bawah putih garis
tinta 2px atas, grid ikon 4 kolom kotak. **ArticleRankItem**: 4.6.
**ChatWidget, PushPrompt, Cf23, Talent*, Anime*, Moku*, Reels, Newsletter**:
tidak aktif, tanpa tema.

---

## 5. Implementasi (rencana, belum dikerjakan)

Satu codebase, satu tema tambahan, nol perubahan pada tampilan Mokultur.

1. **Saklar tema**: `SITE_THEME` di `src/lib/server/site.ts`
   (`'mokultur' | 'seputarotaku'`, default `mokultur`). `hooks.server.ts`
   menambahkan `data-theme="seputarotaku"` pada `<html>` lewat
   `transformPageChunk`, sehingga SSR dan klien sama dan tidak ada kedip.
   `+layout.server.ts` ikut mengembalikan `site.theme` untuk komponen yang
   perlu bercabang markup (hanya Navbar strip atas dan Hero).
2. **Font**: `static/fonts/Barlow.woff2`, `BarlowCondensed.woff2`,
   `ChakraPetch.woff2` (subset Latin, `font-display: swap`), preload hanya
   saat tema aktif (di `+layout.svelte`).
3. **Stylesheet**: `src/styles/themes/_seputarotaku.scss`, di-import paling
   akhir di `app.scss`. Semua selektor diawali `html[data-theme='seputarotaku']`
   sehingga spesifisitas selalu menang atas `custom.scss` tanpa `!important`.
   Urutan isi file mengikuti bab 3–4 dokumen ini.
4. **Settings dashboard** untuk situs ini: `navbar_style=times`,
   `hero_type=top-stories`, `card_style=vertical`,
   `latest_section_style=news-list`, `article_detail_style=classic`,
   `event_section_style=standard`, `tech_section_style=immersive`,
   `navbar_bg=#ffffff`, `navbar_text=#15181c`, `primary_color=#c01c28`,
   `dark_color=#121417`.
5. **Tahapan**: (a) fondasi: token, font, tombol, label, section head,
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
- Pakai cakram merah hanya sebagai penanda kecil dan logo; satu per judul.
- Pisahkan konten dengan garis, bukan kotak.
- Letakkan kategori di baris meta, di bawah judul.
- Pakai Barlow Condensed untuk setiap judul yang lebih besar dari 1rem.
- Lipatan hanya pada bidang unggulan; thumbnail kecil tetap persegi.

**Don't**
- Jangan pill, jangan radius >2px pada kontrol, jangan bayangan pada kartu.
- Jangan gradasi gelap di atas foto hero.
- Jangan border-left aksen pada judul, kutipan, atau kartu.
- Jangan tambah warna aksen kedua; status memakai `--so-ok`/`--so-warn`
  saja.
- Jangan pakai Inter di situs ini, termasuk sebagai fallback pertama.
