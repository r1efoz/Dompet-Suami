# Design Spec — Revamp Dompet Suami

Versi: 1.0 (2026-10-30). Disetujui pemilik repo (Arief) berdasarkan mockup `docs/design/mockup-v4.html`. Token dan komponen: `docs/design-system.md` (DS). Rencana kerja: `docs/plans/2026-10-30-revamp-ui.md`.

Cara membaca: tiap layar ditulis **dari atas ke bawah**, persis urutan render. Tiap blok menyebut komponen DS yang dipakai, data + rumus, teks persis (copy), state kosong, dan kriteria terima. Jika mockup dan teks di sini berbeda, **teks di sini menang** (mockup punya angka dummy).

---

## 0. Ruang lingkup

**Masuk:**
- Shell baru: bottom nav (mobile), top nav (desktop), FAB.
- 4 layar ditata ulang: Home, Transaksi, Laporan, Master.
- Laporan baru: Arus kas, Kategori, Saldo akun (pengganti "Neraca"), Buku besar.
- Insight otomatis di Home (rumus lokal, tanpa server/LLM).
- Ikon emoji untuk akun & kategori (kolom baru `icon`).
- PWA: manifest, ikon PNG, service worker, logo baru.
- Hapus footer "Data tersimpan di Supabase cloud…".
- Perbaikan bug: bulan di `monthlyTrend` meleset di zona WIB; hapus akun tidak menulis ke DB; style input Master tidak seragam.

**Tidak masuk (jangan dikerjakan):**
- Autentikasi, multi-user, sinkron offline dua arah.
- Budget/anggaran per kategori (hanya "target rasio tabungan" konstanta 20%).
- Toggle dark mode manual.
- Library chart/UI baru.
- Perubahan skema selain kolom `icon`.
- Migrasi ke runes Svelte 5.

**Anti-tujuan (dianggap gagal walau jalan):**
- UI berwarna-warni/ungu/biru, gradien, glassmorphism.
- Komponen yang hanya muncul di desktop atau hanya di mobile (kecuali nav & FAB).
- Teks < 11px, nominal tanpa font mono.
- Permintaan ke API apa pun selain Supabase.

---

## 1. Shell aplikasi (`App.svelte`)

### 1.1 Struktur

```
<div class="min-h-dvh bg-paper text-ink">
  <TopNav/>            ← hanya ≥1024px (lg:)
  <OfflineBanner/>     ← hanya saat navigator.onLine === false
  <main class="mx-auto max-w-[1180px] px-4 pt-3 pb-[92px] lg:px-7 lg:pt-7 lg:pb-14">
    {view}
  </main>
  <Fab/>               ← hanya <1024px, dan view ∈ {home, report}
  <BottomNav/>         ← hanya <1024px
</div>
```

- `currentView` tetap state lokal `'home'|'transaction'|'report'|'master'`. **Urutan nav baru:** Home, Transaksi, Laporan, Master (Master pindah ke akhir).
- Footer dihapus seluruhnya. Teks "buku kas" di header dihapus.
- `loadInitialData()` tetap dipanggil di `onMount`, **dengan dua perbaikan** (Tugas 3): (a) jika salah satu `select` mengembalikan `error`, lempar `new Error(error.message)` — supabase-js tidak melempar sendiri; (b) seeding `DEFAULT_ACCOUNTS/CATEGORIES` hanya dilakukan bila `error` null **dan** `data.length === 0`, tidak pernah saat load gagal (kode sekarang bisa meng-insert default ke DB saat jaringan putus). Saat memuat, tampilkan skeleton (lihat §1.3). Jika gagal: banner `bg-accent-soft text-accent body-sm rounded-card p-3 mt-3` dengan teks `"Gagal memuat data. Periksa koneksi lalu muat ulang."` dan tombol `ghost` kecil "Coba lagi" yang memanggil `loadInitialData()` lagi.
- Navigasi antar view **tanpa** router library, tetap `{#if}` seperti sekarang. Tambahkan store `currentView` di `src/lib/ui.ts` (writable) agar FAB, kartu akun, dan link "Semua →" bisa berpindah view dari komponen mana pun. Store lain di file yang sama: `reportState = writable<{tab: 'cashflow'|'category'|'balance'|'ledger', accountId?: string, period?: Period}>` (tipe `Period` dari §4.2) untuk deep-link dari Home ke Laporan; `selectedTxId = writable<string|null>` untuk membuka sheet detail transaksi dari Home; `isDesktop = readable<boolean>` dari `matchMedia('(min-width:1024px)')` (dengarkan `change`).

### 1.2 Breakpoint

Hanya dua: **mobile** (< 1024px) dan **desktop** (≥ 1024px, prefix Tailwind `lg:`). `sm:` dan `md:` **tidak dipakai** di layout layar; boleh dipakai hanya untuk 2 kolom form di ≥640px (`sm:grid-cols-2`) yang disebut eksplisit di bawah.

### 1.3 Skeleton saat memuat

Tiap layar menampilkan placeholder `bg-chip rounded-card animate-pulse` dengan tinggi mendekati komponen aslinya (hero 60px, rail 150px, strip 72px, kartu daftar 240px). Tidak ada spinner. Durasi tidak dibatasi; hilang saat `loadInitialData` selesai. Tambahkan store `loading = writable(true)` di `store.ts`, di-set `false` di akhir `loadInitialData` (baik sukses maupun gagal).

### 1.4 Toast

Satu komponen `Toast.svelte` global di `App.svelte`, store `toast = writable<{text, kind:'ok'|'err'}|null>` di `src/lib/ui.ts`. Tampil `fixed left-4 right-4 bottom-[100px] lg:left-auto lg:right-7 lg:bottom-7 lg:w-[360px]`, `bg-ink text-on-ink rounded-card px-4 py-3 body-sm`, kind `err` → `bg-accent text-on-accent`. Hilang otomatis 2,5 detik. Mengganti pesan sukses/error inline di `EntryForm` (pesan **validasi** field tetap inline di bawah field).

