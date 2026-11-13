# Insight periode gajian, alokasi, dan isian wajib — design (2026-11-13)

Status: menunggu persetujuan pemilik. Belum ada kode yang diubah.

## 1. Maksud

Pemilik ingin Home menjawab dua pertanyaan dengan benar: "gaji saya berapa" dan "uangnya ke mana". Data hosted per 13 Nov 2026 menunjukkan tiga hal yang menghalangi itu:

1. Insight Home memakai bulan kalender, padahal gaji (Rp 18.214.145) masuk 27 Okt. Di bulan November pemasukan hanya Rp 93.560, sehingga muncul "Pengeluaran melebihi pemasukan (2558% lebih besar)".
2. "Transfer Ke Istri ❤️" (Rp 8.500.000, 47% gaji) adalah kategori pengeluaran biasa, jadi tercampur dengan belanja.
3. Sekitar Rp 4,2 jt pengeluaran tidak punya kategori, termasuk Rp 2.807.000 tunai tanpa keterangan. Form tidak mewajibkan apa pun.

## 2. Tujuan, bukan tujuan, anti-tujuan

**Tujuan**
- Semua angka periode di Home mengikuti periode gajian yang sedang berjalan.
- Kategori bisa ditandai "alokasi" dan dipisahkan dari analisis belanja.
- Transaksi baru dan yang diedit wajib lengkap; transaksi lama yang belum lengkap mudah ditemukan.

**Bukan tujuan (tahap berikutnya, brainstorm terpisah)**
- Anggaran per kategori, tagihan rutin, rekonsiliasi saldo, target tabungan.
- Pengaturan tanggal gajian manual dan ambang nominal yang bisa diatur.
- Mengisi kategori transaksi lama secara otomatis.
- Mengubah angka Arus kas, Tren 12 bulan, Saldo akun, Buku besar, dan isi CSV.

**Anti-tujuan**
- Alokasi membuat rasio tabungan tampak lebih baik.
- Home menampilkan dua periode berbeda sekaligus.
- Transfer antar akun ikut diblokir aturan wajib.
- Kode yang ter-deploy rusak sebelum migrasi hosted dijalankan.
- Perintah tulis apa pun ke Supabase hosted.

## 3. Batasan

- Svelte 5 sintaks legacy, tanpa runes. Warna dan radius hanya lewat token; tidak ada hex di `.svelte`. Ukuran font hanya dari skala `docs/design-system.md` §3.1.
- Tidak ada dependency baru.
- Hosted hanya baca. Migrasi hosted dijalankan pemilik; dua migrasi lama (`2026-10-30-icon.sql`, `2026-11-02-archived.sql`) juga belum dijalankan.
- Perubahan skema ditulis di `supabase/schema.sql`, dijalankan di lokal lewat `psql` port 55322.
- TDD: check atau e2e ditulis dan terlihat gagal sebelum kode diubah.

## 4. Pendekatan

### 4.1 Periode di Home
| Pilihan | Untung | Rugi |
|---|---|---|
| **A. Seluruh Home ikut periode aktif** (dipilih) | Satu periode, angka saling cocok | Mengubah beberapa widget dan e2e |
| B. Hanya insight yang pindah, diberi label | Perubahan kecil | Insight dan angka di sebelahnya tidak cocok |
| C. Tombol bulan/gajian di Home | Fleksibel | UI baru; pemilik sudah memilih sudut pandang gajian |

### 4.2 Penyimpanan alokasi
| Pilihan | Untung | Rugi |
|---|---|---|
| **A. Kolom boolean `categories.allocation`** (dipilih) | Tidak menyentuh `type`; aman sebelum migrasi | Satu kolom baru |
| B. Tipe kategori ketiga `'allocation'` | Eksplisit | Merusak cek `cat.type === tx.type` di `store.ts:133` dan `:225`, mengubah check constraint |
| C. Dicatat sebagai transfer ke akun "Istri" | Murni secara akuntansi | Akun bayangan yang saldonya tumbuh terus; dompet istri tidak dilacak di sini |

