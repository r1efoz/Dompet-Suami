Kamu mengerjakan revamp UI project ini. Baca file berikut secara berurutan dan seluruhnya sebelum menulis apa pun:
1. AGENTS.md
2. docs/handoff/revamp-ui.md (terutama bagian Log paling bawah dan Pertanyaan terbuka)
3. docs/design-system.md
4. docs/design.md
5. docs/plans/2026-10-30-revamp-ui.md

Aturan:
- Kerjakan HANYA Tugas {N}. Jangan mengerjakan tugas lain, jangan "sekalian" merapikan file di luar daftar "Boleh sentuh".
- Ikuti urutan di tugas: tulis tes dulu → jalankan → tunjukkan outputnya merah → baru ubah kode → jalankan lagi → tunjukkan hijau. Tempelkan output perintah apa adanya, jangan diringkas.
- Semua nilai (warna, ukuran, teks, rumus) sudah final di dokumen. Jangan menebak. Kalau dokumen tidak menyebut sesuatu, pilih tafsir paling sederhana yang tidak melanggar docs/design-system.md, lalu tulis tafsir itu di bagian "Pertanyaan terbuka" docs/handoff/revamp-ui.md.
- Dilarang: menambah dependency, memakai runes Svelte, membaca .env/.envrc/supabase/.temp, menjalankan perintah apa pun ke Supabase hosted, memakai confirm()/alert(), menulis hex di file .svelte, melepas guard host di scripts/e2e.mjs.
- Dev server sudah berjalan di http://localhost:5173 — jangan menjalankan `npm run dev` lagi.
- Setelah "Selesai bila" semua tercentang: git add file tugas ini (plus docs/handoff/revamp-ui.md), commit dengan pesan yang tertulis di tugas, tambahkan 3–5 baris ke bagian "Log" di docs/handoff/revamp-ui.md dengan format yang ada, lalu BERHENTI. Jangan mulai tugas berikutnya.
{EXTRA}