---

## 2. Home

Komponen file: `src/views/Home.svelte` (menggantikan `Dashboard.svelte`; hapus `Dashboard.svelte`). Logika murni di `src/lib/dashboard.ts` (dirombak) dan `src/lib/insights.ts` (baru).

Semua "bulan ini" = kalender bulan berjalan **zona waktu lokal perangkat** (`new Date(y, m, 1)` lokal), bukan UTC. Transfer (`tx.transferId` terisi) **tidak dihitung** sebagai income/expense di Home, kecuali untuk saldo akun.

### 2.1 Header

```
[label] OKTOBER 2026                     [avatar: logo 26px dalam lingkaran 40px bg-accent-soft]
[title] Halo, Pak Arief
```

- Label bulan: `toLocaleDateString('id-ID', {month:'long', year:'numeric'})` → uppercase via class `label`.
- Nama: konstanta `APP_OWNER_NAME = 'Pak Arief'` di `src/lib/ui.ts`. Tidak ada input nama (YAGNI).
- Avatar tidak bisa diketuk.

### 2.2 Total semua akun

```
[label] TOTAL SEMUA AKUN
[display .num] Rp 6.056.991   [Pill pos/neg] ▲ 6,06 jt bulan ini
```

- Total = `Σ balances` (dari `totalBalance` store, termasuk transfer).
- Delta bulan ini = total sekarang − total pada **awal bulan** (saldo dari semua tx dengan `timestamp < startOfMonth`). Positif → `Pill pos` `▲ {formatCompact}`; negatif → `Pill neg` `▼ {formatCompact}`; nol → pill tidak ditampilkan.
- Pill berada di baris yang sama jika muat, boleh turun ke baris berikutnya (flex-wrap). Mobile: `display`; desktop: `display-lg`.
- Desktop: baris ini `flex justify-between items-end`, kanan ada legenda ringkas `caption-xs text-ink2`: `■ Masuk 18,34 jt · ■ Keluar 12,28 jt · Net +6,06 jt` (kotak hijau/oranye 10px).

### 2.3 Carousel kartu akun (`AccountRail`)

- Lihat DS §5.3–5.4. Urutan: saldo terbesar → terkecil. Tone: ke-1 `ink`, ke-2 `accent`, sisanya `card`.
- Per kartu: `incomeThisMonth` = Σ tx income bulan ini dengan `source = account.id` (**termasuk** transfer masuk), `expenseThisMonth` = Σ tx expense bulan ini `source = account.id` (**termasuk** transfer keluar + biaya), `txCountThisMonth` = jumlah tx bulan ini `source = account.id`. Label kanan footer: `"{bulan singkat}"` di atas, `"{n} trx"` di bawah.
- Kartu `add`: baris ke-3 `"{n} akun kosong disembunyikan"` jika n > 0; ketuk → `currentView.set('master')` (tab Sumber dana adalah default Master; sheet tidak dibuka otomatis).
- Ketuk kartu akun → `currentView = 'report'`, `reportState = {tab:'ledger', accountId}`.
- Desktop: grid 4 kolom, tanpa dots, kartu `add` **tidak** ditampilkan (ada tombol di Master). Jika akun aktif > 4 → baris kedua.

### 2.4 Strip statistik (`StatStrip`)

`MASUK · OKT | KELUAR · OKT | NET · OKT` dari `monthSummary` (sudah mengecualikan transfer). Desktop: strip ini **tidak** ditampilkan (sudah ada di legenda §2.2).

### 2.5 Insight

`SectionHeader title="Insight"` (tanpa aksi) + `Card dense` berisi 1–3 baris. Tiap baris: titik 8px (`bg-accent` atau `bg-pos`) + teks `body-sm leading-[1.45]`, bagian tebal `font-semibold`. Pemisah `border-b border-line`, `py-2.5`.

Fungsi `buildInsights(transactions, categories, now): Insight[]` di `src/lib/insights.ts`:

```ts
export interface Insight {
  id: 'top-category' | 'savings-ratio' | 'daily-average' | 'vs-last-month' | 'new-category';
  tone: 'neg' | 'pos' | 'neutral';
  segments: Array<{ t: string; b?: boolean }>; // b = true → dirender <b>
}
export function insightText(i: Insight): string // gabungan segments.t, dipakai check untuk "teks persis"
```

Komponen merender `{#each segments}` → `<b>` jika `b`, selain itu teks biasa. Tidak ada `{@html}`.

Variabel:
- `E` = Σ expense bulan ini (non-transfer), `I` = Σ income bulan ini (non-transfer).
- `dayOfMonth` = `now.getDate()`, `daysInMonth` = `new Date(y, m+1, 0).getDate()`.
- `byCat` = map categoryId → Σ expense bulan ini; `topCat` = entri terbesar.

Aturan, **urutan prioritas tetap**, ambil maksimal 3 yang lolos syarat:

| # | Syarat tampil | Teks persis (segmen tebal dalam `**`) | Tone |
|---|---|---|---|
| 1 | `E > 0` dan `topCat` ada | `**{namaKategori}** adalah pengeluaran terbesar: {formatIDRCompactRp} ({pct}% dari total keluar).` — `pct = round(topCat/E*100)`; `formatIDRCompactRp` = `"Rp " + formatCompact(v)` | neg |
| 2 | `I > 0` | `Rasio tabungan bulan ini **{r}%** — {r >= 20 ? 'di atas' : 'di bawah'} target 20%.` — `r = round((I−E)/I*100)` (perbandingan memakai `r` yang **sudah dibulatkan**); jika `r < 0` teks jadi `Pengeluaran melebihi pemasukan bulan ini (**{abs r}%** lebih besar).` | pos jika r ≥ 20, neg jika < 20 |
| 3 | `E > 0` | `Rata-rata pengeluaran harian **{formatIDRCompactRp(avg)}**. Sisa {sisa} hari, proyeksi akhir bulan {formatIDRCompactRp(proj)}.` — `avg = E / dayOfMonth` (hari ke-1 → bagi 1), `sisa = daysInMonth − dayOfMonth`, `proj = avg × daysInMonth`. Jika `sisa === 0` → `Rata-rata pengeluaran harian **{…}** sepanjang bulan ini.` | neutral (titik `bg-ink2`) |
| 4 | ada bulan lalu dengan `E_prev > 0` | `Pengeluaran {E > E_prev ? 'naik' : 'turun'} **{pct}%** dibanding {namaBulanLalu}.` — `pct = round(abs(E−E_prev)/E_prev*100)`; jika `pct === 0` → `Pengeluaran **sama** dengan {namaBulanLalu}.` | neg jika naik, pos jika turun |
| 5 | kategori expense dengan Σ bulan ini > 0 tapi Σ bulan lalu = 0 (ambil terbesar) | `Kategori baru bulan ini: **{nama}** {formatIDRCompactRp}.` | neutral |

Kosong (tidak ada yang lolos, biasanya belum ada transaksi bulan ini): kartu tetap tampil dengan satu baris `body-sm text-ink2` `"Belum ada transaksi bulan ini. Catat yang pertama lewat tombol +."`

Catatan:
- Format `pct`/`r`: bilangan bulat, tanpa desimal. `formatCompact` memakai koma desimal (lihat DS §3.2).
- Batas 3 memang membuat #4 dan #5 jarang tampil (hanya saat #1–#3 tidak lolos, misal awal bulan tanpa pengeluaran). Itu disengaja; jangan menaikkan batas.
- Jika pengeluaran terbesar adalah transaksi tanpa kategori, `namaKategori` = `"Tanpa kategori"`.
- `now` selalu parameter eksplisit (default `new Date()` di pemanggil) agar check deterministik.

### 2.6 Tren 12 bulan

`SectionHeader title="Tren 12 bulan" actionLabel="Detail →"` (aksi → `currentView='report'`, `reportState={tab:'cashflow', period:{kind:'year', y: now.getFullYear()}}`) + `Card` berisi `BarChart` (DS §5.17).

Data: `monthlyTrend(transactions, months = 12, now = new Date())` dari `dashboard.ts` **setelah diperbaiki** (parameter `now` ditambahkan): kunci bulan dibuat dari `d.getFullYear()` dan `d.getMonth()+1` dengan padding (`YYYY-MM`), **bukan** `toISOString()` (yang menggeser bulan di zona WIB; bug ini hanya tampak saat `TZ=Asia/Jakarta`, maka check dijalankan di TZ itu). Label sumbu: `['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m]`.

Fungsi pendamping di `dashboard.ts` (bentuk return tetap):

```ts
export function balanceAt(accounts: Account[], tx: Transaction[], before: Date): number
// Σ saldo semua akun dari tx dengan new Date(timestamp) < before (termasuk transfer)

export interface AccountMonthStat { id: string; balance: number; income: number; expense: number; count: number }
export function accountMonthStats(accounts: Account[], tx: Transaction[], start: Date, end: Date): AccountMonthStat[]
// income/expense/count hanya tx dengan source = id dan start ≤ timestamp < end (termasuk transfer); balance = saldo total akun (semua waktu)

export interface CategorySlice { id: string | null; name: string; icon: string; value: number; percent: number }
export function topCategories(tx: Transaction[], categories: Category[], limit: number): { top: CategorySlice[]; rest: CategorySlice | null; total: number }
// tx = expense non-transfer dalam periode (sudah difilter pemanggil); id null = "Tanpa kategori"; rest = gabungan sisa (name "{n} kategori lain", icon "⋯") atau null jika tidak ada sisa
```

### 2.7 Pengeluaran bulan ini

`SectionHeader title="Pengeluaran bulan ini" actionLabel="Semua →"` (→ Laporan tab Kategori, periode bulan ini) + `Card dense` berisi `ListItem` dengan `percent`.

- Sumber: `byCat` §2.5, diurutkan menurun, **top 5**. Jika kategori > 5, baris ke-6 `ikon ⋯`, judul `"{n} kategori lain"`, nilai = Σ sisanya.
- Ikon = `category.icon ?? default` (DS §5.19). Transaksi expense **tanpa kategori** dikelompokkan sebagai `"Tanpa kategori"` ikon `🧾`.
- Nominal `formatCompact` + sub-nominal `"{pct}%"`. Bar `percent = v / E * 100`.
- Kosong: `"Belum ada pengeluaran bulan ini."` `body-sm text-ink2 italic`.

### 2.8 Transaksi terbaru

`SectionHeader title="Transaksi terbaru" actionLabel="Riwayat →"` (→ `currentView='transaction'`) + `Card dense`, **5** transaksi terakhir (urut `timestamp` desc, lalu `id` desc untuk stabil). Transfer ditampilkan **satu baris per pasangan** (ambil sisi `expense`), judul `"{akunAsal} → {akunTujuan}"`, sub `"{tanggal} · Transfer · biaya {fee}"` (bagian biaya hanya jika fee > 0), nominal `text-ink2` tanpa tanda = nominal yang **sampai** (sisi income).

Baris non-transfer: ikon kategori; judul = `description` atau, jika kosong, nama kategori, atau `"Tanpa keterangan"`; sub `"{d MMM} · {namaAkun} · {namaKategori}"` (bagian kategori dihilangkan jika tidak ada).

Ketuk baris → `selectedTxId.set(tx.id)` lalu `currentView.set('transaction')`; `TransactionList` membuka sheet detail saat `selectedTxId` terisi dan mengosongkannya saat sheet ditutup (§3.4).

Elemen total di §2.2 wajib `data-testid="home-total"` dan `data-value="{total}"` (angka penuh) — dipakai e2e Laporan.

