# Task Tracker - Dompet Suami

## Status: Complete (revisi UI anti-slop)

---

## To Do

- [ ] (opsional) Kategori pengeluaran
- [ ] (opsional) Filter laporan per rentang tanggal
- [ ] (opsional) Anggaran bulanan per kategori

---

## In Progress

_(tidak ada)_

---

## Complete

### Fungsional
- [x] Model data: Account, Transaction (+ transferId/destination)
- [x] Ledger murni (`src/lib/ledger.ts`): saldo turunan, ringkasan, buku besar
- [x] Store terpusat + persistensi localStorage (`src/lib/store.ts`)
- [x] Catat pemasukan / pengeluaran / transfer (double-entry)
- [x] Validasi saldo tidak cukup & input tidak valid
- [x] Neraca saldo + buku besar per sumber dana
- [x] Ekspor CSV (UTF-8 BOM, aman untuk Excel)
- [x] Filter riwayat: semua / masuk / keluar / transfer

### Revisi UI (anti-slop: no-ai-slop + gpt-taste + design-taste-frontend)
- [x] Arah desain: lembar rekening bank. Kertas + tinta, bukan dashboard kartu
- [x] Tipografi IBM Plex Sans / IBM Plex Mono, angka tabular via `.num`
- [x] Satu aksen vermilion (`--accent`): pengeluaran dan saldo negatif saja
- [x] Tanpa kartu, tanpa shadow, tanpa gradient. Pemisah berupa hairline 1px
- [x] Radius 2px seragam, tanpa label `uppercase tracking`, tanpa em-dash
- [x] Header statement: saldo gabungan besar + ringkasan masuk/keluar/bersih
- [x] Tabel sumber dana: nama, porsi, saldo (kolom jenis dihapus, redundan)
- [x] Form bertab dengan garis bawah, feedback `aria-live` di bawah tombol
- [x] Laporan: neraca saldo dan buku besar, CSV sebagai tautan tenang
- [x] Riwayat full-bleed dengan filter tab, nama akun (bukan id mentah)
- [x] Empty state, focus ring, `prefers-reduced-motion`, dark mode via token
- [x] Layout responsif: mobile 390, tablet 834, desktop 1440, dark mode

### Perbaikan bug
- [x] Halaman blank: kompatibilitas `new App()` + cache Vite basi → `mount()`
- [x] UI tanpa style: Tailwind v4 butuh `@tailwindcss/postcss` + `@import 'tailwindcss'`
- [x] Data tidak update setelah submit: state dipusatkan di store
- [x] Transfer memakai prop yang salah (`transfers` tidak ada) → `recordTransfer`
- [x] Riwayat menampilkan id akun (`bank`, `cash`) → nama akun
- [x] Saldo ganda di header mobile dan label jenis berulang ("Bank bank") dihapus
- [x] Hover tombol memudar ke abu-abu → campuran tinta, tetap gelap
- [x] Ringkasan statement melebar di tablet → dua kolom sejak `md`

---

## Verifikasi

```bash
npm run check                                      # 10 assertion ledger
npm run build                                      # sukses
npm run test:ui                                    # 14 check Playwright
npx svelte-check --tsconfig ./tsconfig.app.json    # 0 error, 0 warning
```

- Saldo: bank Rp 4.000.000, tunai Rp 750.000 setelah gaji 5jt + transfer 1jt + belanja 250rb
- Persistensi setelah reload: benar
- Ekspor CSV: 4 baris data, header sesuai
- Buku besar: saldo berjalan benar per akun, tab aktif sesuai isi
- Riwayat: nama akun, bukan id; tanpa error console
- Mobile 390 / tablet 834 / desktop 1440 / dark: tanpa scroll horizontal, data tampil
- Screenshot: `dompet-desktop.png`, `dompet-mobile.png`, `dompet-tablet.png`, `dompet-dark.png`, `dompet-ledger.png`

---

## Catatan

- Working directory: `/Users/ariefwicaksono/dompet-suami`
- Stack: Svelte 5 + TypeScript + Vite 6 + Tailwind CSS v4
- Dev: `npm run dev` → http://localhost:5173/
- Data tersimpan di localStorage: `dompet-suami-transactions`, `dompet-suami-accounts`
- Jika halaman tampak blank atau tanpa style, restart Vite dan hapus `node_modules/.vite`
