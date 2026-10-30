# Dompet Suami

Aplikasi pencatat pengeluaran rumah tangga (dompet pasangan) berbasis **Svelte 5 + TypeScript + Vite 6 + Tailwind CSS v4**. Data disimpan di **Supabase cloud** (PostgreSQL) — tidak perlu backend atau VPS sendiri.

## Tech stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Svelte 5 (sintaks legacy) |
| Bahasa | TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Tes unit (ledger) | `tsx` + `scripts/ledger.check.ts` |
| Tes E2E | Playwright (`scripts/e2e.mjs`) |
| Type check | `svelte-check` |

## Struktur folder

```
src/
├── main.ts                # Entry point + registrasi service worker (hanya production)
├── App.svelte             # Shell: nav atas/bawah, FAB, toast, view aktif
├── app.css                # Tailwind v4 + token desain
├── models/                # Account, Category, Transaction
├── lib/
│   ├── store.ts           # Svelte stores + Supabase CRUD
│   ├── ledger.ts          # saldo, ringkasan, buku besar
│   ├── dashboard.ts       # data Home (tren, kategori teratas)
│   ├── insights.ts        # insight lokal Home
│   ├── history.ts         # filter & grup riwayat
│   ├── reports.ts         # periode, saldo akun, kategori, CSV
│   ├── master.ts          # validasi nama, cek referensi
│   └── *.check.ts         # tes logika (`npm run check`)
├── views/                 # Home, Transaction, Report, Master
└── components/
    ├── ui/                # komponen dasar (Card, Sheet, Chips, nav, dll.)
    ├── report/            # tab Laporan
    └── EntryForm, TransactionList, AccountsManager, CategoryManager, MasterSheet

public/                    # logo.svg, manifest.webmanifest, sw.js, icons/
scripts/                   # e2e.mjs (Playwright), make-icons.mjs
supabase/                  # schema.sql, migrations/, seed.e2e.sql
docs/                      # design.md, design-system.md, rencana & handoff revamp
```

## PWA (pasang di layar utama)

Build produksi (`npm run build && npm run preview`) mendaftarkan service worker. Android Chrome: menu ⋮ → *Install app* / *Add to Home screen*. iOS Safari: Bagikan → *Add to Home Screen*. Setelah dibuka dua kali, shell tampil offline (data tetap butuh koneksi). Ikon dibuat ulang dengan `node scripts/make-icons.mjs`.

## Perintah penting

```bash
npm run dev          # Jalankan dev server (http://localhost:5173/)
npm run build        # Build produksi ke folder dist/
npm run preview      # Preview hasil build secara lokal
npm run check        # Tes logika (src/lib/*.check.ts)
npm run test:ui      # Tes E2E Playwright (butuh dev server di :5173 dan Postgres lokal)
```

## Persistensi data (Supabase)

Data tersimpan di tabel Supabase:

| Tabel | Isi |
|-------|-----|
| `accounts` | Daftar akun (default: Bank, Tunai, E-Wallet) |
| `categories` | Daftar kategori (default: Gaji, Freelance, Makanan, Transport, Listrik/Air, Hiburan) |
| `transactions` | Daftar transaksi (pemasukan, pengeluaran, transfer) |

Untuk cadangan, gunakan fitur **Ekspor CSV** di halaman Laporan.

## Skema database

File `supabase/schema.sql` berisi DDL untuk membuat tabel, index, dan Row Level Security (RLS). Jalankan di **SQL Editor** di dashboard Supabase (Project Settings → SQL Editor) sebelum pertama kali menjalankan aplikasi.

## Variabel lingkungan

Salin `.env.example` ke `.env` dan isi kredensial Supabase:

```bash
cp .env.example .env
```

Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari **Project Settings → API** di dashboard Supabase.

Variabel yang diawali `VITE_` akan diekspos oleh Vite ke kode sisi klien.

## Setup awal (langkah demi langkah)

1. Buat project baru di [supabase.com](https://supabase.com).
2. Jalankan `supabase/schema.sql` di SQL Editor Supabase.
3. Ambil `URL` dan `anon public key` dari Project Settings → API.
4. Salin `.env.example` ke `.env`, isi kredensial.
5. Jalankan `npm run dev` untuk development.

## Tampilan & fitur

- **Home (Dashboard)** — Kartu saldo total, pemasukan, pengeluaran, net; PieChart distribusi pengeluaran per kategori; LineChart trend pemasukan vs pengeluaran 12 bulan; ringkasan bulan ini.
- **Master** — Kelola akun dan kategori.
- **Transaksi** — Catat pemasukan / pengeluaran / transfer (double-entry), validasi saldo cukup, input tidak valid.
- **Laporan** — Neraca saldo per akun, buku besar per sumber dana, ekspor CSV (UTF-8 BOM, aman untuk Excel), filter rentang tanggal (Dari/Sampai), riwayat dengan nama akun (bukan ID mentah).

## Deploy (gratis, tidak perlu VPS)

Aplikasi ini adalah **static site** (HTML/CSS/JS hasil `vite build`), cocok untuk hosting gratis:

### Vercel (direkomendasikan)
1. Buka [vercel.com](https://vercel.com) → login dengan GitHub.
2. **Add New Project** → impor repo `r1efoz/Dompet-Suami`.
3. Framework preset: **Vite**.
   - Build command: `npm run build`
   - Output directory: `dist`
4. Tambahkan Environment Variables: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
5. Klik **Deploy**. Setiap `git push` ke `main` akan otomatis deploy ulang.

### GitHub Pages
1. Tambahkan `base: '/Dompet-Suami/'` di `vite.config.ts`.
2. Jalankan `npm run build`, unggah isi `dist/` ke branch `gh-pages`, atau gunakan GitHub Actions.
3. Aktifkan Pages di Settings → Pages repo.

## Tes untuk agent lain

Sebelum mengajukan PR atau mengklaim pekerjaan selesai, jalankan:

```bash
npm run check      # tes unit ledger
npm run build      # build produksi + TypeScript
npx svelte-check --tsconfig ./tsconfig.app.json  # 0 error diinginkan
npm run test:ui    # tes E2E (jalankan `npm run dev` di terminal lain terlebih dahulu)
```

## Catatan untuk agent

- Jangan menambahkan abstraksi, wrapper, atau dependensi baru tanpa kebutuhan nyata (YAGNI / ponytail).
- Perbaikan bug harus ditekankan pada akar penyebab, bukan symptom.
- Jika mengubah `store.ts`, `supabase.ts`, atau `ledger.ts`, pastikan `npm run check` masih lolos (10 assertion).
- Fitur **Anggaran** dan file terkait (`Budget.ts`, `budgetStore.ts`, `BudgetManager`, `BudgetReport`, tab 'Anggaran' di `App.svelte`) **telah dihapus** karena tidak diperlukan — jangan memasangnya kembali tanpa permintaan eksplisit.
- `recordEntry`, `recordTransfer`, `clearAll` sekarang **async** (menulis ke Supabase). Komponen yang memanggilnya harus menggunakan `await`.

## Lisensi

Tidak ada lisensi spesifik. Project pribadi / open untuk digunakan.