### 4.3 Ketegasan "wajib"
| Pilihan | Untung | Rugi |
|---|---|---|
| **A. Blokir simpan** (dipilih; keputusan saya, pemilik menyerahkan pilihannya) | Data bersih sejak sekarang | Mencatat cepat butuh satu ketukan lagi |
| B. Simpan lalu tandai | Tidak menghambat | Tumpukan "nanti dilengkapi" |
| C. Blokir hanya nominal besar | Kompromi | Pengeluaran kecil tetap tak berkategori |

## 5. Desain

### 5.1 Periode aktif (`src/lib/reports.ts`)

```ts
export interface ActivePeriod {
  kind: 'payday' | 'month';
  start: Date;
  end: Date;          // eksklusif; gajian berjalan = new Date(8.64e15)
  expectedEnd: Date;  // dipakai proyeksi
  prev?: { start: Date; end: Date };
  label: string;      // "Gajian 27 Okt" | "November 2026"
  short: string;      // "27 Okt" | "Nov"; label ringkas untuk StatStrip dan kartu akun
  word: 'periode ini' | 'bulan ini';
  payday?: PaydayPeriod;
}
export function activePeriod(paydays: PaydayPeriod[], now: Date): ActivePeriod;
```

- Gajian terpilih = entri terbaru di `paydays` dengan `start <= now` (gaji bertanggal masa depan diabaikan).
- Ada gajian: `kind: 'payday'`, `start = p.start`, `end = p.end ?? new Date(8.64e15)`, `prev` = periode gajian sebelumnya bila ada, `label = p.label`, `word = 'periode ini'`.
- `expectedEnd` gajian = `p.end` bila ada. Bila belum ada, tanggal yang sama bulan berikutnya, dijepit ke akhir bulan (gaji tgl 31 → tgl terakhir bulan berikutnya).
- Tidak ada gajian: `kind: 'month'`, bulan kalender `now`, `expectedEnd = end`, `prev` = bulan sebelumnya, `word = 'bulan ini'`. Perilaku ini sama dengan sekarang.
- Turunan yang dipakai insight, lewat `periodDays(period, now): { elapsed: number; total: number; remaining: number }`: `elapsed = selisih hari(now, start) + 1` (minimal 1), `total = selisih hari(expectedEnd, start)`, `remaining = total - elapsed`.
- Batas yang diketahui:
  - Bila gaji bulan berikutnya tidak pernah dicatat, periode terus memanjang. Label tetap jujur ("Gajian 27 Okt") dan proyeksi hilang saat `remaining <= 0`.
  - Deteksi gajian tetap `/gaji/i` pada nama kategori pemasukan (`reports.ts:48`, keputusan pemilik di spec ledger-payday). Pemasukan lain di kategori yang namanya memuat "gaji" (bonus, THR) pada hari berbeda akan memulai periode baru di Home. Bonus dan THR sebaiknya dicatat di kategori tersendiri.

### 5.2 Home (`src/views/Home.svelte`)

Satu `period = activePeriod(paydayPeriods($transactions, $categories, now), now)` dipakai semua widget:

| Widget | Sekarang | Menjadi |
|---|---|---|
| Label di atas sapaan | "NOVEMBER 2026" | `period.label`; untuk gajian ditambah ` · gaji Rp 18,21 jt` (`formatCompact(payday.amount)`) |
| Pill delta saldo | "… bulan ini" | `balanceAt(period.start)`, teks `period.word` |
| Ringkasan Masuk/Keluar/Net | store `monthSummary` | `summarize(operating(tx) dalam periode)`; label StatStrip `period.short` |
| Statistik per akun (AccountRail) | `start`/`end` bulan; kartu berlabel bulan kalender (`AccountRail.svelte:17,20`) | `period.start`/`period.end`; label kartu `period.short` |
| Ketuk kartu akun (`AccountRail.svelte:13`) | buka Buku besar tanpa periode (bulan kalender) | gajian: buka Buku besar akun itu dengan `{ kind: 'range', from: hari gajian, to: hari ini }`, karena periode `payday` di Laporan berarti semua akun (`Report.svelte:55-57`). Bulan: seperti sekarang. |
| Kartu "Pengeluaran bulan ini" | bulan, semua kategori | periode; judul "Belanja periode ini" atau "Belanja bulan ini"; isi menurut §5.4 |
| "Semua →" | buka Laporan bulan ini | buka Laporan dengan `{ kind: 'payday', day }` bila gajian |
| Insight | bulan | §5.3 |
| Teks kosong (`Home.svelte:49`, `:53`) | "… bulan ini" | memakai `period.word` |
| Tren 12 bulan | bulan kalender | tidak berubah |

