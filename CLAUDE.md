# mokultur-web — Claude Setup Guide

## Peran dalam Ekosistem

**mokultur-web** adalah frontend publik (`mokultur.com`) yang dibangun dengan SvelteKit. Semua data diambil dari **mokultur-elysia** (`api.mokultur.com`). Tidak punya database sendiri.

```
Ekosistem Mokultur:
┌─────────────────────────────────────────────────────┐
│  mokultur-web (SvelteKit)  → port 5173 (dev)        │ mokultur.com
│  aboutmokultur (Next.js)   → port 3002 (dev)        │ about.mokultur.com
│       ↓ kedua app memanggil API ini                  │
│  mokultur-elysia (Elysia)  → port 3001              │ api.mokultur.com
│       ↓ baca/tulis DB yang sama                      │
│  mokultur (Laravel)        → via Docker              │ admin.mokultur.com
│       ↓ shared database                              │
│  MySQL                     → port 3306               │
└─────────────────────────────────────────────────────┘
```

## Quick Start (Dev)

**Prasyarat:** mokultur-elysia harus berjalan di port 3001.

```bash
npm install
cp .env.example .env   # PUBLIC_API_URL=http://localhost:3001
npm run dev            # http://localhost:5173
```

## Environment Variables

```env
PUBLIC_API_URL=http://localhost:3001    # URL mokultur-elysia
PUBLIC_SITE_URL=http://localhost:5173   # URL site ini sendiri
```

> `PUBLIC_API_URL` di-embed ke dalam JS bundle saat build. Jika URL berubah, perlu `npm run build` ulang.

## Struktur Routes

```
src/routes/
├── +layout.svelte          # Navbar, Footer, CSS vars dari site settings
├── +layout.server.ts       # Load settings, categories, navbar, socials (cache 5 menit)
├── +page.svelte/server.ts  # Homepage
├── article/[id]/[slug]/    # Detail artikel
├── category/[slug]/        # Artikel per kategori
├── tag/[slug]/             # Artikel per tag
├── index-article/          # Listing semua artikel + search
├── curhat-[id]/[slug]/     # Detail curhatan
├── curhatan/               # Index curhatan
├── @[username]/            # Profil penulis (/@username)
├── contact/                # Halaman kontak
├── media-partner/          # Media partners
├── page/[id]/[slug]/       # Halaman statis (privacy, terms, dsb)
└── sitemap.xml/            # Sitemap passthrough
```

## Koneksi ke API

File utama: `src/lib/api.ts`

Semua request ke `PUBLIC_API_URL` (mokultur-elysia). Endpoint yang dipakai:
- `GET /api/articles` — list artikel
- `GET /api/articles/:id/:slug` — detail artikel
- `GET /api/settings` — site settings (warna, logo, nama)
- `GET /api/categories` — daftar kategori
- `GET /api/navbar?type=header|footer` — menu navigasi
- `GET /api/social-media` — sosial media
- `GET /api/curhatan` — list curhatan
- `POST /api/curhatan/public/submit` — submit curhatan (rate-limited)
- `GET /api/ads?slot=...` — iklan per slot

## Catatan Penting

- **Site settings** (warna, logo, font) di-load di `+layout.server.ts` dan di-inject sebagai CSS vars di `+layout.svelte`. Diubah dari Laravel admin → tersimpan di DB → otomatis terbaca next request.
- **Layout cache** in-process: 5 menit per SSR instance.
- Tidak ada auth user di sisi ini — login/register ada di Laravel admin (`admin.mokultur.com`).
- **Curhatan** bisa di-submit tanpa login via `POST /api/curhatan/public/submit`.
