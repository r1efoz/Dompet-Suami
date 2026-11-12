# Ledger POV gajian — design (2026-11-13)

Sumber: rencana yang disetujui pemilik. Desain visual mengikuti sistem yang ada (docs/design-system.md): tidak ada bahasa visual baru.

## Context

Pemilik ingin membaca keuangan dari sudut pandang **satu kali gajian**: saldo awal saat gaji masuk, daftar mutasi setelahnya (gaji masuk ke Mandiri, bayar A, bayar B, …), saldo akhir, dan ringkasan kategori mana yang paling besar di periode itu. Setiap baris mutasi harus bisa diklik untuk melihat detail sampai deskripsi. Tampilan per bulan tetap ada.

Keputusan pemilik (dari brainstorming):
- Periode gajian dideteksi **otomatis** dari pemasukan berkategori "Gaji" (bukan toggle manual, bukan tanggal tetap). Satu periode = dari satu gaji sampai gaji berikutnya.
- POV gajian menampilkan **semua sumber dana digabung** (transfer antar akun saling meniadakan; saldo = total semua akun).
- Fitur hidup di **tab Buku besar yang sudah ada**, lewat pilihan periode baru "Gajian…" di PeriodPicker. Tidak ada layar baru.
- Form **Masuk**: teks akun saat ini berbunyi "dari sumber", harus "ke sumber".

Keputusan saya (bisa dikoreksi saat approval):
- Pembacaan fix label: `src/components/EntryForm.svelte:191` label "DARI AKUN" pada mode Masuk diganti **"KE AKUN"**; mode Keluar tetap "DARI AKUN", Transfer tetap "DARI".
- Buku besar **default membuka "Semua akun"** (gabungan), bukan lagi akun bersaldo terbesar. Pilihan per akun tetap ada di select. Klik akun di tab Saldo akun tetap membuka ledger akun itu.
- Periode gajian dibatasi **per hari kalender lokal**: mulai 00:00 tanggal gaji, berakhir 00:00 tanggal gaji berikutnya. Dua gaji di hari yang sama = satu periode.
- Pada timestamp yang sama (semua entri form ditulis `T12:00` lokal), **pemasukan ditampilkan sebelum pengeluaran** di ledger, agar baris gaji memimpin harinya dan saldo berjalan tidak "turun dulu".
- Detail dari ledger bersifat **read-only** (tanpa Edit/Hapus); edit tetap lewat Transaksi → Riwayat.

Yang sudah ada dan dipakai ulang:
- `src/components/report/LedgerTab.svelte` — tabel Saldo awal → mutasi → saldo berjalan, per akun. Baris belum bisa diklik.
- `src/lib/ledger.ts` — `buildLedger(transactions, accountId, opening)`, `operating()` (non-transfer + biaya admin transfer sebagai expense).
- `src/lib/reports.ts` — `Period`, `periodRange`, `accountBalanceReport`, `categoryReport`.
- `src/components/TransactionList.svelte:201-223` — sheet detail transaksi (tanggal, nominal, Akun, Kategori/Ke/Biaya, Edit/Hapus). Deskripsi hanya jadi judul, belum jadi field.
- `src/components/report/PeriodPicker.svelte` — chips Bulan/Tahun ini/Rentang… + Sheet rentang.
- `Period` didefinisikan dua kali: `src/lib/ui.ts:3` dan `src/lib/reports.ts:5`.
- Seed e2e (`supabase/seed.e2e.sql`) sudah punya kategori income `salary` "Gaji"; chip kategori di form ada di `#entry-category`. Tidak ada assertion e2e yang bergantung pada teks "DARI AKUN" atau pada income step 1 tanpa kategori.

Catatan data nyata: kolom `category_id` ditambahkan belakangan, jadi gaji lama pemilik mungkin belum berkategori Gaji → picker kosong di data asli. Langkah 0 di bawah menghitungnya (read-only) dan melaporkan ke pemilik.

Routing CLAUDE.md: UI feature → brainstorming (selesai) → Explore (selesai) → `frontend-design:frontend-design` → `superpowers:writing-plans` → implementasi TDD → review order. Spec ditulis ke `docs/superpowers/specs/2026-11-13-ledger-payday-design.md` (isi = bagian Design di bawah) dan di-commit sebelum kode.

## Design

### 1. Model periode gajian (`src/lib/reports.ts`)

```ts
export type Period =
  | { kind: 'month'; y: number; m: number }
  | { kind: 'year'; y: number }
  | { kind: 'range'; from: string; to: string }
  | { kind: 'payday'; day: string }; // YYYY-MM-DD lokal tanggal gaji; hanya ini yang disimpan di reportState
```
- `src/lib/ui.ts` berhenti mendefinisikan `Period` sendiri: `export type { Period } from './reports'`.
- `PaydayPeriod = { day: string; start: Date; end?: Date; prevDay?: string; amount: number; label: string }`.
- `paydayPeriods(transactions, categories, now = new Date()): PaydayPeriod[]` (baru):
  - kandidat = income, bukan transfer, `categoryId` milik kategori income yang namanya cocok `/gaji/i`.
  - kelompokkan per hari kalender lokal (`day`); `start` = 00:00 lokal `day`; `amount` = jumlah gaji hari itu.
  - `end` = `start` periode berikutnya; periode terakhir `end` undefined (berjalan). `prevDay` = day periode sebelumnya.
  - hasil urut **terbaru dulu**. Kosong bila tidak ada kategori Gaji / belum ada transaksi gaji.
  - label: `Gajian 25 Okt` (berjalan) / `Gajian 25 Sep – 24 Okt` (hari sebelum `end`). Tahun ditambahkan bila ≠ tahun `now`.
