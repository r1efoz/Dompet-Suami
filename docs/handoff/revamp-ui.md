# Handoff — Revamp UI

Dibuat: 2026-10-30 oleh Claude (sesi desain bersama Arief). Dikerjakan oleh: OpenCode.

## Urutan baca sebelum mulai

1. `AGENTS.md` — aturan lingkungan & larangan.
2. `docs/design-system.md` — token, komponen, logo, PWA.
3. `docs/design.md` — spesifikasi per layar + rumus + kriteria terima.
4. `docs/plans/2026-10-30-revamp-ui.md` — 11 tugas berurutan.
5. `docs/design/mockup-v4.html` — buka di browser untuk referensi visual (bukan kode untuk disalin).

## Keputusan yang sudah diambil (jangan ditanyakan ulang)

| Topik | Keputusan | Alasan |
|---|---|---|
| Palet | Hitam/kertas/oranye + hijau sage untuk pemasukan. Tanpa ungu/biru. | Permintaan pemilik: simple, eye comfort. |
| Navigasi | Bottom nav 4 tab di mobile, top nav di desktop, FAB oranye. Urutan: Home, Transaksi, Laporan, Master. | Nav lama terpotong di 375px. |
| Home hero | Total + carousel kartu per akun (gaya app banking). | Revisi pemilik atas mockup v1. |
| Sapaan | "Halo, Pak Arief" (konstanta). Form: "Catat transaksi, Pak". | Permintaan pemilik. |
| Logo | Celengan ayam jadul SVG dari mockup v4, disalin ke `public/logo.svg` dengan warna hardcoded. Versi render 3D PNG = tindak lanjut, bukan tugas ini. | Pemilik belum memilih; SVG tanpa dependency. |
| Insight | Rumus lokal (lihat design.md §2.5), tanpa LLM/API. | Vercel free, app statis. |
| "Neraca" | Diganti "Saldo akun" (awal/masuk/keluar/akhir). | Neraca lama salah secara akuntansi; app tanpa liabilitas. |
| Chart | SVG tangan (`BarChart.svelte`), tanpa library. | Tidak menambah dependency. |
| PWA | Manifest + `public/sw.js` tulisan tangan, tanpa `vite-plugin-pwa`. | Tidak menambah dependency. |
| Svelte | Tetap sintaks legacy (`export let`, `$:`, `on:click`). | Codebase ada memakai itu; campur runes = error. |
| Ikon akun/kategori | Emoji dari daftar tetap, kolom `icon text` baru. | Paling sederhana. |
| Dark mode | Otomatis ikut sistem. Tanpa toggle. | YAGNI. |
| Hapus akun/kategori | Hanya jika tidak ada transaksi yang merujuk; sekarang benar-benar menghapus di DB. | Kode lama hanya mengubah store (bug). |
| Bug bulan WIB | `monthlyTrend` diperbaiki di Tugas 4 (kunci bulan dari `getMonth`, bukan `toISOString`). | Bulan meleset satu di zona +7. |

## Yang sudah dikerjakan Claude (tidak perlu diulang)

- DB lokal dompet-suami sudah diisi salinan data hosted: 7 akun, 15 kategori, 22 transaksi. File: `supabase/seed.local.sql` (gitignored, ada di mesin pemilik). Muat ulang: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -f supabase/seed.local.sql`.
- `supabase/seed.e2e.sql` (di-commit) = seed sintetis untuk e2e; e2e memuatnya sendiri mulai Tugas 1.
- Builder check sudah dilakukan (25 temuan); semuanya sudah dijawab di dokumen. Keputusan tambahan dari situ: warna teks accent/pos digelapkan satu langkah agar ≥ 4,5:1; kartu akun tone `ink` memakai token `--acard-ink-bg` khusus di dark; `on-accent` di dark = teks gelap; CSV punya opsi "Semua transaksi (cadangan)"; `recordTransfer` mendapat parameter opsional `timestamp`; baris "Dicatat" di sheet detail dihapus; `‹` di pemilih periode hanya menggeser jendela 4 bulan.
- `.claude/launch.json` dibuat untuk dev server (port 5173).
- `.gitignore` ditambah `.superpowers/`.

## Yang tetap milik pemilik repo (OpenCode jangan lakukan)

- Menjalankan `alter table … add column icon` di Supabase **hosted**.
- Deploy ke Vercel (`direnv exec . vercel …`).
- Membuat versi render 3D PNG logo.
- Mengubah `.env`.

## Pertanyaan terbuka

(kosong — isi di sini jika menemukan yang tidak terjawab dokumen; pilih tafsir paling sederhana dan lanjutkan)

## Log

Format: `YYYY-MM-DD HH:MM — Tugas N — status — catatan singkat (perintah verifikasi + hasil)`.

- 2026-10-30 — Baseline — belum dijalankan oleh OpenCode.
