---
version: "aether-adapted-v1"
name: "Drive Uyee — Aether Frontier"
description: "Adaptasi Aether - The New Frontier untuk antarmuka Drive Uyee. Dark editorial, satu aksen putih, label mono, radius 8px, dan ritme bento yang tetap ringan di ponsel."
source: "Aether - The New Frontier — Sourasith Phomhome (@madebysourasith)"
colors:
  primary: "#FFFFFF"
  secondary: "#111111"
  accent: "#FFFFFF"
  background: "#050505"
  surface: "#111111"
  inverted: "#F4F4F4"
  text-primary: "#FFFFFF"
  text-secondary: "#A1A1AA"
  border: "#27272A"
typography:
  display:
    fontFamily: "Inter"
    fontSize: "64px"
    fontWeight: 500
    lineHeight: "1.04"
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  label:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.08em"
    textTransform: "uppercase"
spacing:
  base: "8px"
  gap: "16px"
  card-padding: "24px"
  section-padding: "80px"
rounded:
  card: "8px"
  control: "8px"
  pill: "9999px"
---

# Drive Uyee — Aether Frontier

Adaptasi dari **Aether — The New Frontier** untuk drive berbasis Telegram. Referensi aslinya memakai `#050505` sebagai ground, `#FFFFFF` sebagai satu-satunya aksen, `#F4F4F4` sebagai permukaan invers, label monospace, dan radius 8px. Drive Uyee meminjam bahasa itu tanpa mengubah cara kerja aplikasi.

## Prinsip

1. **Dark adalah default.** `#050505` bukan sekadar opsi tema; itu kondisi awal aplikasi. Tema terang adalah companion dengan geometri yang sama, bukan desain kedua.
2. **Satu aksen: putih.** Tombol utama putih dengan teks `#111111`. Biru, hijau, dan merah hanya untuk status, bukan dekorasi.
3. **Label mono, copy Inter.** Metadata teknis (`01-A. // STORAGE`, ukuran, tanggal, ekstensi) pakai JetBrains Mono 12px 600 uppercase. Kalimat pakai Inter.
4. **Radius 8px, tanpa pengecualian.** Kartu, input, tombol, dan modal memakai radius yang sama. Pill hanya untuk status.
5. **Ritme bento, bukan dashboard generik.** Blok boleh berbeda ukuran, tetapi tidak boleh berubah menjadi sidebar + kartu statistik + grafik.

## Warna

| Token | Dark (default) | Companion terang | Peran |
| --- | --- | --- | --- |
| `bg` | `#050505` | `#F4F4F4` | Latar halaman |
| `surface` | `#111111` | `#FFFFFF` | Kartu, panel, input |
| `subtle` | `#1A1A1D` | `#ECECEC` | Hover, well |
| `border` | `#27272A` | `#D4D4D8` | Garis 1px |
| `text` | `#FFFFFF` | `#111111` | Nama berkas, judul |
| `text-muted` | `#A1A1AA` | `#52525B` | Meta, caption |
| `accent` | `#FFFFFF` | `#111111` | Aksi utama, fokus |
| `on-accent` | `#111111` | `#FFFFFF` | Teks di atas aksi |
| `inverse` | `#F4F4F4` | `#111111` | Blok sorotan |

Aturan: teks di atas `surface` minimal 4,5:1. Jangan menaruh teks putih di atas `inverse`. Status tetap warna + ikon + teks.

## Tipografi

- **Display** — Inter 64px / 500 / 1.04 / `-0.03em`. Dipakai untuk moment judul, bukan untuk nama berkas.
- **Body** — Inter 16px / 400 / 1.6.
- **Label** — JetBrains Mono 12px / 600 / `0.08em` uppercase.
- **Nama berkas** — Inter 13px / 600, satu baris, ellipsis.
- **Meta** — JetBrains Mono 11px / 500, warna `text-muted`.

Font tidak dimuat dari CDN. Fallback sistem dipakai bila Inter/JetBrains Mono tidak terpasang.

## Spasi & radius

Grid 8px. Gap 16px. Padding kartu 24px. Padding seksi 80px di desktop, 40px di ponsel. Radius `8px` untuk kartu dan kontrol, `9999px` untuk pill status.

Bayangan dibuat tipis dan gelap, tidak mengambang. Di dark mode cukup `0 2px 8px -2px rgb(0 0 0 / .6)`. Jangan menumpuk tiga layer shadow.

## Layout

Grid berkas tetap 2 kolom di ponsel sampai 6 di desktop. Yang berubah dari referensi adalah kepadatan: kartuDrive disusun rapat agar thumbnail lebih banyak terlihat, sekarang dengan border `#27272A` dan sudut 8px.

Toolbar melekat, filter menyatu, target sentuh minimal 44px. Di layar sempit, filter ekstensi masuk tombol "Filter". Lightbox memakai latar `#050505` dengan control putih.

## Komponen

**Kartu berkas** — surface `#111111`, border 1px `#27272A`, radius 8px, thumbnail 1:1 `object-fit: cover`. Hover mengangkat 2px. Thumbnail gagal → ikon SVG + ekstensi mono, bukan kotak kosong.

**Tombol** — primer: latar putih, teks `#111111`, radius 8px. Sekunder: transparan, border `#27272A`, teks putih. Ikon-only tetap punya `aria-label`.

**Label teknis** — `01-A. // STORAGE`, `EST. 2025`, ukuran berkas, dan indeks lightbox memakai mono uppercase. Label adalah metadata, bukan kicker di atas judul.

**Badge status** — pill 9999px, latar `accent-soft`, teks `text-muted`, satu ikon kecil. Warna status hanya ditambahkan bila ada perubahan nyata.

**Lightbox** — tiga tingkat seperti sebelumnya: thumb blur → medium WebP → original. Perpindahan memakai focus-pull 280ms. Latar stage `#050505`, nav button white-on-black.

## Motion

- Entrance: masked reveal + stagger 40ms per kartu, durasi 420ms, `cubic-bezier(.22,1,.36,1)`.
- Hover kartu/tombol: 180ms, `cubic-bezier(.2,.7,.2,1)`.
- Focus-pull gambar: 280ms.
- Perpindahan tema: 420ms, hanya properti warna.
- Semua animasi mati di `prefers-reduced-motion: reduce`.

Jangan animasi `width`, `height`, atau `top`. Jangan menambah partikel atau WebGL — referensi boleh atmosferik, drive tidak boleh mengorbankan kecepatan.

## Guardrails

- Jangan meratakan ini menjadi card grid generik; pertahankan perbedaan skala tiap blok.
- Jangan mengganti mode warna default; dark adalah identitas.
- Jangan memakai biru sebagai aksen utama.
- Jangan menambah eyebrow kicker di atas headline.
- Jangan memakai emoji sebagai ikon.
- Jangan menambah grafik tanpa data.
- Pertahankan huruf kecil untuk bicara; huruf besar hanya untuk deliverable dan label teknis.

## Checklist

- [ ] Default load terlihat `#050505` dengan teks putih.
- [ ] Tombol utama putih, teks gelap, radius 8px.
- [ ] Label metadata mono 12px uppercase.
- [ ] Kartu punya border `#27272A`, bukan bayangan tebal.
- [ ] Grid 2 kolom di 360px tanpa overflow.
- [ ] Thumbnail atau fallback ikon selalu tampil.
- [ ] Entrance stagger tidak menghalangi interaksi pertama.
- [ ] `prefers-reduced-motion` dinonaktifkan.
