# Drive Uyee — Design System

Dokumen ini adalah kontrak visual untuk Drive Uyee. Tujuannya bukan membuat antarmuka yang ramai, tetapi membuat antarmuka yang **cepat dibaca, cepat dipakai, dan tidak pernah menghalangi berkas**.

## 1. Prinsip

1. **Berkas adalah konten utama.** Chrome antarmuka tunduk pada grid, bukan sebaliknya.
2. **Kecepatan terasa sebelum terlihat.** Skeleton, thumbnail 400px, dan transisi pendek lebih penting daripada ilustrasi.
3. **Satu aksi per kontrol.** Tombol melakukan satu hal. Tidak ada menu bersarang di toolbar utama.
4. **Tenang.** Satu aksen, satu hierarki, satu ritme. Tidak ada dekorasi yang berdiri sendiri.
5. **Mobile adalah baseline.** Desain untuk 360px dulu; desktop hanya menambah kolom.

## 2. Warna

Semua warna didefinisikan sebagai tripel `R G B` di `src/styles/tokens.css` supaya bisa dipakai sebagai `rgb(var(--c-x))` dan `rgb(var(--c-x) / alpha)`.

| Token | Terang | Gelap | Pakai untuk |
| --- | --- | --- | --- |
| `--c-bg` | `250 250 250` | `17 17 17` | Latar halaman |
| `--c-surface` | `255 255 255` | `28 28 30` | Kartu, panel, modal |
| `--c-subtle` | `245 245 245` | `38 38 41` | Input, well, hover |
| `--c-border` | `229 231 235` | `58 58 62` | Garis kartu |
| `--c-text` | `23 23 23` | `244 244 245` | Judul, nama berkas |
| `--c-text-muted` | `115 115 115` | `163 163 166` | Meta, caption |
| `--c-accent` | biru jenuh | biru jenuh | Fokus, aktif, aksi utama |
| `--c-success` | `34 197 94` | sama | Sync sukses |
| `--c-danger` | `239 68 68` | sama | Hapus, error |

Aturan: teks di atas `--c-surface` minimal kontras 4,5:1. Jangan pakai warna semantik untuk dekorasi. Status hanya lewat warna + ikon + teks, bukan warna saja.

## 3. Tipografi

Font utama: `"Inter", "DM Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Jangan memuat font dari CDN — sistem fallback sudah cukup dan menghilangkan render-blocking request.

| Peran | Ukuran | Berat | Letter spacing |
| --- | --- | --- | --- |
| Halaman / wizard | 24px | 600 | `-0.02em` |
| Judul panel | 16px | 600 | normal |
| Nama berkas | 13px | 600 | normal |
| Meta | 11px | 500 | `0.01em` |
| Kode / angka | 11–12px | 500 | `ui-monospace` |

Bahasa: Indonesia, huruf kecil untuk bicara, huruf besar hanya untuk deliverable dan label proper. Maksimal dua baris nama berkas sebelum truncate dengan ellipsis.

## 4. Spacing & ritme

Grid 4px. Skala: `4, 8, 12, 16, 24, 32`.

- Kartu grid: padding 12px, gap 8–12px.
- Toolbar: padding 10px 14px, gap 8px, tinggi target 40px.
- Modal: padding 24–32px, radius 16px.
- Jarak antar grup di panel: 24px.

Jangan menambah padding untuk "biar lega" tanpa mengubah hierarchy. Gunakan warna latar dan garis.

## 5. Layout responsif

| Lebar | Kolom grid |
| --- | --- |
| < 360px | 2 |
| 360–429px | 2 |
| 430–639px | 3 |
| 640–767px | 3 |
| 768–1023px | 4 |
| 1024–1279px | 5 |
| ≥ 1280px | 6 |

Aturan mobile:

- Toolbar melekat di atas (sticky), bukan ikut scroll.
- Target sentuh minimal 44 × 44px, termasuk checkbox.
- Area aman: `env(safe-area-inset-bottom)` pada bulk bar dan lightbox.
- Tidak ada overflow horizontal. Nama panjang dipotong, bukan mendorong kartu.
- Grid dirender 48 kartu pertama, sisanya di-append saat scroll.
- Lightbox: swipe kiri/kanan berpindah foto hanya saat zoom = 1.

## 6. Komponen

### Kartu berkas
Bentuk persegi dengan thumbnail 1:1, nama 1 baris, meta ukuran + tanggal. Hover mengangkat 2px dan bayangan tipis. Thumbnail gagal → ikon tipe + ekstensi, bukan kotak kosong.

### Thumbnail
WebP 400px, `object-fit: cover`, skeleton shimmer saat memuat, fade 0,22s saat selesai. `loading="lazy"`, `decoding="async"`, `fetchpriority="low"`.

### Lightbox
Tiga tingkat: thumb blur → medium WebP 1600px → original penuh setelah 2,5 detik idle atau tombol "Muat versi penuh". Perpindahan memakai focus-pull 0,28s, bukan cut.

### Toolbar
Pencarian mengambil sisa ruang. Sort, ukuran, dan filter ekstensi bersampingan. Di layar sempit, filter ekstensi disembunyikan di balik tombol "Filter" — jangan memaksa empat kontrol dalam satu baris 360px.

### Status
Toast muncul 3,5 detik, error 6 detik. Satu toast aktif. Loader memakai lima bar, bukan spinner melingkar baru.

## 7. Motion

| Keadaan | Durasi | Easing |
| --- | --- | --- |
| Hover kartu / tombol | 150–200ms | `cubic-bezier(.2,.7,.2,1)` |
| Fade skeleton | 220–250ms | `ease` |
| Focus-pull gambar | 280ms | `cubic-bezier(.2,.7,.2,1)` |
| Masuk modal | 220ms | `cubic-bezier(.22,1,.36,1)` |
| Pull-to-refresh / sync | 800ms sekali | `ease-in-out` |

Gunakan `transform` dan `opacity`. Jangan animasi `width`, `height`, `top`, atau `box-shadow` berulang. Semua animasi harus mati di `@media (prefers-reduced-motion: reduce)`.

## 8. Aksesibilitas

- Setiap ikon-only button punya `aria-label`.
- Focus ring terlihat: 2px accent + offset 2px.
- Kontras teks ≥ 4,5:1, teks besar ≥ 3:1.
- Informasistatus tidak hanya berwarna.
- Urutan tab mengikuti urutan visual.
- `Escape` menutup modal/lightbox; `←`/`→` berpindah foto.

## 9. Anti-pattern

Dilarang:

- Gradient pada headline, teks two-tone, atau accent indigo default.
- Bayangan besar mengambang, border pelangi, badge di atas hero.
- Emoji sebagai ikon. Pakai SVG stroke 1.5–2px.
- Dot-chart palsu, gauge dekoratif, grafik tanpa data.
- Eyebrow kicker di atas judul.
- Card dengan tiga warna latar berbeda dalam satu baris.
- Menyalin pola dashboard generik: sidebar + kartu statistik + grafik.
- Font CDN, animasi > 400ms untuk interaksi, atau skeleton tanpa akhir yang jelas.

## 10. Checklist sebelum ship

- [ ] Buka di 360px tanpa scroll horizontal.
- [ ] Semua target sentuh ≥ 44px.
- [ ] Thumbnail tampil atau fallback ikon tampil — tidak ada kotak kosong.
- [ ] Hard reload tidak mengirim ulang request thumbnail (immutable + service worker).
- [ ] `prefers-reduced-motion` dinonaktifkan dan masih bisa dipakai.
- [ ] Kontras lulus, focus ring terlihat.
- [ ] Tidak ada string kosakata basa-basi di UI.
