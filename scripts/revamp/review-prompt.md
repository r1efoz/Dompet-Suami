Kamu reviewer independen untuk Tugas {N} dari docs/plans/2026-10-30-revamp-ui.md di repo ini. Pekerjaan dilakukan oleh agen lain dan sudah di-commit. Tentukan dulu commit yang direview (sebut SHA-nya di Bukti): HEAD, kecuali bila pesan HEAD berawalan `chore(revamp)` atau `fix(revamp)` (commit skrip/dokumentasi, bukan pekerjaan tugas) — dalam hal itu mundur ke commit non-`chore(revamp)`/`fix(revamp)` terdekat sebelumnya. Sebut commit itu `<SHA>` di langkah berikut. Kamu hanya membaca dan menjalankan perintah verifikasi; jangan mengubah file apa pun.

Lakukan berurutan:
1. Baca docs/plans/2026-10-30-revamp-ui.md bagian "Tugas {N}" (Boleh sentuh, Jangan sentuh, Tes dulu, Verifikasi, Selesai bila) dan bagian spesifikasi yang dirujuknya di docs/design.md dan docs/design-system.md.
2. `git show <SHA> --stat` dan `git diff <SHA>~1 <SHA> --stat`. Pastikan: (a) pesan commit sesuai yang diminta tugas, (b) tidak ada file di luar "Boleh sentuh" (kecuali docs/handoff/revamp-ui.md), (c) file yang diminta dihapus memang hilang.
3. Baca diff penuh `git diff <SHA>~1 <SHA>` untuk file sumber. Periksa pelanggaran: hex/rgb di .svelte, runes ($state/$props/$derived), confirm()/alert(), dependency baru di package.json, ukuran font/radius di luar skala design-system.md §3.1/§4.2, teks "Supabase" di UI, guard host di scripts/e2e.mjs dilepas.
4. Jalankan `npm run check`, lalu `npm run build`, lalu `npm run test:ui` (dev server sudah berjalan di :5173; e2e mereset DB lokal sendiri). Bandingkan dengan bagian "Verifikasi" tugas: check yang boleh merah hanya yang disebut eksplisit di sana.
5. Cek bagian "Log" di docs/handoff/revamp-ui.md punya entri untuk Tugas {N}.

Format jawaban WAJIB, tanpa pembuka:
Baris pertama persis `VERDICT: ACCEPT` atau `VERDICT: REJECT`.
Lalu bagian `## Bukti` berisi ringkasan 1 baris per perintah verifikasi (nama perintah → hasil, kutip baris gagal persis jika ada).
Lalu bagian `## Temuan` berisi daftar bernomor, tiap butir: `path:baris — masalah — perbaikan yang diminta`. Kosong jika ACCEPT tanpa catatan. Hanya temuan yang melanggar dokumen atau membuat verifikasi gagal; bukan selera.
REJECT hanya jika ada verifikasi gagal di luar yang diizinkan, file di luar "Boleh sentuh", atau pelanggaran larangan. Kekurangan kecil yang tidak melanggar dokumen → ACCEPT dengan catatan.
