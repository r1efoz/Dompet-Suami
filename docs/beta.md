# Beta: mengundang teman

Aplikasi invite-only: pendaftaran publik mati, tiap pengguna hanya melihat datanya sendiri.

## Sekali saja (pemilik, di Supabase hosted)

1. SQL Editor → jalankan `supabase/migrations/2026-10-30-multiuser.sql`. Data lama diberikan ke pengguna **tertua** di Authentication → Users. Untuk memberikan ke pengguna lain: `update accounts set user_id = '<uuid>'` (ulangi untuk `categories`, `transactions`).
2. Authentication → URL Configuration: **Site URL** = `https://dompet-suami.vercel.app`; tambahkan URL itu ke **Redirect URLs**.
3. Authentication → Sign In / Providers: "Allow new users to sign up" tetap **mati**.
4. (Disarankan) Authentication → SMTP: pasang SMTP sendiri. Bawaan Supabase hanya mengirim beberapa email per jam, cukup untuk 3–5 undangan saja.

## Mengundang seseorang

Authentication → Users → **Invite user** → isi email. Penerima membuka tautan di email, membuat kata sandi, lalu masuk. Akun baru otomatis mendapat akun & kategori bawaan sendiri.

Alternatif tanpa email: **Add user → Create new user**, centang Auto Confirm, kirim kata sandi sementara lewat chat (minta diganti lewat "Lupa kata sandi?").

## Lupa kata sandi

Di halaman masuk, isi email lalu ketuk "Lupa kata sandi?". Tautan membawa pengguna ke layar buat kata sandi baru.

## Batas beta

- Data satu pengguna ≈ 0,2–0,7 MB per tahun; paket gratis (500 MB) cukup untuk ratusan pengguna.
- Tidak ada berbagi data antar pengguna, dan tidak ada pemulihan selain ekspor CSV di Laporan.