- `periodRange(period, paydays: PaydayPeriod[] = [])`: cabang `payday` mencari `day` di `paydays`; `start`, `end = p.end ?? new Date(8.64e15)`, `label`, `prevStart = prev ? prev.start : start`, `prevEnd = start`. Bila `day` tidak ditemukan → kembalikan rentang satu hari itu (dipakai hanya sebagai jaring pengaman; Report.svelte sudah fallback ke bulan berjalan sebelum sampai sini).

### 2. Buku besar gabungan semua akun (`src/lib/ledger.ts`)

- `buildLedger(transactions, accountId, opening)`: `accountId === ''` berarti **semua akun**: baris = `operating(transactions)` (transfer disembunyikan, biaya admin tampil sebagai expense), saldo berjalan dari `opening`.
- Urutan (kedua mode): timestamp naik, lalu **income sebelum expense**, lalu `id` (deterministik).
- `totalBalanceBefore(transactions, start)` di `reports.ts` = Σ `signed(tx)` semua akun dengan timestamp < start. Invarian: `awal + Σ mutasi operating = Σ akhir semua akun`.

### 3. UI

**PeriodPicker** (`src/components/report/PeriodPicker.svelte`)
- Prop baru `paydays: PaydayPeriod[]`. Chip baru `{ id: 'payday', label: aktif ? periodRange(period, paydays).label : 'Gajian…' }` ditaruh **sebelum** 'Rentang…'. Baris 30 (`value`) tangani `kind === 'payday'`.
- Klik → Sheet "Pilih gajian": daftar `ListItem` per periode (title = label, subtitle = `Gaji {formatIDR(amount)}`, amount = '✓' bila aktif), maksimal 12 terbaru. Kosong → teks "Belum ada pemasukan berkategori Gaji. Catat gaji dengan kategori Gaji agar periode gajian muncul."
- Pilih → `dispatch('change', { kind: 'payday', day })`, sheet tutup.

**Report** (`src/views/Report.svelte`)
- `$: paydays = paydayPeriods($transactions, $categories)`.
- `$: period = resolvePeriod($reportState.period, paydays)`: payday yang `day`-nya tidak ada lagi di `paydays` (gaji dihapus/diedit) → fallback bulan berjalan. `range = periodRange(period, paydays)`.
- `setPeriod`: bila `p.kind === 'payday'` → `accountId = ''`.
- Semua akses `period.y`/`period.m` (baris 36, 38, 44, 45, 89): payday diperlakukan seperti `range` (`year = range.start.getFullYear()`, `monthly` difilter rentang, `selectedMonth = null`). `prevLabel` payday = `'vs gajian sblm'`. `fileKey` payday = `gajian-${day}`.
- `tabRows()` ledger: opening = `accountId ? balRows.find(...).awal : totalBalanceBefore(...)`; kolom tambah "Akun".
- Oper `categories={$categories}` dan `catRows={catReport.expense}` ke LedgerTab.

**LedgerTab** (`src/components/report/LedgerTab.svelte`)
- Select Akun: opsi pertama `<option value="">Semua akun</option>`; hapus guard baris 17 yang memaksa akun terkaya (ganti: bila `accountId` bukan '' dan tidak ada di `accounts` → ''). 
- Kartu Awal/Mutasi/Akhir gabungan: awal = `totalBalanceBefore`, mutasi = Σ operating, akhir = awal + mutasi.
- Keterangan mode gabungan: `${description || namaKategori || 'Tanpa keterangan'} · ${namaAkun}` (contoh: "Gaji bulanan · Bank"). Mode per akun tetap seperti sekarang.
- Setiap `<tr>` mutasi bisa diklik (`role="button"`, `tabindex="0"`, `cursor-pointer`, Enter/Space, `aria-label="Detail …"`) → buka `TransactionDetail`. Baris "Saldo awal" tidak.
- Di bawah tabel, bila `accountId === ''` dan ada pengeluaran: Card dengan `SectionHeader` "Kategori terbesar" = 5 baris teratas `catRows` (nama, `formatCompact(amount)`, `%`), baris "Lainnya" bila > 5.
- Empty state payday: "Belum ada mutasi sejak gajian ini."