Desktop: section ini jadi **tabel** `c12` kolom `Tanggal | Keterangan | Kategori | Akun | Jumlah` (header `label`), 5 baris, bukan `ListItem`.

### 2.9 Grid desktop (≥1024px), urutan sel

```
row1: [c12] header total + legenda
row2: [c12] rail 4 kolom
row3: [c8]  Tren 12 bulan        [c4] Insight
row4: [c4]  Pengeluaran bln ini  [c8] (kosong → biarkan Pengeluaran c4, Transaksi terbaru c8 di row4)
```

Final: row4 = `[c4] Pengeluaran bulan ini` + `[c8] Transaksi terbaru (tabel)`. Sapaan "Halo, Pak Arief" dan label bulan tetap tampil di atas row1 sebagai `title` kiri (avatar tidak ditampilkan di desktop).

### 2.10 Kriteria terima Home

- [ ] Di 375px tidak ada scroll horizontal halaman; hanya rail dan chips yang scroll horizontal.
- [ ] Rail snap per kartu; dots mengikuti kartu terlihat.
- [ ] Angka total = Σ saldo semua akun (cek dengan Laporan → Saldo akun → Total akhir).
- [ ] Insight tidak pernah lebih dari 3 baris; tidak error saat 0 transaksi; tidak menampilkan `NaN`/`Infinity`.
- [ ] Tren menampilkan 12 label bulan, bulan berjalan paling kanan dan tebal; bulan yang benar untuk zona WIB (buat tx tanggal 1 pukul 00:30 lokal → masuk bulan itu).
- [ ] Tidak ada kata "Supabase" di DOM.
- [ ] Dark mode: semua teks terbaca, kartu `ink` tetap kontras.

---

## 3. Transaksi

File: `src/views/Transaction.svelte` berisi `EntryForm.svelte` (dirombak) dan `TransactionList.svelte` (dirombak). Logika form tetap memakai `recordEntry / recordTransfer / updateEntry / updateTransfer / deleteTransaction` dari `store.ts`. Satu-satunya perubahan tanda tangan yang diizinkan: parameter opsional `timestamp` pada `recordTransfer` (§3.3 butir 6).

### 3.1 Header

`[title] Catat transaksi, Pak` (saat mode edit: `Ubah transaksi`).

### 3.2 Segmented mode

`Segmented` `aria-label="Jenis transaksi"`, item **urutan baru**: `Keluar` (`expense`, default), `Masuk` (`income`), `Transfer`. Ganti mode = reset field seperti `switchMode` sekarang.

> Catatan e2e: `scripts/e2e.mjs` mengklik tab `"Transfer"`/`"Pengeluaran"` dan tombol `"Simpan pemasukan"`. Label tab baru `Keluar/Masuk/Transfer`, label tombol tetap `Simpan pemasukan / Simpan pengeluaran / Pindahkan dana`. e2e harus diperbarui di tugas yang sama.

### 3.3 Form

Urutan field (atas ke bawah):

1. **Jumlah** — `Card` `text-center py-[22px]`: `label` "JUMLAH", di bawahnya input `type=text inputmode=numeric` tanpa border, `display-lg`-ish: `text-[36px] font-semibold .num tracking-[-0.03em] bg-transparent text-center w-full outline-none`, prefiks `Rp` `text-[18px] text-ink2` di kiri angka (span absolut atau flex). Placeholder `0`. Format ribuan titik saat mengetik (logika `formatInput` yang ada). `id="entry-amount"` dipertahankan untuk e2e. Invalid → teks `caption text-accent` di bawah kartu: `"Jumlah harus lebih besar dari nol."`
2. **Kategori** (mode Keluar/Masuk saja) — `label` "KATEGORI" + `Chips` berisi kategori sesuai `type` mode, ikon + nama, urut: paling sering dipakai 90 hari terakhir dulu, lalu alfabet. Chip terakhir `+` → sheet tambah kategori (§5.4) dengan `type` terisi; setelah simpan, chip baru langsung terpilih. Boleh tanpa kategori (tidak ada chip terpilih). `id="entry-category"` dipasang pada wadah chips (hidden input `name=categoryId` menyimpan nilai).
3. **Dari akun** (label `DARI AKUN`; mode Transfer: `DARI`) — `Select` akun, kanan menampilkan saldo `formatIDR`. `id="entry-source"`.
4. **Ke** (Transfer saja) — `Select` akun, `id="entry-destination"`. Validasi: tujuan ≠ asal → `"Akun tujuan harus berbeda."`
5. **Biaya admin** (Transfer saja) — field angka kecil `Field` dengan prefiks Rp, `id="entry-fee"`, default kosong = 0.
6. Grid 2 kolom (`grid-cols-2 gap-2.5`): **Tanggal** — pola overlay seperti `Select` (DS §5.9): `div.field` menampilkan teks `"Hari ini, 30 Okt"` jika = hari ini, `"Kemarin, 29 Okt"` jika kemarin, selain itu `"Sen, 27 Okt"`; di atasnya `<input type=date id="entry-date" class="absolute inset-0 opacity-0 w-full h-full">` yang tetap menerima `fill()` dari e2e. Berlaku untuk **semua mode termasuk Transfer**: `recordTransfer(from, to, amount, fee, timestamp?: string)` mendapat parameter opsional ke-5 (perluasan tanda tangan yang tidak memutus pemanggil lama; default `new Date().toISOString()`). **Keterangan** `Field` text `id="entry-description"`, placeholder: Keluar `"Beli LPG"`, Masuk `"Gaji bulanan"`, Transfer `"Tarik tunai ATM"`.
7. **Tombol** `Button primary` teks: `Simpan pengeluaran` / `Simpan pemasukan` / `Pindahkan dana`; mode edit: `Simpan perubahan` + `Button ghost` "Batal" di bawahnya (full width, `mt-2`).

