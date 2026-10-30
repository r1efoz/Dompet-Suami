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

- Tugas 1 e2e tampaknya perlu lokal Postgres aktif karena seed dijalankan via `psql` pada awal `scripts/e2e.mjs`; memakai DB lokal port 55322, sesuai aturan project. **Dijawab (Claude):** ya, Postgres lokal wajib aktif.
- Tugas 3 loading gagal/skeleton belum diimplementasikan: rencana mengizinkan `store.ts` untuk `loading` dan perlindungan seeding/error, namun “Jangan sentuh: views, store” berkonflik; dipatuhi larangan eksplisit, perlu keputusan pemilik sebelum melanjutkan bagian ini.
- Tugas 4 helper `topCategories`: bila jumlah gabungan sisanya mengandung tanpa kategori, gunakan `id: null`, nama `Tanpa kategori`, dan ikon default `🧾` sesuai §2.7; persentase tiap kategori dibulatkan ke bilangan terdekat.
- Tugas 5: ketika semua akun bersaldo 0 dan tak punya transaksi bulan ini, rail menampilkan semua akun (termasuk kartu "Tambah"); ini tafsir langsung dari §2.3 "Jika semua akun kosong → tampilkan semua akun", supaya rail tidak kosong.

## Log

Format: `YYYY-MM-DD HH:MM — Tugas N — status — catatan singkat (perintah verifikasi + hasil)`.

- 2026-10-30 — Baseline — `npm run check`: `ledger self-check: 10 assertions passed`; `npm run build`: berhasil.
- 2026-10-30 — Baseline e2e — `npm run test:ui`: merah, 5 check gagal (saldo bank/tunai dan mobile/tablet/dark data tampil); sesuai ekspektasi Tugas 1.
- 2026-10-30 — Tugas 1 — selesai — check 5 file dan build berhasil; e2e deterministik hijau, 13 check lulus.
- 2026-10-30 14:20 — Intervensi Claude — ditemukan `.env` mengarah ke Supabase hosted, sehingga e2e Tugas 1–2 menulis ke data asli (15 baris uji, sudah dihapus dari hosted berdasarkan ID). Perbaikan: `.env.local` (gitignored) → `http://127.0.0.1:55321`; guard di `scripts/e2e.mjs` membatalkan tes bila host bukan lokal; e2e menunggu teks konfirmasi (`…dicatat.`). Hasil verifikasi Tugas 2: 1 check gagal yang diizinkan, `mobile tanpa scroll horizontal` (464px; nav header lama, Tugas 3); semua check lain lolos. Perubahan e2e & AGENTS.md masuk commit Tugas 2.
- 2026-10-30 — Tugas 2 — selesai — `npm run test:ui`: semua selain satu check mobile lama lolos, sesuai kriteria; `npm run build`: sukses.

- 2026-10-30 14:26 — Workflow — skrip otomatis `scripts/revamp/task.sh` dan `all.sh` dibuat (OpenCode kerja → Claude headless review → OpenCode perbaiki). Lihat docs/handoff/opencode-prompt.md bagian "Mode otomatis".
- 2026-10-30 14:34 — Tugas 2 — review Claude putaran 0 — VERDICT: ACCEPT — detail: docs/handoff/reviews/task-2-review-r0.md
- 2026-10-30 14:35 — Tugas 3 — review Claude putaran 0 — VERDICT: REJECT — detail: docs/handoff/reviews/task-3-review-r0.md
- 2026-10-30 14:36 — Tugas 3 — review Claude putaran 1 — VERDICT: REJECT — detail: docs/handoff/reviews/task-3-review-r1.md
- 2026-10-30 14:36 — Tugas 3 — review Claude putaran 2 — VERDICT: REJECT — detail: docs/handoff/reviews/task-3-review-r2.md
- 2026-10-30 14:38 — Tugas 3 — dua REJECT di atas palsu: `opencode run` gagal start (id sesi wajib berawalan `ses`), tidak ada commit Tugas 3, reviewer menilai HEAD yang salah. task.sh diperbaiki: id sesi `ses_…`, stderr ikut log, abort bila OpenCode tidak menghasilkan commit.
- 2026-10-30 14:53 — Tugas 3 — OpenCode berhenti "tidak ada terminal": penyebab `opencode.json` — OpenCode memakai aturan cocok TERAKHIR menang, dan `"*": "deny"` saya taruh paling akhir sehingga menolak semua bash. Diperbaiki: `*` deny di awal, allow di tengah, deny spesifik (.env/.temp/curl/install/push) paling akhir.
- 2026-10-30 15:10 — Tugas 3 — RED — `npm run test:ui`: gagal karena shell belum merender bottom nav mobile.
- 2026-10-30 15:18 — Tugas 3 — selesai — shell responsif, footer dihapus, FAB/nav sesuai view; e2e mencakup acceptance mobile/desktop.
- 2026-10-30 15:22 — Tugas 3 — review — fokus FAB, safe-area bottom nav, dan whitespace assertion diperbaiki; review final tetap mencatat loading gagal/skeleton belum dikerjakan karena konflik batas store.
- 2026-10-30 15:22 — Tugas 3 — verifikasi — `npm run test:ui`: semua check lulus; `npm run build`: berhasil.
- 2026-10-30 17:35 — Tugas 3 — review Claude putaran 0 — VERDICT: ACCEPT — detail: docs/handoff/reviews/task-3-review-r0.md
- 2026-10-30 — Tugas 4 — RED — `TZ=Asia/Jakarta npx tsx src/lib/dashboard.check.ts`: `2026-09 !== 2026-10` (bug WIB); dashboard helpers belum diekspor.
- 2026-10-30 — Tugas 4 — implementasi — insights lokal, trend month-key lokal, balance/account/category stats; added dua self-check ke `npm run check`.
- 2026-10-30 — Tugas 4 — verifikasi — `TZ=Asia/Jakarta npm run check` / `TZ=UTC npm run check`: semua passed; `npm run build`: berhasil.
- 2026-10-30 — Tugas 5 — RED — `npm run test:ui`: gagal pada `[data-testid="account-rail"]` yang belum ada, sesuai layar Home lama.
- 2026-10-30 — Tugas 5 — implementasi — Home baru, kartu/rail akun, insight, kategori, transaksi terbaru, dan chart batang SVG; hapus Dashboard/LineChart/PieChart lama; tambah acceptance Home ke e2e.
- 2026-10-30 — Tugas 5 — verifikasi — `npm run check`, `npm run test:ui`, `npm run build`: semua lulus; e2e semua check lulus.
- 2026-10-30 17:40 — Tugas 4 — review Claude putaran 0 — VERDICT: ACCEPT — detail: docs/handoff/reviews/task-4-review-r0.md
- 2026-10-30 17:57 — Tugas 5 — selesai (commit oleh Claude) — OpenCode menyelesaikan Home + 6 acceptance e2e (check/build/test:ui hijau menurut lognya) tapi berhenti sebelum `git rm`/commit: satu perintah gabungan `git status && git log && sed` ditolak kebijakan metakarakter, lalu ia menyimpulkan "shell git ditolak". Claude menghapus 3 stub lama, cek check+build, dan commit. Prompt tugas ditambah aturan "satu perintah per panggilan".
- 2026-10-30 18:00 — Tugas 5 — review Claude putaran 0 — VERDICT: ACCEPT — detail: docs/handoff/reviews/task-5-review-r0.md