**TransactionDetail** (baru, `src/components/TransactionDetail.svelte`)
- Ekstrak isi sheet dari `TransactionList.svelte:201-223`: props `tx`, `accounts`, `categories`, `transactions` (untuk `pairAmount`), `open`, event `close`; `<slot name="actions" />` untuk Edit/Hapus milik TransactionList.
- Tambah `<dt>Keterangan</dt><dd>{tx.description || '-'}</dd>` sebagai field eksplisit. Judul sheet tetap `titleOf`.
- Biaya admin sintetis (`id` diawali `fee_`): Kategori '-', Keterangan "Biaya admin transfer".
- `TransactionList.svelte` memakai komponen ini tanpa perubahan perilaku. LedgerTab memakainya tanpa slot.

**EntryForm** (`src/components/EntryForm.svelte:191`)
- `{mode === 'transfer' ? 'DARI' : mode === 'income' ? 'KE AKUN' : 'DARI AKUN'}`.

Tidak ada perubahan skema DB, tidak ada dependency baru, warna hanya lewat token yang sudah ada.

## Urutan implementasi (TDD per langkah: tulis check/e2e → jalankan → RED → kode → GREEN)

0. **Read-only** hitung di hosted (Supabase MCP `execute_sql`, SELECT saja): jumlah income non-transfer berkategori nama ILIKE '%gaji%' vs income berdeskripsi 'gaji' tanpa kategori. Laporkan ke pemilik; bila 0, beri tahu bahwa gaji lama perlu diberi kategori lewat Edit agar picker terisi. Invoke `frontend-design:frontend-design` (pass singkat, konsisten dengan tabel/Card/Sheet/Chips yang ada). Tulis + commit spec `docs/superpowers/specs/2026-11-13-ledger-payday-design.md`. Invoke `superpowers:writing-plans`; tugas saling berbagi file (reports.ts, LedgerTab, Report) → implementasi inline.
1. **`src/lib/reports.check.ts`**: `paydayPeriods` (deteksi kategori Gaji case-insensitive; abaikan transfer & expense; urut terbaru dulu; dua gaji sehari = satu periode dengan amount dijumlah; `end`/`prevDay`; kosong tanpa kategori) + `periodRange({kind:'payday'}, paydays)` (start 00:00, end 00:00 gaji berikutnya, label, prev) + `totalBalanceBefore`. RED → implement, `ui.ts` re-export.
2. **`scripts/ledger.check.ts`**: `buildLedger(tx, '', opening)` gabungan (transfer tersembunyi, biaya admin masuk, invarian awal + Σ = total akhir) + tie-break income sebelum expense pada timestamp sama. RED → implement.
3. **e2e** (`scripts/e2e.mjs`):
   - Step 1 income: check label `KE AKUN` tampil di mode Masuk; klik chip "Gaji" di `#entry-category` sebelum simpan. Step 3 (Keluar): check `DARI AKUN`.
   - Blok Buku besar (sekitar baris 144-162): default select = "" (Semua akun); teks "Saldo awal" tampil; baris "Gaji bulanan · Bank" ada dan merupakan baris mutasi pertama; klik baris → `dialog` memuat "Keterangan" dan "Gaji bulanan"; Escape.
   - Chip "Gajian…" → dialog "Pilih gajian" ≥1 item → pilih → chip aktif /Gajian/; "Kategori terbesar" tampil; Akhir = `home-total` (periode berjalan).
   - Dengan periode gajian aktif: klik Arus kas, Kategori, Saldo akun, Buku besar, buka sheet CSV lalu tutup; `errors.length === 0`.
   RED (`npm run test:ui`, butuh `npm run dev` + Supabase lokal 553xx) → langkah 4-7 → GREEN.
4. `TransactionDetail.svelte` ekstrak + field Keterangan; `TransactionList` pakai komponen.
5. `LedgerTab` (Semua akun default, baris klik, ringkasan kategori) + `Report.svelte` (paydays, resolvePeriod, setPeriod, year/prevLabel/fileKey/tabRows/selectedMonth).
6. `PeriodPicker` chip Gajian… + Sheet + `value`.
7. `EntryForm` label.
8. Review order: `simplify` → re-run `npm run check` → `code-review` medium → `security-review` dilewati (tidak sentuh auth/DB/IO; dicatat) → `superpowers:verification-before-completion`.
9. Commit kecil per langkah (Conventional Commits, EN), mis. `feat(report): payday periods from Gaji income`, `feat(ledger): combined all-accounts ledger with stable ordering`, `feat(report): clickable ledger rows with transaction detail`, `fix(entry): income account label reads KE AKUN`. Jangan push tanpa diminta.

## Verifikasi

- `npm run check` hijau.
- `supabase status` port 553xx, `npm run dev` 5173, `.env.local` → 127.0.0.1:55321, lalu `npm run test:ui` hijau termasuk check baru.
- Manual di browser pane (data e2e): Laporan → Buku besar (Semua akun) → "Gajian…" → pilih: kartu Awal/Mutasi/Akhir, baris pertama "Gaji bulanan · Bank", klik → sheet dengan Keterangan; "Kategori terbesar" di bawah; ganti ke bulan dan ke akun tunggal → tampilan lama tetap bekerja. 375px tanpa overflow horizontal.
- Form Masuk "KE AKUN"; Keluar "DARI AKUN"; Transfer "DARI".