`monthSummary` di `store.ts:43` hanya dipakai Home; dihapus bila tidak ada pemakai lain.

### 5.3 Insight (`src/lib/insights.ts`)

Tanda tangan tetap `buildInsights(transactions, categories, now)`; periode dihitung di dalam lewat `activePeriod`. Angka memakai `operating()`, sama dengan ringkasan Masuk/Keluar di Home: transfer tidak ikut, biaya admin transfer ikut sebagai belanja tanpa kategori.

Dalam periode: `I` = pemasukan, `E` = semua pengeluaran, `A` = pengeluaran berkategori alokasi, `R = E − A` (belanja).

Urutan, maksimal **5** (sekarang 3):

| # | id | Syarat | Teks |
|---|---|---|---|
| 1 | `incomplete` | ada transaksi belum lengkap (§5.5), **sepanjang waktu**, bukan hanya periode ini | "**N transaksi** (Rp X) perlu dilengkapi. Buka Riwayat → Perlu dilengkapi." N sama dengan angka di chip Riwayat; X = jumlah nominal semua baris itu, pemasukan maupun pengeluaran. |
| 2 | `top-category` | `R > 0` | "**{nama}** adalah pengeluaran terbesar: Rp X (N% dari belanja)." Alokasi tidak ikut peringkat; "Tanpa kategori" ikut, sama dengan daftar di sebelahnya. |
| 3 | `allocation` | `A > 0` | "Alokasi **{nama}** Rp X (N% dari pemasukan)." Lebih dari satu kategori: "Alokasi (k kategori) Rp X …". Tanpa pemasukan: tanpa persen. |
| 4 | `savings-ratio` | `I > 0` | `ratio = (I − E) / I`. Rumus tidak berubah: `E` memuat alokasi, jadi alokasi tidak pernah dihitung sebagai tabungan. Teks memakai `period.word`. |
| 5 | `daily-average` | `R > 0` | `R / elapsedDays`. `remaining > 0`: "… Sisa N hari, proyeksi sampai gajian berikutnya Rp (rata-rata × totalDays)." (bulan: "proyeksi akhir bulan"). Selain itu tanpa proyeksi. |
| 6 | `vs-previous` | `prev` ada dan belanja pembanding > 0 | `R` dibanding belanja periode lalu pada **rentang hari yang sama** (`prev.start` sampai `prev.start + elapsedDays`). "Belanja naik/turun N% dibanding rentang yang sama gajian lalu." (bulan: "… bulan lalu"; 0%: "Belanja sama dengan rentang yang sama …") |
| 7 | `new-category` | `prev` ada | kategori belanja yang tidak muncul di periode lalu |

Regex nama `/istri/i` (`insights.ts:11`) dan teks "Tanggung jawab ke istri" dihapus; penanda alokasi yang menentukan.

Akibat batas 5 yang disengaja:

| Keadaan | Yang tampil | Yang tergeser |
|---|---|---|
| Masih ada transaksi belum lengkap | 1, 2, 3, 4, 5 | 6, 7 |
| Data sudah lengkap, dua gajian atau lebih | 2, 3, 4, 5, 6 | 7 |
| Tanpa alokasi | 2, 4, 5, 6, 7 | tidak ada |

Dengan data nyata sekarang hanya ada satu gajian, jadi `prev` kosong: insight 6 dan 7 tidak muncul, dan proyeksi memakai `expectedEnd` 27 Nov.

### 5.4 Alokasi

