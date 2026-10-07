# Deploy Drive Uyee ke Botkeep

## Profil resource awal

| Pengaturan | Nilai awal | Catatan |
|---|---:|---|
| Runtime | Node.js, versi 22 atau yang tersedia paling dekat | `node:sqlite` perlu Node.js 22.5+ |
| Start command | `npm start` | `start.js` menaruh localstorage GramJS di `DATA_DIR` |
| RAM | **256 MB lean mode / 512 MB full preview** | Mulai dengan 256 MB + `DISABLE_SHARP=1`; naikkan ke 512 MB jika proses restart/OOM atau perlu render preview lokal |
| CPU | alokasi terendah yang disediakan | Download, kompresi, dan sync akan berjalan satu worker |
| Storage server | **1 GB** | Berisi source/dependencies, session Telegram, metadata SQLite dan berkas sementara upload |
| Cache preview | maksimum **32 MiB**, TTL **30 menit** | `/tmp`, bukan data permanen; dibuat lagi dari Telegram jika diperlukan |
| Auto-thumbnail fallback | maksimum file asli **4 MiB** | Thumbnail bawaan Telegram tetap dipakai tanpa mengunduh file asli |

Free Botkeep menyediakan total akun 1 GB RAM, 1 vCore dan 1 GB storage. Untuk workload Drive Uyee, seluruh 1 GB storage lebih aman dialokasikan ke satu server. Profil paling kecil memakai 256 MB + `DISABLE_SHARP=1`, satu worker transfer, dan cache kecil; pantau restart/OOM setelah sync dan preview. Jika tidak stabil, ubah alokasi ke 512 MB. `DISABLE_SHARP=1` meniadakan pembuatan preview lokal HEIC/video/PDF; thumbnail Telegram tetap dipakai dan file asli tetap bisa dibuka.

## Perilaku data

- `data/config.json`: konfigurasi serta Telegram session string; persisten dan sensitif.
- `data/gramjs-localstorage.json`: cache entity/DC GramJS yang bisa dibangun ulang, tetapi tetap diletakkan di data persisten agar tidak hilang pada restart.
- `data/metadata.db`: indeks kecil file, message ID Telegram, dan activity log; log dipangkas menjadi 250 baris. SQLite WAL di-checkpoint setiap 128 halaman dan dibatasi sekitar 1 MiB.
- `/tmp/drive-ephemeral`: file asli yang sedang dipreview, hasil merge, WebP, thumbnail, dan staging upload. Cache gabungan dibatasi 32 MiB / 30 menit dan boleh diunduh ulang dari Telegram. Cache dibersihkan saat start dan setiap 15 menit.
- Satu unggahan dibatasi 128 MiB agar staging tidak memenuhi storage kecil; naikkan `MAX_UPLOAD_BYTES` hanya jika alokasi storage mencukupi.
- File asli tetap berada di chat/grup Telegram. Menghapus cache hanya menghapus salinan sementara, bukan media Telegram maupun metadata indeks.
- SQLite bukan cache foto: tabelnya adalah katalog file dan diperlukan agar daftar langsung muncul tanpa memindai seluruh riwayat Telegram pada setiap buka. Simpan DB kecil ini persisten; hanya preview/original sementara yang punya TTL.

Preview/stream file besar tetap perlu ruang sementara selama file sedang dipakai. Batas cache hanya berlaku setelah request selesai; jangan mengharapkan file multi-gigabyte dapat dipreview jika temporary disk Botkeep tidak cukup.

## Variabel Environment Botkeep

Atur lewat tab **Environment**. Jangan simpan rahasia di GitHub atau ZIP.

| Variable | Nilai |
|---|---|
| `NODE_ENV` | `production` |
| `DATA_DIR` | `./data` |
| `EPHEMERAL_CACHE` | `1` |
| `DISABLE_SHARP` | `1` untuk RAM 256 MB; `0` untuk kompresi/render lokal |
| `CACHE_MAX_BYTES` | `33554432` |
| `CACHE_MAX_AGE_MS` | `1800000` |
| `THUMB_AUTO_BYTES` | `4194304` |
| `PREVIEW_COMPRESS_MAX_BYTES` | `4194304` |
| `FFMPEG_MAX_BYTES` | `4194304` |
| `THUMB_CONCURRENCY` | `1` |
| `TRANSFER_WORKERS` | `1` |
| `SYNC_BATCH` | `25` |
| `MAX_UPLOAD_BYTES` | `134217728` (128 MiB) |
| `DRIVE_PASSWORD` | password panjang unik untuk membuka drive |
| `DRIVE_SECRET` | string acak minimal 32 byte, stabil antar-restart |


## Deploy dari ZIP

Dokumentasi publik Botkeep menyediakan deployment Node.js dari ZIP atau GitHub. Untuk ZIP, project root harus langsung berisi `package.json`.

1. Buat ZIP dari isi folder project, bukan folder induk.
2. Sertakan `package.json`, `package-lock.json`, `start.js`, `server.js`, `auth.js`, `database.js`, `data-dir.js`, `cache-policy.js`, `sync-media.js`, `tempmail.js`, dan `public/`. Folder `test/` boleh tidak disertakan untuk runtime.
3. Jangan sertakan `.env`, `data/`, `node_modules/`, `.git/`, `temp/`, `uploads/`, `cache/`, `thumbs/`, log, atau file sesi. `.dockerignore` bukan filter upload ZIP; pilih file yang masuk dengan sengaja.
4. Di Botkeep pilih **Node.js**, upload ZIP, start command `npm start`, lalu atur environment variables di atas.
5. Alokasikan resource sesuai form, deploy, lalu cek Console dan `https://<domain>/health`.
6. Buka domain, buat password login, lalu jalankan wizard Telegram untuk memasukkan API ID/hash, OTP, 2FA bila aktif, serta chat ID storage.
7. Jalankan sync satu kali. Pastikan daftar file muncul dan `/health` menunjukkan `telegramAuth: "ok"` sebelum mengandalkan deployment.

ZIP Node.js tidak membawa paket OS seperti FFmpeg, Poppler, atau `heif-convert`. Preview gambar biasa dan Telegram thumbnail tetap berjalan; thumbnail video/PDF/HEIC yang perlu binary eksternal bisa tidak tersedia di runtime Botkeep.

Botkeep API docs publik saat ini belum menerangkan endpoint create/deploy workload, jadi alur yang terdokumentasi adalah panel Botkeep.

## Cek lokal sebelum ZIP

```powershell
npm test
npm start
```

Untuk project saat ini, test cache baru memakai temporary directory lokal dan tidak mengubah `data/` produksi.
