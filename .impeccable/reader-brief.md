# Personalisasi pembaca

## Tujuan dan arah

Pembaca Mokultur menyimpan artikel untuk dibaca kembali, menemukan berita budaya pop berdasarkan minat. Halaman Artikel Tersimpan dan Untuk Kamu memakai mode Operate; detail artikel memakai mode Read. Perluas identitas editorial yang telah ada, tanpa mengganti sistem visual situs. Implementasi langsung memakai kode dan konten API yang sebenarnya; tidak ada comp atau aset baru.

## Struktur dan interaksi

Untuk Kamu hadir sebagai bagian beranda tepat sebelum home-anime-row, tidak di navbar. Preview memakai SectionHead dan ArticleCard dengan card_style dari dashboard. Halaman personal memakai container-xl dan archive-hero milik indeks artikel, dengan navigasi dua halaman dan daftar thumbnail 4:3. Semua tombol memakai theme-btn berbentuk pill; kategori memakai badge-main, warna berasal dari dashboard. Minat disunting inline memakai checkbox. Bookmark adalah koleksi umum: Simpan di baris berbagi detail artikel, hapus lewat Artikel Tersimpan, dan buka kembali artikel. Tidak ada reading list, status, progres, resume, atau aksi selesai. Untuk Kamu memakai feed 80% minat dan 20% eksplorasi; bagian beranda dan halaman feed tidak memuat tombol simpan.

## Kualitas yang harus dijaga

Judul dan isi mendominasi, bukan dekorasi. Pertahankan Inter, warna dari dashboard, ikon Bootstrap, latar putih, dan ukuran baca situs yang sudah ada. Pada mobile, daftar satu kolom memakai thumbnail ringkas; aksi membungkus ke baris baru tanpa overflow. Kontrol minimal 44 px, kontras AA, fokus terlihat, keyboard dapat dipakai, loading dan kegagalan dijelaskan. Tidak ada popup, auto-complete, atau toolbar mengambang baru.

## Perilaku dan bukti

Bookmark dan minat membutuhkan sesi akun. Tamu tetap membaca feed terbaru dan masuk saat menyimpan. Riwayat untuk peringkat feed dicatat diam-diam setelah isi terlihat minimal 10 detik, tanpa menandai artikel di UI. Koleksi mengecualikan artikel yang ditarik dan data pribadi tidak masuk cache publik. Verifikasi browser memakai akun sementara yang dihapus setelah tes.

## Verifikasi visual

Screenshot desktop 1440×1000 dan mobile 390×844 berada di `.impeccable/review/`. Feed, simpanan, editor minat, dan detail artikel harus ditinjau bersama. Pemeriksa mekanis Impeccable atas komponen/halaman baru dan SCSS mengembalikan nol temuan.

## Hasil akhir

Implementasi mengikuti tema incumbent. Untuk Kamu berada sebelum home-anime-row dan tidak menjadi item navbar. Preview dan feed tidak mempunyai tombol simpan artikel; Simpan minat tetap ada di editor minat. Bookmark umum tersedia di detail artikel dan dapat dihapus dari Artikel Tersimpan, tanpa status bacaan, reading list, resume, progres, atau aksi selesai.

Reviewer Impeccable meninjau sebelas screenshot terbaru yang valid, mencakup desktop/mobile, beranda, feed, simpanan, editor minat, dan detail artikel. Disposisi akhir: ship; kelima bagian penilaian tidak memerlukan perbaikan material. Kontras navigasi arsip dan target tombol beranda minimal 44px telah diselesaikan. `debug.png` bukan bukti review akhir. Sistem visual yang benar-benar dibangun dicatat di `DESIGN.md` dan `.impeccable/design.json`.