**Data**
- `supabase/schema.sql`: kolom `allocation boolean not null default false` di `categories`, ditambah `alter table categories add column if not exists allocation boolean not null default false;`.
- `supabase/migrations/2026-11-13-allocation.sql`: `alter` yang sama. Dijalankan di lokal; hosted oleh pemilik.
- `src/models/Category.ts`: `allocation?: boolean`.
- RLS tidak berubah; kolom ikut kebijakan `categories` yang ada.

**Aman sebelum migrasi hosted**
- `store.ts` mengekspor store `allocationSupported`, diisi saat `loadInitialData`: `true` bila baris kategori yang dimuat memiliki kunci `allocation`.
- `saveCategory`: bila didukung, selalu mengirim nilai boolean (termasuk `false`, supaya penanda bisa dimatikan). Bila tidak, kunci tidak dikirim.
- Toggle di Master disembunyikan selama tidak didukung. Tidak ada penyimpanan yang gagal.
- Bentuk baris yang dikirim ditentukan fungsi murni `categoryPayload(category, supported)` di `master.ts`, supaya bisa diuji tanpa Supabase.
- Login pertama (belum ada kategori): dukungan baru terdeteksi setelah muat ulang.

**Aturan**
- Hanya kategori pengeluaran yang bisa ditandai.
- Alokasi tetap uang keluar: saldo, Arus kas, Tren, Net, dan rasio tabungan tidak berubah.
- Alokasi dikeluarkan dari analisis belanja: peringkat kategori terbesar, rata-rata harian, proyeksi, perbandingan periode.
- Di daftar kategori, baris alokasi dipisah dari peringkat belanja: baris belanja diurutkan dan dipersentasekan terhadap `R` (belanja), baris alokasi ditaruh setelahnya tanpa persen dan tanpa batang. Dengan begitu daftar dan insight menyebut kategori terbesar yang sama.

**Pemakai yang berubah**
- `insights.ts` (§5.3).
- `categoryReport` (`reports.ts:174`): hanya menambah `CategoryRow.allocation: boolean` dan `split: { real: number; allocation: number }`. Urutan dan `percent` barisnya **tidak berubah**, karena hasil ini juga dipakai Arus kas (`CashflowTab.svelte:20-21`), "Kategori terbesar" di Buku besar, dan CSV.
- `spendingRows(report): { real: CategoryRow[]; allocation: CategoryRow[] }` (baru, `reports.ts`): baris belanja urut nominal dengan `percent` terhadap `split.real`, lalu baris alokasi dengan `percent = 0`. Hanya dipakai tab Kategori.
- `topCategories` (`dashboard.ts:72`): menerima kategori yang sudah membawa `allocation`; `top`, `rest`, dan `total` hanya memuat belanja; hasil menambah `allocation: CategorySlice[]` (satu per kategori alokasi, `percent = 0`).
- Tidak berubah: `monthlyTable`, `monthlyTrend`, `accountBalanceReport`, `ledger.ts`, dan ringkasan "Kategori terbesar" di tab Buku besar.

### 5.5 Isian wajib

Berkas baru `src/lib/entry-rules.ts` (fungsi murni, pola `master.ts`):

```ts
export const DESCRIPTION_REQUIRED_FROM = 500_000;
export function entryProblem(
  entry: Pick<Transaction, 'type' | 'amount'> & { id?: string; categoryId?: string; description?: string; transferId?: string },
  categories: Category[]
): { field: 'category' | 'description'; message: string } | null;
```

| Urutan | Kondisi | Hasil |
|---|---|---|
| 1 | transfer (`transferId`) atau baris biaya admin (`id` diawali `fee_`) | `null` |
| 2 | tanpa kategori, atau kategori tidak ditemukan | `category`: "Pilih kategori dulu." |
| 3 | pengeluaran, kategori bukan alokasi, nominal ≥ 500.000, keterangan kosong | `description`: "Isi keterangan untuk pengeluaran Rp 500 rb ke atas." |
| 4 | selain itu | `null` |