Setelah simpan sukses: toast `"Pengeluaran dicatat."` / `"Pemasukan dicatat."` / `"Transfer dicatat."` / `"Perubahan disimpan."`; field jumlah, keterangan, biaya dikosongkan; kategori, akun, tanggal **dipertahankan** (memudahkan input beruntun). Gagal: toast `err` dengan `error.message`.

Biaya transfer pada mode edit tetap dibaca dari deskripsi dengan regex `/\(biaya Rp\s*([\d.]+)\)/` yang sudah ada di `EntryForm.svelte` — **jangan** menambah kolom DB.

Desktop: form dalam `Card` `max-w-[560px]`; grid dua kolom `lg:grid-cols-[560px_1fr] gap-7` dengan riwayat di kanan.

### 3.4 Riwayat

- `SectionHeader title="Riwayat"` dengan kanan `caption text-ink2` `"{n} entri"` (n = jumlah **setelah** filter; pasangan transfer dihitung 1).
- Kotak cari `Field` `h-10` placeholder `"Cari keterangan…"`, ikon 🔍 teks. Filter `includes` case-insensitive pada `description`, nama kategori, nama akun.
- `Chips` filter `aria-label="Filter transaksi"`: `Semua | Keluar | Masuk | Transfer` + chip periode `"Bulan ini ▾"` (opsi: Bulan ini, Bulan lalu, 3 bulan, Semua) → ketuk membuka `Sheet` berisi 4 `ListItem` pilihan. Default `Bulan ini`.
- Daftar dikelompokkan **per hari**: header grup `flex justify-between caption text-ink2 mt-4 mb-1`: kiri `"Kamis, 30 Okt"` (`weekday:'long', day:'numeric', month:'short'`), kanan `.num` subtotal hari = Σ income − Σ expense **non-transfer** pada hari itu, dengan tanda (`+`/`−`), `0` jika hanya transfer. Isi grup `Card dense` berisi `ListItem` (format baris sama §2.8). Transfer satu baris per pasangan.
- Hari ini dan kemarin: header `"Hari ini, 30 Okt"`, `"Kemarin, 29 Okt"`.
- Batas tampil 50 baris; jika lebih, tombol `ghost` full width `"Tampilkan 50 lagi"`.
- Kosong (setelah filter): `Card` tengah `py-10`: `body` `"Belum ada transaksi."` + `caption text-ink2 mt-1` `"Isi formulir di atas untuk mulai."` (jika filter/cari aktif: `"Tidak ada yang cocok."` + `"Ubah filter atau kata kunci."`).
- `id="ledger-heading"` dipertahankan pada `h3` Riwayat (e2e).

**Sheet detail** (ketuk baris): header `[ikon 44px] [judul h3-16px + tanggal lengkap caption, format "Kamis, 30 Okt 2026"] [nominal 18px .num]`; tabel 2 kolom `body-sm` baris: Akun, Kategori (atau `Ke` + `Biaya` untuk transfer). **Tidak ada baris jam/“Dicatat”** (form selalu menyimpan 12:00, jadi jam tidak bermakna). Tombol grid 2: `Button ink` "Edit" → tutup sheet, isi form (set `editingTransaction`), scroll ke atas, fokus jumlah; `Button soft-danger` "Hapus" → **tutup sheet detail dulu**, lalu buka `ConfirmDialog` (hanya satu `role="dialog"` pada satu waktu) judul `"Hapus transaksi?"`, deskripsi `"Transaksi ini akan dihapus permanen."` / transfer: `"Kedua catatan transfer akan dihapus."`, tombol `Batal` / `Hapus permanen`. Batal → kembali ke daftar (tidak membuka ulang detail). Sukses → toast `"Transaksi dihapus."`. Untuk transfer, Edit hanya dari sisi expense (perilaku lama dipertahankan di `updateTransfer`).

### 3.5 Kriteria terima Transaksi

- [ ] `npm run test:ui` (setelah e2e diperbarui) hijau: alur income → transfer → expense menghasilkan saldo bank 4.000.000 dan tunai 750.000.
- [ ] Mode default Keluar; ganti mode tidak menyisakan nilai lama.
- [ ] Chip kategori hanya menampilkan kategori sesuai mode.
- [ ] Transfer ke akun yang sama ditolak dengan pesan.
- [ ] Riwayat per hari, subtotal benar (transfer tidak masuk subtotal).
- [ ] Hapus lewat sheet → konfirmasi → baris hilang tanpa reload.
- [ ] Tidak ada `confirm()`.

---

## 4. Laporan

File: `src/views/Report.svelte` (menggantikan `Reports.svelte`; hapus file lama). Logika murni baru di `src/lib/reports.ts`.

### 4.1 Header

`[title] Laporan` kiri; kanan `Pill ink` `⤓ CSV` → ekspor **tab aktif** (§4.7).

### 4.2 Pemilih periode (`Chips`, berlaku untuk semua tab)

Item: `‹` · 4 chip bulan · `Tahun ini` · `Rentang…`.

- State: `type Period = {kind:'month', y:number, m:number /* 0–11 */} | {kind:'year', y:number} | {kind:'range', from:'YYYY-MM-DD', to:'YYYY-MM-DD'}` di `reportState.period`. Default bulan berjalan.
- State lokal `windowEnd: {y, m}` = bulan paling kanan dari 4 chip; awalnya bulan berjalan. 4 chip = `windowEnd`, `windowEnd−1`, `−2`, `−3`, ditampilkan **terbaru di kiri**. Label: chip yang sama dengan `period` (kind month) memakai `"MMM yyyy"`, lainnya `"MMM"`.
- `‹` → `windowEnd` mundur 1 bulan (hanya menggeser jendela, **tidak** mengubah `period`). Tidak ada `›`; untuk maju: chip `Tahun ini` lalu pilih bulan, atau muat ulang halaman. Jika `period` bulan tidak ada di jendela, tidak ada chip yang aktif (chip `Rentang…`/`Tahun ini` juga tidak), dan itu diterima.
- `Rentang…` → `Sheet` dengan 2 `Field type=date` (Dari, Sampai) + `Button ink` "Terapkan". Chip lalu berbunyi `"27 Okt – 30 Okt"`.
- Helper: `periodRange(period): {start: Date, end: Date, label: string, prevStart, prevEnd}` di `reports.ts`. `end` eksklusif. `prev*` = periode sebelumnya dengan panjang sama (untuk perbandingan).

