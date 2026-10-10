# Mokultur

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pembaca Indonesia yang mengikuti anime, manga, game, film, musik, teknologi, cosplay, Jepang, dan event. Mereka membaca lewat ponsel maupun desktop dan dapat mengakses bookmark melalui akun yang sama.

## Product Purpose

Menyediakan berita dan ulasan budaya pop, serta membantu pembaca menemukan dan menyimpan artikel favorit.

## Capabilities and Constraints

Frontend SvelteKit menggunakan API Elysia dan database MySQL/MariaDB bersama. Personalisasi membutuhkan login untuk penyimpanan dan sinkronisasi; pengunjung tetap dapat membaca tanpa akun. Bookmark bersifat umum: simpan, hapus, dan lihat kembali artikel favorit. Tidak ada reading list, status bacaan, progres, atau aksi selesai. Riwayat bacaan hanya membantu peringkat feed. Feed memprioritaskan minat dengan sekitar 20% eksplorasi.

## Brand Commitments

Pertahankan identitas Mokultur, logo dari pengaturan dashboard, bahasa Indonesia, tampilan editorial, dan pengalaman membaca yang sederhana serta mobile-first.

## Evidence on Hand

Artikel, kategori, tag, foto, dan akun yang sudah tersedia melalui API adalah sumber konten. Gunakan aset dan token yang telah ada.

## Product Principles

- Isi artikel dan judul mendapat prioritas.
- Pembaca menentukan minat dan artikel yang ingin disimpan.
- Kontrol personalisasi tidak menginterupsi kegiatan membaca.
- Data pribadi tersimpan per akun dan tidak masuk cache publik.