- Kategori wajib untuk pemasukan juga: deteksi gajian bergantung pada kategori "Gaji".
- Ditegakkan di `recordEntry` dan `updateEntry` (`store.ts`) dengan melempar pesan yang sama. Mengedit transaksi lama memaksa pelengkapan.
- Tidak ada constraint database: baris lama bernilai null dan hosted hanya baca.
- "Belum lengkap" = `entryProblem(tx, categories) !== null`. Aturan ini satu-satunya sumber untuk form, filter Riwayat, dan insight `incomplete`.

### 5.6 UI

Mengikuti komponen dan token yang ada; tidak ada bahasa visual baru.

**EntryForm** (`src/components/EntryForm.svelte`)
- Satu string `error` dengan cek `startsWith('Jumlah')` diganti objek error per field: `amount`, `category`, `description`, `destination`. Sekarang pesan selain "Jumlah" hanya tampil di blok transfer, sehingga tidak terlihat di mode Keluar.
- Pesan tampil tepat di bawah field-nya memakai pola yang ada: `mt-1.5 text-[11.5px] leading-[1.4] text-accent`, `role="alert"`.
- Field keterangan invalid: `border-accent`, `aria-invalid`, `aria-describedby`. Grup chip kategori: `role="group"` dengan `aria-describedby` ke pesan.
- `entryProblem` dipanggil sebelum simpan, kecuali di mode Transfer; `''` dihitung tanpa kategori. Pesan dari store tetap muncul sebagai toast bila lolos dari form.
- Tidak ada kategori untuk mode itu: teks "Belum ada kategori. Tambah di Master." di tempat chip.

```
KATEGORI
[ Makanan ] [ Transport ] [ Listrik/Air ]
Pilih kategori dulu.

TANGGAL              KETERANGAN
[ Hari ini, 13 Nov ] [               ]
                     Isi keterangan untuk pengeluaran Rp 500 rb ke atas.
```

**MasterSheet** (`src/components/MasterSheet.svelte`)
- Untuk kategori pengeluaran dan `$allocationSupported`: label "Dihitung sebagai" dengan `Segmented` dua pilihan, **Belanja** dan **Alokasi**.
- Keterangan di bawahnya (`text-[11.5px] text-ink2`): "Alokasi tetap tercatat sebagai uang keluar, tetapi tidak ikut dihitung sebagai belanja."
- Tetap bisa diubah walau kategori sudah dipakai (yang terkunci hanya Jenis).

**Tanda alokasi**
- `CategoryManager`: subtitle yang ada digabung, "Alokasi · {subtitle lama}".
- Kartu belanja di Home: baris belanja seperti sekarang (persen dan batang terhadap belanja), lalu baris alokasi dengan `subtitle="Alokasi"`, tanpa `percent`.
- `CategoryTab`: baris alokasi di bawah baris belanja, `Pill` varian `neutral` berisi "Alokasi" setelah nama, kolom persen "—"; persen baris Total juga "—" bila ada alokasi (sekarang selalu 100). Bila ada alokasi, satu baris `text-[11.5px] text-ink2` di bawah Total: "Belanja Rp X · Alokasi Rp Y".

**Riwayat** (`src/components/TransactionList.svelte`, `src/lib/history.ts`)
- Chip filter kelima "Perlu dilengkapi (N)". N dihitung **sepanjang waktu** dan chip tampil bila N > 0, apa pun rentang yang sedang dipilih.
- Saat chip ini aktif, rentang waktu diabaikan dan tombol rentang tampil nonaktif (`opacity-50`, `disabled`); filter akun dan pencarian tetap berlaku. Pengabaian rentang ada di `TransactionList.svelte` dan diuji lewat e2e.
- `filterHistory` menerima filter `'incomplete'` dan daftar kategori.
- Mengetuk baris membuka detail lalu Edit seperti biasa; form menolak simpan sampai lengkap.

## 6. Tes