### 4.3 Tab laporan (`Chips`, `aria-label="Jenis laporan"`)

`Arus kas` (`cashflow`, default) · `Kategori` (`category`) · `Saldo akun` (`balance`) · `Buku besar` (`ledger`). `role="tablist"` dengan `role="tab" aria-selected` dipertahankan untuk e2e (e2e lama mencari tab `"Buku"` → ubah e2e ke `"Buku besar"`).

### 4.4 Tab Arus kas

**Semua angka tab ini mengecualikan transfer.**

1. `Card`: 3 kolom tengah `label` MASUK / KELUAR / NET dengan nilai `amount .num font-semibold` (`text-pos` / `text-accent` / `text-ink` atau `text-accent` jika negatif). Di bawahnya **bar komposisi pengeluaran**: `flex gap-1.5 h-2.5 rounded-pill overflow-hidden mt-3.5`, segmen = kategori expense top 3 + sisanya, lebar proporsional, warna `bg-accent` dengan opacity 1 / .65 / .35 / .2. Di bawahnya `caption-xs text-ink2 mt-2`: `"Rasio tabungan {r}% · Keluar/Masuk {k}%"` (`k = round(E/I*100)`; jika `I = 0` → `"Belum ada pemasukan di periode ini"`).
2. `SectionHeader title="Per bulan, {tahun}"` (periode `month`/`year` → tahun terpilih; `range` → `"Per bulan"`). `Card dense` tabel kolom `Bulan | Masuk | Keluar | Net`, satu baris per bulan **yang punya transaksi** di tahun itu (periode `range`: bulan yang beririsan), urut terbaru di atas, baris terakhir `tr.tot` `Total`. Nilai `formatCompact`, Net bertanda, warna pos/neg. Bulan terpilih `font-semibold`.
3. Desktop: dua blok di atas berdampingan `c5` + `c7`.

Rumus: `summarize(nonTransferTxInPeriod)` dari `ledger.ts` yang ada. `r = round((I−E)/I*100)`.

### 4.5 Tab Kategori

Dua tabel (`Card dense`): **Pengeluaran** lalu **Pemasukan**. Kolom `Kategori | Jumlah | % | vs {labelPeriodeSebelumnya}`.

- Baris = kategori dengan Σ > 0 di periode, urut menurun; ditambah `"Tanpa kategori"` jika ada. Kolom `%` = Σ kategori ÷ Σ tipe. Kolom `vs`: `Pill`-less teks `.num`: `▲ 41%` `text-accent` (naik untuk expense = buruk, maka merah-oranye; untuk income naik = `text-pos`), `▼ 12%` sebaliknya, `baru` `text-ink2` jika periode sebelumnya 0, `—` jika keduanya 0.
- Baris `tr.tot` Total dengan `vs` total.
- Ketuk baris → `Sheet` berisi daftar transaksi kategori itu di periode (maks 50, `ListItem`), judul nama kategori + total.
- Label periode sebelumnya: bulan → nama bulan sebelumnya (`"vs Sep"`); tahun → `"vs {y−1}"`; range → `"vs sblm"`.
- Kosong: `"Belum ada {pengeluaran|pemasukan} di periode ini."`

### 4.6 Tab Saldo akun (pengganti "Neraca")

> Alasan: tabel "Neraca" lama memasukkan saldo positif ke Debit dan negatif ke Kredit per akun — bukan neraca. App ini tidak punya kewajiban, jadi yang bermakna adalah **posisi saldo per akun** untuk periode.

`Card dense` tabel (scroll horizontal jika < 375px tidak muat; `min-w-[330px]`): kolom `Akun | Awal | Masuk | Keluar | Akhir`, satu baris per akun (**semua** akun, termasuk saldo 0, dikelompokkan per jenis dengan baris sub-header `label` Bank / E-Wallet / Tunai), baris `tr.tot` Total.

Rumus per akun (`src/lib/reports.ts: accountBalanceReport(accounts, transactions, start, end)`), **termasuk transfer**:
- `awal = Σ(income) − Σ(expense)` untuk tx `source = id` dan `timestamp < start`.
- `masuk = Σ income` tx `source = id`, `start ≤ timestamp < end`.
- `keluar = Σ expense` tx `source = id`, `start ≤ timestamp < end`.
- `akhir = awal + masuk − keluar`. Invarian: untuk periode yang mencakup "sampai sekarang", `akhir` harus sama dengan `balances[id]` dari `computeBalances` — tulis assert ini di check file.

Nilai `formatCompact` tanpa "Rp" (ada catatan); setiap sel angka punya `data-value="{angkaPenuh}"` dan `title="{formatIDR}"`. Baris Total `data-testid="balance-total"`. `Akhir` `font-semibold`. Catatan di bawah tabel `caption-xs text-ink2`: `"Dalam rupiah, dipadatkan. Masuk/Keluar di sini termasuk transfer antar akun; tab Arus kas tidak."`

Ketuk baris akun → tab Buku besar dengan akun itu.

### 4.7 Tab Buku besar

- `Select` akun (`id="ledger-account"`, dipertahankan untuk e2e), default `reportState.accountId` atau akun dengan saldo terbesar.
- Di bawahnya `Card` ringkas 3 kolom `label`: `AWAL | MUTASI | AKHIR` untuk periode (dari §4.6, `mutasi = masuk − keluar` bertanda).
- `Card dense` tabel `Tanggal | Keterangan | Mutasi | Saldo` dari `buildLedger(txInPeriod, accountId)` yang ada, **dengan saldo berjalan dimulai dari `awal`** (ubah `buildLedger` menerima `opening = 0` sebagai parameter ke-3; default 0 menjaga check lama hijau). Urut **terbaru di atas** (balik array setelah dihitung). Keterangan transfer `"→ {akunTujuan}"` / `"← {akunAsal}"` + deskripsi. Kolom Mutasi bertanda & berwarna, Saldo `font-semibold`.
- Mobile: kolom Tanggal format `dd MMM` `caption .num text-ink2`; Keterangan `truncate max-w-[140px]`.
- Kosong: `"Belum ada mutasi di periode ini."`

