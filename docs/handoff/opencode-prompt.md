# Prompt pembuka untuk OpenCode

Salin blok di bawah ke chat OpenCode **baru** di folder project. Satu sesi = satu tugas. Untuk tugas berikutnya buka sesi baru dan ganti angka pada baris terakhir.

```
Kamu mengerjakan revamp UI project ini. Baca file berikut secara berurutan dan seluruhnya sebelum menulis apa pun:
1. AGENTS.md
2. docs/handoff/revamp-ui.md
3. docs/design-system.md
4. docs/design.md
5. docs/plans/2026-10-30-revamp-ui.md

Aturan:
- Kerjakan HANYA Tugas yang saya sebut di bawah. Jangan mengerjakan tugas lain, jangan "sekalian" merapikan file di luar daftar "Boleh sentuh".
- Ikuti urutan di tugas: tulis tes dulu → jalankan → tunjukkan outputnya merah → baru ubah kode → jalankan lagi → tunjukkan hijau. Tempelkan output perintah apa adanya, jangan diringkas.
- Semua nilai (warna, ukuran, teks, rumus) sudah final di dokumen. Jangan menebak, jangan memilih nilai lain. Kalau dokumen tidak menyebut sesuatu, pilih tafsir paling sederhana yang tidak melanggar docs/design-system.md, lalu tulis tafsir itu di bagian "Pertanyaan terbuka" docs/handoff/revamp-ui.md.
- Dilarang: menambah dependency, memakai runes Svelte, membaca .env/.envrc/supabase/.temp, menjalankan perintah apa pun ke Supabase hosted, memakai confirm()/alert(), menulis hex di file .svelte.
- Setelah "Selesai bila" semua tercentang: git add hanya file tugas ini, commit dengan pesan yang tertulis di tugas, tambahkan 3–5 baris ke bagian "Log" di docs/handoff/revamp-ui.md, lalu BERHENTI dan laporkan: file yang berubah, output verifikasi, dan tafsir yang kamu ambil (jika ada).

Mulai dari baseline di bagian "Cara memakai rencana ini" (jalankan npm run check dan npm run build, catat hasilnya di Log), lalu kerjakan Tugas 1.
```

Untuk sesi berikutnya, ganti baris terakhir menjadi, misalnya:

```
Baseline sudah dicatat di Log. Baca Log terakhir di docs/handoff/revamp-ui.md, lalu kerjakan Tugas 2.
```

## Jika OpenCode macet

- **Minta nilai/keputusan yang sudah ada di dokumen** → jawab: "Sudah ada di docs/design-system.md §X / docs/design.md §Y, baca lagi bagian itu."
- **Tes tidak bisa merah** → jawab: "Lihat bagian 'Tes dulu' tugas ini; RED yang sah dijelaskan di sana (mis. TZ=Asia/Jakarta untuk Tugas 4, content-type untuk Tugas 10)."
- **Minta akses Supabase hosted / project ref** → jawab: "Tidak perlu. Semua pekerjaan memakai DB lokal 127.0.0.1:55322. Baca AGENTS.md bagian Supabase."
- **Dev server tidak di 5173** → jawab: "Hentikan proses yang memakai 5173 (`lsof -i :5173`), lalu `npm run dev` lagi. Jangan ubah port di scripts/e2e.mjs."
- **Mengusulkan library** → jawab: "Tidak. design-system.md §9 melarang dependency baru. Pakai SVG/CSS tangan sesuai spesifikasi."
- **Mengusulkan migrasi ke runes** → jawab: "Tidak. AGENTS.md: sintaks legacy."

## Mode otomatis (tanpa copy-paste)

`scripts/revamp/task.sh <N>` menjalankan satu tugas end-to-end: OpenCode mengerjakan (`opencode run --auto`), Claude headless mereview (`claude -p`, hanya baca + perintah verifikasi), dan bila ditolak OpenCode memperbaiki (maks 2 putaran). `scripts/revamp/all.sh <dari> [sampai]` menjalankan berurutan dan berhenti di tugas pertama yang gagal.

```bash
scripts/revamp/task.sh 2        # satu tugas
scripts/revamp/all.sh 3 11      # sisanya berurutan
```

Prasyarat: `.env.local` mengarah ke `127.0.0.1:55321` (skrip menolak jalan jika tidak), Supabase lokal aktif, `opencode` dan `claude` ada di PATH. Dev server :5173 dinyalakan skrip bila belum ada.

Hasil tiap putaran: `docs/handoff/reviews/task-N-opencode-rK.log` (keluaran OpenCode) dan `task-N-review-rK.md` (review Claude; baris pertama `VERDICT: ACCEPT|REJECT`). Setiap verdict juga ditulis ke bagian Log `docs/handoff/revamp-ui.md`. Review yang ACCEPT di-commit otomatis sebagai `chore(revamp): review log task N`.

Jika skrip berakhir `GAGAL`: baca `task-N-review-r2.md`, putuskan sendiri (perbaiki manual, atau jalankan ulang `task.sh N` setelah commit perbaikan).

Tambahan catatan ke OpenCode untuk satu tugas: `EXTRA="…" scripts/revamp/task.sh N`. Tugas yang sudah di-commit tapi belum direview: `SKIP_WORK=1 scripts/revamp/task.sh N` (langsung review HEAD, perbaikan tetap lewat OpenCode bila ditolak).

### Batas izin OpenCode saat `--auto`

`opencode.json` di root repo membatasi tool bash OpenCode dengan allowlist (deny-by-default): hanya `git` baca/add/commit (tanpa push/reset/checkout), `npm run check|build|test:ui`, `npx tsx`, `psql` ke 127.0.0.1:55322, perintah baca file, dan `node scripts/make-icons.mjs`. Tidak ada `curl`, `npm install`, `vercel`, `supabase`, `direnv`, `rm -rf`, atau membaca `.env*`. `webfetch` dimatikan. Jika sebuah tugas butuh perintah di luar daftar, OpenCode akan melaporkan "denied" — tambahkan pola spesifik ke `opencode.json`, jangan `"*": "allow"`. Allowlist ini belum diuji oleh Claude (sandbox menolak menjalankan agen otonom); cek log putaran pertama untuk pesan denied yang tidak diharapkan.
