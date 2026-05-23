# Deploy Guide — mokultur-web (SvelteKit + Node.js)

## Prasyarat

- Node.js >= 20 LTS
- npm >= 10
- PM2 (`npm install -g pm2`)
- mokultur-elysia sudah berjalan (lihat `DEPLOY.md` di repo tersebut)
- Nginx dengan SSL

---

## 1. Clone & Install

```bash
git clone <repo-url> mokultur-web
cd mokultur-web
npm install
```

---

## 2. Konfigurasi Environment

```bash
cp .env.example .env
nano .env
```

### Nilai untuk production:

```env
PUBLIC_API_URL=https://api.mokultur.id   # URL backend Elysia
PUBLIC_SITE_URL=https://mokultur.id      # URL frontend ini sendiri
```

> `PUBLIC_API_URL` harus bisa diakses dari server (SSR) dan dari browser (client-side fetch).  
> Jika Elysia di server yang sama, bisa pakai `http://127.0.0.1:3001` untuk komunikasi internal.

---

## 3. Build

```bash
npm run build
```

Output berada di folder `build/`. Tidak perlu dijalankan ulang kecuali ada perubahan kode.

---

## 4. Jalankan di Production

### Opsi A: PM2 Cluster (direkomendasikan — memanfaatkan 2 CPU)

File `ecosystem.config.cjs` sudah tersedia di root repo:

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup                              # generate perintah untuk auto-start saat reboot
```

Jalankan perintah yang dihasilkan `pm2 startup` sebagai root.

Cek status:

```bash
pm2 list
pm2 logs mokultur-web
```

### Opsi B: systemd

Buat file service:

```bash
sudo nano /etc/systemd/system/mokultur-web.service
```

```ini
[Unit]
Description=Mokultur Web (SvelteKit)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mokultur-web
ExecStart=/usr/bin/node build/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mokultur-web
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=ORIGIN=https://mokultur.id
Environment=PUBLIC_API_URL=https://api.mokultur.id
Environment=PUBLIC_SITE_URL=https://mokultur.id

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable mokultur-web
sudo systemctl start mokultur-web
```

> Opsi systemd hanya menjalankan 1 instance. Gunakan PM2 cluster untuk memanfaatkan 2 CPU.

---

## 5. Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mokultur-web
```

```nginx
server {
    listen 80;
    server_name mokultur.id www.mokultur.id;
    return 301 https://mokultur.id$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mokultur.id www.mokultur.id;

    ssl_certificate     /etc/letsencrypt/live/mokultur.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mokultur.id/privkey.pem;

    # Kompresi response HTML/CSS/JS
    gzip on;
    gzip_types text/html text/css application/javascript application/json;
    gzip_min_length 1024;
    gzip_vary on;

    # Cache aset statis (JS/CSS hasil build — nama file sudah hashed)
    location /_app/immutable/ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        add_header         Cache-Control "public, max-age=31536000, immutable";
    }

    # File statis di /static (gambar, robots.txt, sitemap, dll)
    location ~* \.(ico|png|jpg|webp|svg|woff2|txt|xml)$ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        add_header         Cache-Control "public, max-age=86400";
    }

    # Semua request lainnya ke SvelteKit SSR
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Connection        "";         # keep-alive ke upstream
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;

        # Cache halaman SSR berdasarkan Cache-Control dari SvelteKit
        proxy_cache        sveltekit_cache;
        proxy_cache_valid  200 60s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
        add_header         X-Cache-Status $upstream_cache_status;
    }
}
```

Aktifkan Nginx cache zone di `/etc/nginx/nginx.conf` (dalam blok `http {}`):

```nginx
proxy_cache_path /var/cache/nginx/sveltekit
    levels=1:2
    keys_zone=sveltekit_cache:10m
    max_size=500m
    inactive=10m
    use_temp_path=off;
```

```bash
sudo mkdir -p /var/cache/nginx/sveltekit
sudo chown www-data:www-data /var/cache/nginx/sveltekit

sudo ln -s /etc/nginx/sites-available/mokultur-web /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

SSL:

```bash
sudo certbot --nginx -d mokultur.id -d www.mokultur.id
```

---

## 6. Verifikasi

```bash
# Cek SvelteKit berjalan
pm2 list

# Cek response + cache headers
curl -I https://mokultur.id/
# Harus ada: cache-control: public, max-age=60, stale-while-revalidate=300

curl -I https://mokultur.id/article/1/slug
# Harus ada: cache-control: public, max-age=120, stale-while-revalidate=600

# Cek apakah Nginx cache aktif
curl -I https://mokultur.id/ | grep X-Cache-Status
# Pertama: MISS, request kedua: HIT

# Lihat log
pm2 logs mokultur-web --lines 50
```

---

## 7. Update / Redeploy

```bash
cd /var/www/mokultur-web
git pull origin main
npm install                              # jika ada perubahan dependencies
npm run build
pm2 reload mokultur-web                  # zero-downtime reload cluster
```

> `pm2 reload` mengganti proses satu per satu (graceful), berbeda dengan `pm2 restart` yang langsung mati.

---

## 8. Konfigurasi PM2 — ecosystem.config.cjs

```js
// ecosystem.config.cjs (sudah ada di repo)
module.exports = {
  apps: [{
    name: 'mokultur-web',
    script: 'build/index.js',
    instances: 2,          // 1 per CPU core
    exec_mode: 'cluster',
    max_memory_restart: '1200M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      ORIGIN: 'https://mokultur.id',
    },
  }],
};
```

Variabel di `env_production` di-inject saat `pm2 start ... --env production`.  
`PUBLIC_API_URL` dan `PUBLIC_SITE_URL` dibaca dari file `.env` di root folder (bukan dari PM2).

---

## 9. Environment Variables — Referensi

| Variable | Wajib | Keterangan |
|---|---|---|
| `PUBLIC_API_URL` | ✓ | URL backend Elysia, diakses server & browser |
| `PUBLIC_SITE_URL` | ✓ | URL frontend ini, dipakai untuk canonical/OG |
| `NODE_ENV` | ✓ | Set ke `production` (via PM2 env atau systemd) |
| `PORT` | — | Port Node.js server, default `3000` |
| `ORIGIN` | ✓ | Domain lengkap dengan https, wajib untuk CSRF protection SvelteKit |

---

## 10. Catatan Penting

- **`ORIGIN`** wajib di-set di production. SvelteKit menggunakannya untuk validasi CSRF pada form actions.
- **Layout cache** (settings, navbar, categories) di-cache per-process selama 5 menit. Dengan 2 cluster instances, masing-masing punya cache sendiri — ini normal.
- **`PUBLIC_API_URL`** di-embed ke dalam bundle JavaScript saat `npm run build`. Jika URL API berubah, perlu build ulang.
- Setelah mengubah `.env`, perlu `npm run build` ulang (bukan hanya `pm2 reload`) karena variabel `PUBLIC_*` di-inline saat build.