### 4.8 Ekspor CSV

Tombol `⤓ CSV` membuka `Sheet` berjudul "Unduh CSV" dengan 2 pilihan (`ListItem`):
1. `"{Nama tab aktif} — {label periode}"` → file `dompet-suami-{tab}-{YYYY-MM | YYYY | from_to}.csv`.
2. `"Semua transaksi (cadangan)"` → file `dompet-suami-semua-{YYYY-MM-DD}.csv`, kolom `Tanggal,Tipe,Jumlah,Sumber,Tujuan,Kategori,Keterangan` (ini pengganti ekspor cadangan lama; sumber/tujuan/kategori memakai **nama**, bukan id; `Tipe` = `income|expense|transfer`). Fungsi `fullBackupRows(transactions, accounts, categories): (string|number)[][]` di `reports.ts`, urut tanggal naik.

Format: BOM UTF-8, pemisah koma, baris `\r\n`. Aturan kutip (`toCsv(rows: (string|number)[][]): string` di `reports.ts`): sel dikutip **hanya jika** mengandung koma, tanda kutip, atau baris baru; tanda kutip di dalam digandakan. Contoh `toCsv([['a','b"c']])` → `a,"b""c"`. Angka ditulis penuh tanpa pemisah ribuan.

Kolom per tab:
- `cashflow`: `Bulan,Masuk,Keluar,Net`.
- `category`: `Tipe,Kategori,Jumlah,Persen,Periode sebelumnya`.
- `balance`: `Akun,Jenis,Awal,Masuk,Keluar,Akhir`.
- `ledger`: `Tanggal,Keterangan,Tipe,Mutasi,Saldo` (tanggal `YYYY-MM-DD`).

### 4.9 Desktop

Header + chips periode + chips tab dalam satu baris `flex-wrap gap-3`. Konten tab `max-w-[920px]`.

### 4.10 Kriteria terima Laporan

- [ ] Ganti periode mengubah **semua** tab.
- [ ] Saldo akun: Total `Akhir` untuk periode bulan berjalan = total Home.
- [ ] Arus kas: Net = Masuk − Keluar dan transfer tidak muncul.
- [ ] Kategori: kolom `%` dijumlah ≈ 100 (±1 pembulatan).
- [ ] Buku besar: saldo baris teratas (terbaru) = kolom `Akhir` akun di Saldo akun.
- [ ] CSV terunduh dengan nama benar, bisa dibuka di Excel/Numbers tanpa karakter rusak.
- [ ] Tidak ada kata "Neraca", "Debit", "Kredit" di UI.

---

## 5. Master

File: `src/views/Master.svelte` berisi `Segmented` dua tab + satu komponen `MasterList.svelte` generik? **Tidak** — dua komponen terpisah `AccountsManager.svelte` dan `CategoryManager.svelte` (dirombak) lebih mudah untuk pembaca; duplikasi kecil diterima.

### 5.1 Header + tab

`[title] Master`, `Segmented` `Sumber dana | Kategori` (`aria-label="Jenis master"`).

### 5.2 Tab Sumber dana

- `SectionHeader title="Akun · {n}" actionLabel` **bukan link** melainkan `Pill ink` `+ Tambah` di kanan (tinggi 28px). → sheet §5.4 mode tambah.
- Daftar dikelompokkan per `type` dengan `label` grup: `Bank`, `E-Wallet`, `Tunai` (urutan tetap; grup kosong disembunyikan). Tiap grup `Card dense` berisi `ListItem`: ikon akun, judul nama, sub `"{n} transaksi bulan ini"` atau `"Belum dipakai"` jika 0 transaksi **sepanjang waktu**, nominal saldo `formatIDR` (`text-ink2` jika 0), chevron `›`.
- Urutan dalam grup: saldo menurun, lalu nama.
- Ketuk → sheet §5.4 mode edit.

### 5.3 Tab Kategori

- `SectionHeader title="Kategori · {n}"` + `Pill ink` `+ Tambah`.
- Grup `Pengeluaran · {n}` lalu `Pemasukan · {n}`. `ListItem`: ikon, nama, sub `"Rp {formatCompact} bulan ini"` (Σ bulan ini, non-transfer) atau `"Belum dipakai"` jika 0 sepanjang waktu. Tanpa nominal kanan, hanya chevron.
- Urutan dalam grup: Σ bulan ini menurun, lalu nama.

### 5.4 Sheet tambah/edit (akun dan kategori, satu komponen `MasterSheet.svelte` dengan prop `kind:'account'|'category'`)

Judul: `Tambah sumber dana` / `Edit akun` / `Tambah kategori` / `Edit kategori`.

Field:
1. `Nama` — `Field` text, wajib, trim, maks 40 karakter. Pesan kosong: `"Nama wajib diisi."` Duplikat (case-insensitive, dalam jenis yang sama): `"Nama sudah dipakai."`
2. `Jenis` — `Segmented`: akun `Bank | Tunai | E-Wallet`; kategori `Pengeluaran | Pemasukan`. Edit kategori yang sudah punya transaksi: segmented **disabled** dengan `caption text-ink2` `"Jenis tidak bisa diubah karena sudah ada transaksi."`
3. `Ikon` — `Chips` emoji (daftar DS §5.19) chip 40×40, satu pilihan, default sesuai jenis.