- `src/lib/reports.check.ts`: `activePeriod` (gajian berjalan, gaji masa depan diabaikan, tanpa gajian → bulan, `expectedEnd` dijepit akhir bulan, `prev`); `categoryReport` dengan alokasi (`split`, total tetap).
- `src/lib/insights.check.ts`: ditulis ulang. Wajib ada regresi kasus nyata: gaji 27 Okt, pengeluaran November, `now` 13 Nov → tidak ada "melebihi pemasukan". Juga: alokasi tidak mengubah rasio, alokasi keluar dari peringkat, `incomplete` dihitung sepanjang waktu, satu gajian tanpa `prev`, fallback bulan, maksimal 5 dan ketiga keadaan di tabel batas.
- `src/lib/entry-rules.check.ts` (baru, ditambahkan ke skrip `check` di `package.json`): keempat baris tabel §5.5 dan batas 499.999/500.000.
- `src/lib/history.check.ts`: filter `incomplete`.
- `src/lib/master.check.ts`: `categoryPayload` dengan dan tanpa dukungan kolom.
- `src/lib/dashboard.check.ts`: `topCategories` memisahkan alokasi dari peringkat dan total.
- `scripts/e2e.mjs`:
  - Langkah 3 (`:107-111`) menyimpan pengeluaran tanpa kategori; ia akan merah dan harus memilih chip lebih dulu. Langkah 3b tidak, karena form mempertahankan kategori setelah simpan. Cek di `:187-189` mencari baris "Tanpa kategori" dan ikut berubah.
  - Baris lama yang belum lengkap tidak bisa lagi dibuat lewat UI; e2e menyisipkannya lewat `psql` di blok paling akhir, supaya angka total yang sudah dipatok tidak bergeser.
  - Baru: simpan tanpa kategori ditolak dengan pesan; ≥ 500 rb tanpa keterangan ditolak; label Home memuat "Gajian"; jumlah insight 1–5 (sekarang 1–3 di baris 417); toggle Alokasi di Master; chip "Perlu dilengkapi".
- Verifikasi akhir: `npm run check`, `npm run build`, `npm run test:ui` terhadap Supabase lokal (553xx), cek 375px dan dark mode.

## 7. Urutan rilis ke hosted

1. Deploy kode. Aman tanpa migrasi: toggle alokasi tersembunyi, sisanya berjalan.
2. Pemilik menjalankan `2026-11-13-allocation.sql` di hosted.
3. Pemilik menandai "Transfer Ke Istri ❤️" sebagai Alokasi di Master.
4. Pemilik melengkapi transaksi lama lewat Riwayat → Perlu dilengkapi.

## 8. Keputusan saya (bisa dikoreksi)

- Pilihan A untuk "wajib"; kategori wajib juga untuk pemasukan.
- Ambang keterangan Rp 500.000, konstanta di kode; alokasi dikecualikan.
- Seluruh Home pindah ke periode gajian; Tren 12 bulan tetap bulan kalender.
- Batas insight naik dari 3 ke 5, supaya perbandingan periode tetap bisa tampil.
- Jumlah "perlu dilengkapi" dihitung sepanjang waktu, sama di insight dan di chip Riwayat; chip mengabaikan rentang.
- Di daftar kategori, alokasi dipisah dari peringkat dan persentase belanja.
- Kartu akun di Home membuka Buku besar dengan periode yang sama.
- Deteksi gajian tidak diubah; bonus dan THR di kategori ber-"gaji" akan memulai periode baru.
- Insight memakai `operating()`, jadi biaya admin transfer ikut dihitung dan angkanya cocok dengan ringkasan Home.
- Urutan dan persen `categoryReport` tidak diubah; pemisahan alokasi untuk tab Kategori lewat `spendingRows`.
- Form tetap mempertahankan kategori setelah simpan (perilaku sekarang).
- Teks "Tanggung jawab ke istri" diganti teks alokasi umum.
- Perbandingan periode memakai rentang hari yang sama, bukan periode lalu penuh.
- Toggle alokasi disembunyikan sampai kolomnya ada.

## 9. Diserahkan ke pembangun

- Markup Svelte dan nama helper internal.
- Selector e2e.
- Cara `filterHistory` menerima daftar kategori.
