# Aturan agent

## Akun Vercel
Project ini memakai akun Vercel r1efoz lewat `.envrc` (direnv). Selalu jalankan perintah Vercel dengan awalan `direnv exec .`, contoh: `direnv exec . vercel whoami`. Jangan jalankan `vercel` tanpa awalan itu, dan jangan menampilkan isi `.envrc`.

## Supabase
- **Lokal (dipakai saat development):** API `http://127.0.0.1:55321`, Postgres `127.0.0.1:55322`, user/password `postgres`, DB `postgres`. Stack ini bernama `dompet-suami` (`supabase status` harus menunjukkan port 553xx). Port `54321/54322` milik project lain (Coa_Converter) — jangan dipakai.
- **Hosted:** project ref `utrcegxlfiktgoubrhaj` (nama "Dompet Suami"). **Hanya baca.** Jangan menjalankan migrasi, `supabase db push`, atau perintah tulis apa pun ke hosted; itu dilakukan pemilik repo.
- Jangan membaca atau menampilkan `.env`, `.envrc`, `supabase/.temp/`. Nilai `VITE_SUPABASE_*` tidak boleh muncul di chat atau commit.
- Perubahan skema ditulis di `supabase/schema.sql` dan dijalankan di lokal lewat `psql -h 127.0.0.1 -p 55322 -U postgres -d postgres`.
- **`.env` menunjuk ke hosted** (dipakai Vercel). Untuk development dan e2e, `.env.local` (gitignored) meng-override ke `http://127.0.0.1:55321`. Jangan hapus `.env.local`. `scripts/e2e.mjs` punya guard yang membatalkan tes bila app mengarah ke host selain 127.0.0.1/localhost — jangan dilepas. Jika guard memicu, perbaiki `.env.local` dan restart `npm run dev`; **jangan** jalankan e2e ke hosted.

## Stack & konvensi
- Svelte 5 dengan **sintaks legacy** (`export let`, `$:`, `on:click`). Jangan memakai runes.
- Tailwind v4 lewat `@theme inline` di `src/app.css`. Warna/radius hanya lewat token (lihat `docs/design-system.md`). Tidak ada hex di file `.svelte`.
- Tidak menambah dependency tanpa persetujuan pemilik repo.
- Tes logika: file `src/lib/*.check.ts` (node:assert), dijalankan lewat `npm run check`. Tes UI: `scripts/e2e.mjs` (Playwright), `npm run test:ui`, butuh `npm run dev` di port 5173.
- Urutan kerja tiap perubahan perilaku: tulis/ubah check atau e2e → jalankan → lihat gagal → baru ubah kode → jalankan lagi → hijau.
- Commit kecil per tugas, format Conventional Commits (`feat(scope): …`), pesan bahasa Inggris.

## Pekerjaan berjalan
Revamp UI: baca `docs/handoff/revamp-ui.md` dulu, lalu ikuti `docs/plans/2026-10-30-revamp-ui.md` satu tugas per sesi.
