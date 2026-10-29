# Dompet Suami

Aplikasi pencatat pengeluaran rumah tangga (dompet pasangan) berbasis **Svelte 5 + TypeScript + Vite 6 + Tailwind CSS v4**. Semua data disimpan di `localStorage` browser — tidak perlu backend, database, atau VPS.

## Tech stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Svelte 5 (runes) |
| Bahasa | TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Tes unit (ledger) | `tsx` + `scripts/ledger.check.ts` |
| Tes E2E | Playwright (`scripts/e2e.mjs`) |
| Type check | `svelte-check` |

## Struktur folder

```
src/
├── main.ts                # Entry point
├── App.svelte             # Router sederhana (view switching)
├── app.css                # Tailwind + design tokens (--paper, --ink, --accent, dll.)
├── models/
│   ├── Account.ts         # { id, name, type }
│   ├── Category.ts        # { id, name, type: 'income'|'expense' }
│   ├── Transaction.ts     # { id, type, amount, source, destination?, transferId?, timestamp }
│   └── Budget.ts          # (dihapus — fitur anggaran tidak aktif)
├── lib/
│   ├── store.ts           # Svelte stores (accounts, categories, transactions, balances, …) + localStorage
│   ├── ledger.ts          # computeBalances, summarize, buildLedger, startOfMonth, monthlyTrend
│   ├── dashboard.ts       # getDashboardData, monthlyTrend (12 bulan)
│   ├── format.ts          # formatIDR, formatDate, formatSigned
│   └── scripts/
│       ├── ledger.check.ts        # 10 assertion tes unit (`npm run check`)
│       └── e2e.mjs                # 14 check Playwright (`npm run test:ui`)
├── views/
│   ├── Home.svelte        # Dashboard (summary cards, PieChart, LineChart, Month Summary)
│   ├── Master.svelte      # AccountsManager + CategoryManager
│   ├── Transaction.svelte # EntryForm + TransactionList
│   ├── Report.svelte      # Reports (Neraca + Buku Besar + filter rentang tanggal)
│   └── Budget.svelte      # (file dihapus — fitur anggaran tidak aktif)
└── components/
    ├── Dashboard.svelte   # Konten halaman Home
    ├── Reports.svelte     # Laporan: neraca saldo, buku besar, ekspor CSV, filter tanggal
    ├── EntryForm.svelte   # Form pemasukan / pengeluaran / transfer
    ├── TransactionList.svelte # Riwayat transaksi dengan filter tab
    ├── AccountsManager.svelta # CRUD akun (bank, tunai, e-wallet)
    ├── CategoryManager.svelta # CRUD kategori
    ├── PieChart.svelte    # Grafik lingkaran pengeluaran per kategori (SVG murni)
    └── LineChart.svelte   # Grafik garis trend pemasukan/pengeluaran 12 bulan (SVG murni)
```

## Perintah penting

```bash
npm run dev          # Jalankan dev server (http://localhost:5173/)
npm run build        # Build produksi ke folder dist/
npm run preview      # Preview hasil build secara lokal
npm run check        # Tes unit ledger (10 assertion)
npm run test:ui      # Tes E2E Playwright (14 check; butuh dev server berjalan di :5173)
```

## Persistensi data

Data tersimpan di `localStorage` dengan kunci:

| Kunci localStorage | Isi |
|--------------------|-----|
| `dompet-suami-transactions` | Daftar transaksi |
| `dompet-suami-accounts` | Daftar akun (default: Bank, Tunai, E-Wallet) |
| `dompet-suami-categories` | Daftar kategori (default: Gaji, Freelance, Makanan, Transport, Listrik/Air, Hiburan) |

Data tetap utuh setelah reload halaman. Untuk cadangan, gunakan fitur **Ekspor CSV** di halaman Laporan.

## Tampilan & fitur

- **Home (Dashboard)** — Kartu saldo total, pemasukan, pengeluaran, net; PieChart distribusi pengeluaran per kategori; LineChart trend pemasukan vs pengeluaran 12 bulan; ringkasan bulan ini.
- **Master** — Kelola akun dan kategori.
- **Transaksi** — Catat pemasukan / pengeluaran / transfer (double-entry), validasi saldo cukup, input tidak valid.
- **Laporan** — Neraca saldo per akun, buku besar per sumber dana, ekspor CSV (UTF-8 BOM, aman untuk Excel), filter rentang tanggal (Dari/Sampai), riwayat dengan nama akun (bukan ID mentah).

## Variabel lingkungan

Salin `.env.example` ke `.env` untuk pengembangan lokal:

```bash
cp .env.example .env
```

Variabel yang diawali `VITE_` akan diekspos oleh Vite ke kode sisi klien. Saat ini aplikasi berjalan sepenuhnya client-side (localStorage), tidak perlu variabel untuk development.

## Deploy (gratis, tidak perlu VPS)

Aplikasi ini adalah **static site** (HTML/CSS/JS hasil `vite build`), cocok untuk hosting gratis:

### Vercel (direkomendasikan)
1. Buka [vercel.com](https://vercel.com) → login dengan GitHub.
2. **Add New Project** → impor repo `r1efoz/Dompet-Suami`.
3. Framework preset: **Vite**.
   - Build command: `npm run build`
   - Output directory: `dist`
4. Klik **Deploy**. Setiap `git push` ke `main` akan otomatis deploy ulang.

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
- Jika mengubah `store.ts` atau `ledger.ts`, pastikan `npm run check` masih lolos (10 assertion).
- Fitur **Anggaran** dan file terkait (`Budget.ts`, `budgetStore.ts`, `BudgetManager`, `BudgetReport`, tab 'Anggaran' di `App.svelte`) **telah dihapus** karena tidak diperlukan — jangan memasangnya kembali tanpa permintaan eksplisit.

## Lisensi

Tidak ada lisensi spesifik. Project pribadi / open untuk digunakan.