Tombol grid 2: `Button ink` `Simpan` / `Button ghost` `Batal`. Di bawah (mode edit saja): `Button link-danger` `"Hapus akun (hanya bila tidak ada transaksi)"` / `"Hapus kategori (hanya bila tidak ada transaksi)"` — **disabled** (`opacity-50`) jika ada transaksi yang merujuk; aktif → `ConfirmDialog` `"Hapus {nama}?"`, `"Tindakan ini tidak bisa dibatalkan."`, lalu `deleteAccount(id)` / `deleteCategory(id)` baru di `store.ts` yang **menghapus di Supabase** (`.delete().eq('id', id)`) dan dari store; sebelum memanggil, fungsi memeriksa lagi tidak ada tx yang merujuk (`source`, `destination`, `categoryId`) dan melempar `Error('Masih ada transaksi yang memakai ini.')` jika ada.

Simpan: `saveAccount` / `saveCategory` yang ada (upsert) dengan field `icon`. ID baru tetap `String(Date.now())` seperti sekarang. Sukses → toast `"Disimpan."`; sheet tutup.

Model: tambahkan `icon?: string` pada `Account` dan `Category`. Mapping DB kolom `icon` (nullable) — `select('*')` sudah mengambilnya (`null` → `undefined`). Saat upsert, **sertakan `icon` hanya jika terisi** (`icon ? {…, icon} : {…}`), supaya kode tetap jalan di DB hosted yang belum punya kolom itu sampai pemilik repo menjalankan migrasi.

### 5.5 Desktop

Dua kolom `lg:grid-cols-2 gap-7`: Sumber dana kiri, Kategori kanan, **tanpa Segmented** (keduanya tampil). Sheet jadi dialog tengah (DS §5.12).

### 5.6 Kriteria terima Master

- [ ] Tambah akun → muncul di grup yang benar, tersimpan di DB (cek reload).
- [ ] Edit nama/ikon → berubah di semua tempat (Home rail, Transaksi select, Laporan).
- [ ] Hapus akun yang punya transaksi: tombol disabled; lewat devtools memanggil `deleteAccount` tetap ditolak dengan pesan.
- [ ] Hapus akun tanpa transaksi → hilang dari DB.
- [ ] Nama duplikat ditolak.
- [ ] Tidak ada `confirm()`; tidak ada class `text-red`.

---

## 6. PWA & aset

Lihat DS §6. Kriteria terima:

- [ ] `npm run build && npm run preview` → Chrome DevTools → Application → Manifest tanpa error; "Installability" lolos.
- [ ] Service worker terdaftar hanya di production build (`import.meta.env.PROD`).
- [ ] Setelah dibuka sekali, matikan jaringan → reload → shell tampil + banner offline; tidak ada layar putih.
- [ ] Add to Home Screen di Android Chrome dan iOS Safari menampilkan ikon celengan dengan latar kertas, nama "Dompet".
- [ ] Favicon tab = logo celengan berwarna (bukan hitam/transparan).
- [ ] Lighthouse PWA/Best Practices tidak menandai ikon atau manifest.

---

## 7. Data uji

Ada dua seed di `supabase/`:

| File | Isi | Dipakai oleh | Di git? |
|---|---|---|---|
| `supabase/seed.e2e.sql` | Data sintetis kecil & tetap: akun `bank` "Bank", `cash` "Tunai", `ewallet` "E-Wallet"; 6 kategori default; **0 transaksi**. Diawali `truncate accounts, categories, transactions;` | `scripts/e2e.mjs` — dijalankan otomatis di awal e2e lewat `child_process.execSync('psql …')` (env `PGPASSWORD=postgres`), sehingga alur income 5jt → transfer 1jt → expense 250rb menghasilkan **bank 4.000.000 / tunai 750.000** secara deterministik | Ya |
| `supabase/seed.local.sql` | Salinan data nyata pemilik (7 akun, 15 kategori, 22 transaksi Okt 2026) | Pemeriksaan visual manual; nilai acuan tabel di bawah | **Tidak** (ada di `.gitignore`; pemilik menyimpannya) |

Setelah e2e selesai, DB lokal berisi data e2e. Untuk kembali ke data nyata: `psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -f supabase/seed.local.sql`. Jalankan ini sebelum pemeriksaan visual. Jika `seed.local.sql` tidak ada, minta ke pemilik; jangan membaca hosted.

DB lokal dompet-suami (API `http://127.0.0.1:55321`, Postgres `127.0.0.1:55322`, user/pass `postgres`). Dengan **`seed.local.sql`**, angka yang harus muncul setelah implementasi (nilai acuan pemeriksaan manual, **bukan** assert e2e):

| Hal | Nilai |
|---|---|
| Total semua akun | Rp 6.106.441 |
| Masuk Okt (non-transfer) | Rp 18.344.145 |
| Keluar Okt (non-transfer) | Rp 12.233.204 |
| Net Okt | Rp 6.110.941 |
| Selisih Net − Total | 4.500 = total biaya transfer (2.500 + 1.000 + 1.000) |
| Saldo Bank CIMB / Bank Mandiri / Shopee / Tunai | 3.100.000 / 2.337.487 / 507.954 / 161.000 |
| Akun saldo 0 | E-Wallet, Gopay, Ovo (3) |
| Pengeluaran terbesar Okt | Transfer Ke Istri ❤️, 8.500.000 (69%); lalu Operasional Rumah 3.239.914 (26%), Sembako 188.000 (2%) |
| Rasio tabungan Okt | 33% |
| Rata-rata harian (pada 30 Okt) | 12.233.204 / 30 = 407.773 → "Rp 408 rb"; proyeksi 31 hari 12.640.978 → "Rp 12,64 jt" |

> Angka ini dihitung langsung dari isi `seed.local.sql` (22 transaksi). Mockup v4 memakai angka berbeda (dummy). Jika DB lokal berisi tambahan manual (misal akun "CONTOH DUMMY" atau transaksi uji), angkanya bergeser dan itu **bukan bug** — muat ulang `seed.local.sql` dulu.
