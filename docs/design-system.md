# Design System — Dompet Suami

Versi: 1.0 (2026-10-30). Sumber kebenaran visual untuk revamp. Mockup rujukan: `docs/design/mockup-v4.html` (buka di browser; tombol Light/Dark di atas).

Aturan membaca dokumen ini:

- Semua angka di sini adalah **nilai final**, bukan contoh. Jangan dibulatkan, jangan diganti.
- Jika ada konflik antara dokumen ini dan `docs/design.md`, dokumen ini menang untuk **token dan komponen**, `design.md` menang untuk **susunan layar**.
- Jika ada yang tidak tercantum, pakai nilai terdekat dari skala di bawah. Jangan menciptakan nilai baru (misal `13.5px`, `#333`, `gap-[7px]`).

---

## 1. Prinsip

1. **Tiga warna + satu.** Hitam (ink), kertas (paper), oranye (accent). Satu tambahan: hijau sage (pos) khusus pemasukan/nilai positif. Tidak ada warna lain. Tidak ada ungu, biru, kuning neon, gradien pelangi.
2. **Angka adalah bintang.** Semua nominal pakai font mono tabular, ukuran lebih besar dari teks di sekitarnya.
3. **Satu gaya kartu.** Semua kontainer memakai `.card` yang sama (radius 14px, border 1px `line`, padding 16px). Tidak ada kartu dengan padding berbeda-beda.
4. **Mobile dulu.** Semua komponen didesain untuk lebar 375px, lalu ditata ulang ke grid di ≥1024px. Tidak ada komponen khusus desktop.
5. **Eye comfort.** Kontras teks utama ≥ 7:1, teks sekunder ≥ 4.5:1. Tidak ada teks di bawah 11px. Tidak ada warna jenuh penuh di area luas kecuali kartu akun.

---

## 2. Token

Semua token didefinisikan di `src/app.css`. Struktur 3 lapis: **primitive → semantic → component**. Komponen hanya boleh memakai lapis semantic/component, tidak boleh memakai primitive atau hex langsung.

### 2.1 Primitive (nilai mentah, jangan dipakai langsung di komponen)

```css
:root {
  /* netral hangat */
  --p-paper-100: #f4f3ef;
  --p-paper-0:   #ffffff;
  --p-sand-100:  #ebe9e2;
  --p-sand-200:  #dedcd5;
  --p-ink-900:   #15181a;
  --p-ink-600:   #5c6267;
  --p-ink-400:   #a0a6a2;

  /* netral gelap (dark mode) */
  --p-coal-900:  #101312;
  --p-coal-800:  #191d1b;
  --p-coal-700:  #232826;
  --p-coal-600:  #2c322f;
  --p-mist-100:  #eceeec;

  /* oranye */
  --p-orange-700: #c04415;   /* teks/tombol di light: 5.15:1 di atas putih */
  --p-orange-600: #d9541e;   /* hanya untuk area besar tanpa teks (lingkaran dekor, bar chart) */
  --p-orange-400: #ee7a4a;
  --p-orange-300: #ffa67c;
  --p-orange-50:  #fdefe8;
  --p-orange-950: #33211a;

  /* hijau sage */
  --p-sage-700: #25764a;     /* teks di light: 5.57:1 di atas putih */
  --p-sage-400: #5cbb86;
  --p-sage-300: #8fd7af;
  --p-sage-50:  #e6f4ec;
  --p-sage-950: #1b2d23;
}
```

Kontras sudah dihitung (WCAG 2.x): `--p-orange-700` di atas `#ffffff` 5,15:1, di atas `--p-orange-50` 4,58:1; `--p-sage-700` di atas `#ffffff` 5,57:1, di atas `--p-sage-50` 4,91:1; `--p-orange-400` dan `--p-sage-400` di atas `#191d1b` ≥ 6:1; `#8fd7af`/`#ffa67c` di atas `#232826` ≥ 7,8:1. Mockup `mockup-v4.html` masih memakai `#d9541e`/`#2f8f5b` untuk teks — **dokumen ini yang benar**, bukan mockup. Jika suatu pasangan ternyata < 4,5:1 saat diuji, builder boleh **menggelapkan foreground** satu langkah, tidak boleh menerangkan, dan mencatatnya di handoff.

### 2.2 Semantic (yang dipakai komponen)

| Token | Light | Dark | Dipakai untuk |
|---|---|---|---|
| `--paper` | `--p-paper-100` | `--p-coal-900` | Latar halaman |
| `--card` | `--p-paper-0` | `--p-coal-800` | Latar kartu, sheet, nav bawah |
| `--chip` | `--p-sand-100` | `--p-coal-700` | Latar chip tidak aktif, segmented, ikon bulat, bar track |
| `--line` | `--p-sand-200` | `--p-coal-600` | Border, pemisah |
| `--ink` | `--p-ink-900` | `--p-mist-100` | Teks utama, tombol gelap, bar aktif |
| `--ink-2` | `--p-ink-600` | `--p-ink-400` | Teks sekunder, label, ikon nav tidak aktif |
| `--accent` | `--p-orange-700` | `--p-orange-400` | Pengeluaran (teks), FAB, tombol utama, titik insight |
| `--accent-fill` | `--p-orange-600` | `--p-orange-400` | Batang chart, bar progres, lingkaran dekor (area tanpa teks) |
| `--accent-soft` | `--p-orange-50` | `--p-orange-950` | Latar pill negatif, latar tombol Hapus |
| `--pos` | `--p-sage-700` | `--p-sage-400` | Pemasukan, delta positif |
| `--pos-fill` | `--p-sage-400` | `--p-sage-400` | Batang chart pemasukan |
| `--pos-soft` | `--p-sage-50` | `--p-sage-950` | Latar pill positif |
| `--on-accent` | `#ffffff` | `--p-coal-900` | Teks di atas `--accent` (dark: teks gelap, karena putih di atas `#ee7a4a` hanya 2,8:1) |
| `--acard-ink-bg` | `--p-ink-900` | `--p-coal-700` | Latar kartu akun tone `ink` (dark: bukan `--ink`, yang di dark berwarna terang) |
| `--on-acard-ink` | `--p-paper-100` | `--p-mist-100` | Teks di atas `--acard-ink-bg` |
| `--pos-on-dark` | `--p-sage-300` | `--p-sage-300` | Angka pemasukan di atas `--acard-ink-bg` |
| `--neg-on-dark` | `--p-orange-300` | `--p-orange-300` | Angka pengeluaran di atas `--acard-ink-bg` |
| `--on-ink` | `--p-paper-100` | `--p-coal-900` | Teks di atas `--ink` (tombol `ink`, chip aktif, nav) |
| `--shadow-fab` | `0 8px 20px rgb(217 84 30 / .35)` | `0 8px 20px rgb(0 0 0 / .5)` | Bayangan FAB |
| `--shadow-sheet` | `0 -10px 40px rgb(0 0 0 / .18)` | `0 -10px 40px rgb(0 0 0 / .6)` | Bayangan sheet |
| `--scrim` | `rgb(0 0 0 / .35)` | `rgb(0 0 0 / .6)` | Latar gelap di belakang sheet/dialog |

Dark mode: **otomatis** via `@media (prefers-color-scheme: dark)`. Tidak ada toggle manual (tidak diminta; YAGNI).

### 2.3 Pendaftaran ke Tailwind v4

Di `src/app.css`, blok `@theme inline` yang sudah ada **diganti** jadi:

```css
@theme inline {
  --font-sans: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;

  --color-paper: var(--paper);
  --color-card: var(--card);
  --color-chip: var(--chip);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-ink2: var(--ink-2);
  --color-accent: var(--accent);
  --color-accent-fill: var(--accent-fill);
  --color-accent-soft: var(--accent-soft);
  --color-pos: var(--pos);
  --color-pos-fill: var(--pos-fill);
  --color-pos-soft: var(--pos-soft);
  --color-pos-on-dark: var(--pos-on-dark);
  --color-neg-on-dark: var(--neg-on-dark);
  --color-on-accent: var(--on-accent);
  --color-on-ink: var(--on-ink);
  --color-acard-ink: var(--acard-ink-bg);
  --color-on-acard-ink: var(--on-acard-ink);
  --color-overlay: rgb(255 255 255 / 0.18);   /* pill/dekor di atas kartu berwarna */

  --radius-card: 14px;
  --radius-field: 10px;
  --radius-btn: 12px;
  --radius-acard: 18px;
  --radius-sheet: 20px;
  --radius-ico: 10px;
  --radius-seg: 8px;
  --radius-fab: 16px;
  --radius-pill: 999px;

  --shadow-seg: 0 1px 2px rgb(0 0 0 / 0.08);
}
```

Hasilnya class Tailwind: `bg-paper`, `bg-card`, `bg-chip`, `border-line`, `text-ink`, `text-ink2`, `text-accent`, `bg-accent-fill`, `bg-accent-soft`, `text-pos`, `bg-pos-fill`, `bg-pos-soft`, `text-pos-on-dark`, `text-neg-on-dark`, `text-on-accent`, `text-on-ink`, `bg-acard-ink`, `text-on-acard-ink`, `bg-overlay`, `rounded-card`, `rounded-field`, `rounded-btn`, `rounded-acard`, `rounded-sheet`, `rounded-ico`, `rounded-seg`, `rounded-fab`, `rounded-pill`, `shadow-seg`.

Variabel lama `--btn-bg`, `--btn-fg` dan class `.btn-primary`, `.btn-quiet`, `.tab`, `.field`, `.label` (mono) **dipertahankan** sampai komponen lama yang memakainya dihapus (Tugas 5–9), lalu dihapus di Tugas 11. Label gaya baru memakai class baru `.lbl` (lihat §3.1) agar tidak bentrok.

**Dilarang** di komponen: `text-red`, `bg-black`, `text-white`, `bg-[#...]`, `rounded-lg`, `rounded-md`, `rounded`, `rounded-2xl`, `shadow-sm` default Tailwind, `bg-white/20`. Semua harus lewat token di atas. (File lama `AccountsManager.svelte` memakai `text-red` dan `border-red/30` — itu salah, warna `red` tidak terdefinisi.) Pengecualian yang **sah** dan tidak perlu dilaporkan: nilai arbitrary Tailwind yang disebut eksplisit di dokumen ini (contoh `h-[46px]`, `text-[13.5px]`, `max-w-[1180px]`), dan `fill`/`stroke` SVG yang memakai `var(--…)`.

---

## 3. Tipografi

Font tetap: **IBM Plex Sans** (teks) dan **IBM Plex Mono** (angka + label kecil). Sudah dimuat di `index.html`; tambahkan weight 600 dan 700 untuk Sans, 600 untuk Mono:

```
https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap
```

### 3.1 Skala (satu-satunya ukuran yang boleh dipakai)

| Nama | Class | Size / line-height | Weight | Font | Pakai untuk |
|---|---|---|---|---|---|
| `display` | `text-[28px] leading-[1.1] font-semibold tracking-[-0.03em]` | 28/31 | 600 | Mono | Total semua akun (mobile) |
| `display-lg` | `text-[34px] leading-[1.05] font-semibold tracking-[-0.03em]` | 34/36 | 600 | Mono | Total semua akun (desktop), jumlah di form transaksi (36px, pengecualian satu-satunya) |
| `amount-lg` | `text-[26px] leading-none font-semibold tracking-[-0.03em]` | 26 | 600 | Mono | Saldo di kartu akun |
| `title` | `text-[20px] leading-[1.2] font-semibold` | 20/24 | 600 | Sans | Judul halaman ("Halo, Pak Arief", "Laporan") |
| `h3` | `text-[15px] leading-[1.3] font-semibold` | 15/20 | 600 | Sans | Judul section ("Insight", "Tren 12 bulan") |
| `body` | `text-[14px] leading-[1.45]` | 14/20 | 400/500 | Sans | Teks item, isi tabel, field |
| `body-sm` | `text-[13px] leading-[1.45]` | 13/19 | 400 | Sans | Isi insight, isi tabel laporan |
| `caption` | `text-[12px] leading-[1.4]` | 12/17 | 400 | Sans | Subteks item, link "Semua →", tanggal grup |
| `caption-xs` | `text-[11.5px] leading-[1.4]` | 11.5/16 | 400 | Sans | Sub-baris item (akun · kategori), catatan tabel |
| `label` | `text-[11px] leading-[1.4] font-medium uppercase tracking-[0.04em]` | 11/15 | 500 | Sans | Label field, label statistik ("MASUK · OKT"), header tabel |
| `amount` | `text-[14px] font-semibold` + `.num` | 14 | 600 | Mono | Nominal di item/tabel |
| `amount-sm` | `text-[12px]` + `.num` | 12 | 400 | Mono | Saldo akun di dalam select, sub-nominal |
| `pill` | `text-[11px] font-medium` | 11 | 500 | Sans | Isi pill |
| `nav` | `text-[10.5px] font-medium` | 10.5 | 500 | Sans | Label nav bawah |

Class util `.num` (sudah ada di `app.css`, pertahankan): `font-family: var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: -0.02em;`.

Class util baru `.lbl` di `@layer components` = baris `label` di tabel (`font-size:11px; line-height:1.4; font-weight:500; text-transform:uppercase; letter-spacing:.04em; color:var(--ink-2); font-family:var(--font-sans)`). Di dokumen ini dan `design.md`, kata **`label`** berarti class `.lbl`. Class lama `.label` (mono, tidak uppercase) **jangan diubah**; ia hilang bersama komponen lama.

Ukuran yang dipakai di tabel ini (10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 18, 20, 26, 28, 34, 36) adalah **skala resmi**; semuanya boleh dipakai. Ukuran lain tidak boleh. Teks di dalam SVG chart (9–10px) adalah pengecualian khusus chart dan bukan "teks" dalam arti aturan 11px.

### 3.2 Format angka

Semua lewat `src/lib/format.ts`. Tambahkan satu fungsi:

```ts
/** 18214145 -> "18,21 jt"; 458504 -> "459 rb"; 900 -> "900". Dipakai di kartu, chart, strip statistik. */
export function formatCompact(amount: number): string
```

Aturan (bekerja pada `Math.abs(amount)`; **tanda ditambahkan pemanggil**, fungsi ini tidak pernah mengeluarkan `-`):
1. `v = Math.abs(amount)`.
2. Jika `Math.round(v / 1000) >= 1000` → `(v / 1e6)` dengan `Intl.NumberFormat('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})` + `" jt"`. Contoh `999.600 → "1,00 jt"`, `8.500.000 → "8,50 jt"`, `18.214.145 → "18,21 jt"`.
3. Selain itu jika `v >= 1000` → `Math.round(v / 1000)` + `" rb"`. Contoh `458.504 → "459 rb"`, `1.000 → "1 rb"`.
4. Selain itu → `String(Math.round(v))`. Contoh `900 → "900"`, `0 → "0"`.

Tanda: pemasukan diawali `+`, pengeluaran diawali `−` (U+2212, bukan tanda minus keyboard). Transfer tanpa tanda. Tambahkan `formatSignedCompact(amount, type)` di `format.ts` yang mengembalikan `"+18,34 jt"` / `"−12,28 jt"`. Untuk Net/delta yang bisa negatif: `net >= 0 ? '+' + formatCompact(net) : '−' + formatCompact(net)`; nol → `"0"` tanpa tanda.

`formatIDR` tetap untuk nominal penuh (`Rp 6.056.991`). Di tabel laporan padat, boleh `formatCompact`; di detail/sheet selalu `formatIDR`.

---

## 4. Spasi, radius, ukuran

### 4.1 Skala spasi (px)

`4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 22 · 24 · 28`. Tailwind: `gap-1 (4) gap-1.5 (6) gap-2 (8) gap-2.5 (10) gap-3 (12) gap-3.5 (14) gap-4 (16) gap-5 (20) gap-[22px] gap-6 (24) gap-7 (28)`.

Aturan tetap:

| Hal | Nilai |
|---|---|
| Gutter halaman mobile | 16px kiri-kanan (`px-4`) |
| Gutter halaman desktop | 28px (`px-7`), lebar maks konten 1180px (`max-w-[1180px] mx-auto`) |
| Padding atas konten mobile | 12px di bawah header halaman |
| Padding bawah konten mobile | 92px (`pb-[92px]`) supaya tidak tertutup nav bawah + FAB |
| Jarak antar section (judul section ke kartu di atasnya) | 22px atas, 10px bawah (`.h { margin: 22px 0 10px }`) |
| Padding kartu | 16px (`p-4`); kartu berisi daftar `.item`: `py-1.5 px-4` karena item sudah punya padding vertikal |
| Gap grid desktop | 20px |
| Gap antar kartu akun di carousel | 12px |

### 4.2 Radius

| Token | px | Pakai |
|---|---|---|
| `rounded-card` | 14 | Kartu, strip statistik |
| `rounded-field` | 10 | Input, select, kotak pencarian |
| `rounded-btn` | 12 | Tombol utama |
| `rounded-acard` | 18 | Kartu akun |
| `rounded-sheet` | 20 (atas saja) | Bottom sheet |
| `rounded-ico` | 10 | Kotak ikon 36px |
| `rounded-pill` | 999 | Pill, chip, segmented item 8px (pengecualian: segmented pakai 8px) |

### 4.3 Ukuran sentuh

Minimal area sentuh 44×44px untuk semua yang bisa diketuk. Item daftar tinggi minimal 60px. Chip tinggi 34px dengan margin vertikal 5px (total 44). Tombol utama 48px. Field 46px. Nav bawah item tinggi penuh 78px.

---

## 5. Komponen

Format tiap komponen: **Anatomi → Ukuran → State → Class → Larangan**. Semua komponen baru dibuat di `src/components/ui/` sebagai file Svelte terpisah, **sintaks legacy Svelte** (`export let`, `$:`, `on:click`) mengikuti kode yang ada. Jangan memakai runes (`$props`, `$state`) — mencampur dua sintaks dalam satu project memicu error kompilasi.

### 5.1 `Card.svelte`

- **Anatomi:** satu `div` pembungkus, slot.
- **Ukuran:** `bg-card border border-line rounded-card p-4`. Prop `dense` (boolean) → `py-1.5 px-4` untuk kartu berisi daftar.
- **State:** tidak interaktif. Tidak ada hover.
- **Larangan:** tidak ada shadow. Tidak ada `bg-paper` untuk kartu (itu kesalahan lama di Dashboard).

### 5.2 `SectionHeader.svelte`

- **Anatomi:** `h3` kiri + opsional link aksi kanan.
- **Ukuran:** `flex justify-between items-baseline mt-[22px] mb-2.5`; judul `h3`; aksi `caption text-ink2`, teks berakhir dengan ` →`.
- **State aksi:** hover `text-ink`; fokus `outline-2 outline-ink outline-offset-2`.
- **Props:** `title: string`, `actionLabel?: string`, `on:action`.

### 5.3 `AccountCard.svelte` (kartu akun di carousel Home)

- **Anatomi (atas ke bawah):** baris header (ikon + nama kiri, pill jenis kanan) → saldo → baris footer (Masuk, Keluar, kanan: jumlah transaksi bulan ini). Lingkaran dekoratif `bg-overlay` 120px di pojok kanan atas (`absolute -right-[30px] -top-[30px]`), wadah `overflow:hidden`.
- **Ukuran:** lebar `280px` tetap (`flex: 0 0 280px`), tinggi minimal 150px, `rounded-acard p-4 px-[18px]`, `scroll-snap-align: start`. Header `text-[13.5px] font-semibold` (pengecualian ukuran, boleh). Saldo `amount-lg`, margin `mt-3.5 mb-auto`. Footer `mt-3.5 text-[12px]`, label footer `text-[10px] uppercase tracking-[0.04em] opacity-70`, nilai `font-semibold .num`.
- **Varian warna (prop `tone`):**
  - `ink` → `bg-acard-ink text-on-acard-ink`; pill `bg-overlay`; masuk `text-pos-on-dark`; keluar `text-neg-on-dark`. (Di dark mode latar jadi `#232826`, teks terang — bukan `bg-ink`, karena `--ink` di dark berwarna terang.)
  - `accent` → `bg-accent text-on-accent`; pill `bg-overlay`; masuk & keluar `text-on-accent` (satu warna; hijau/oranye di atas oranye tidak kontras).
  - `card` → `bg-card border border-line text-ink`; pill `bg-chip text-ink2`; masuk `text-pos`; keluar `text-accent`.
  - Lingkaran dekor: `bg-overlay` untuk `ink`/`accent`; untuk `card` tidak ada lingkaran.
  - Penentuan: kartu urutan ke-1 = `ink`, ke-2 = `accent`, sisanya `card`. Urutan kartu = saldo terbesar dulu.
- **Varian `add`** (kartu terakhir): `bg-card border border-dashed border-line text-ink2`, isi vertikal tengah: `+` 26px weight 300, "Tambah sumber dana" 12px, baris ke-3 `caption-xs` "N akun kosong disembunyikan" (hanya jika N > 0).
- **State:** seluruh kartu bisa diketuk → buka Laporan tab Buku besar dengan akun itu terpilih. Active: `scale-[0.99]` 80ms. Fokus: `outline-2 outline-ink outline-offset-2`.
- **Props:** `account: Account`, `balance: number`, `incomeThisMonth: number`, `expenseThisMonth: number`, `txCountThisMonth: number`, `tone: 'ink'|'accent'|'card'`, `monthLabel: string` (contoh `"Okt"`).

### 5.4 `AccountRail.svelte` (carousel)

- **Anatomi:** `div.rail` scroll horizontal berisi `AccountCard` + kartu `add`; di bawahnya `div.dots`.
- **Ukuran:** `flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-1`, scrollbar disembunyikan (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`). Dots: `flex gap-[5px] justify-center mt-2.5`; titik 6×6 `rounded-pill bg-line`; aktif `w-4 bg-ink`. Transisi lebar 160ms.
- **Perilaku:** titik aktif mengikuti kartu yang paling terlihat (pakai `IntersectionObserver` threshold 0.6, atau `scroll` event + `Math.round(scrollLeft / 292)`; pilih yang lebih sederhana — `scroll` event). Di desktop (≥1024px) rail jadi `grid grid-cols-4 gap-5` tanpa scroll, tanpa dots, kartu `flex:1`.
- **Isi:** hanya akun dengan saldo ≠ 0 **atau** punya transaksi bulan ini. Akun lain dihitung sebagai "kosong" dan disebut di kartu `add`. Jika semua akun kosong → tampilkan semua akun (jangan rail kosong).

### 5.5 `StatStrip.svelte` (Masuk · Keluar · Net)

- **Anatomi:** kartu dengan 3 kolom tengah, kolom tengah ada border kiri-kanan.
- **Ukuran:** `Card` + `grid grid-cols-3 gap-2 text-center py-3.5 px-3`; label `label`; nilai `amount .num font-semibold mt-1`; kolom tengah `border-x border-line`.
- **Warna nilai:** Masuk `text-pos`, Keluar `text-accent`, Net `text-ink` (negatif → `text-accent`).
- **Props:** `income`, `expense`, `net`, `periodLabel` (contoh `"OKT"`).

### 5.6 `Pill.svelte`

- **Ukuran:** `inline-block px-2 py-0.5 rounded-pill pill`.
- **Varian:** `neutral` → `bg-chip text-ink2`; `pos` → `bg-pos-soft text-pos`; `neg` → `bg-accent-soft text-accent`; `ink` → `bg-ink text-on-ink` (untuk tombol kecil "+ Tambah", "⤓ CSV", tinggi 28px, `px-3`).
- **Delta:** awalan `▲` untuk positif, `▼` untuk negatif, teks `"baru"` jika pembanding 0.

### 5.7 `Segmented.svelte`

- **Anatomi:** wadah `bg-chip rounded-field p-[3px] flex gap-[3px]`, item `flex-1 text-center py-2 rounded-seg text-[13px] font-medium text-ink2`.
- **Aktif:** `bg-card text-ink shadow-seg`.
- **A11y:** `role="tablist"`, item `role="tab" aria-selected`. Pertahankan `aria-label` yang sudah dipakai e2e: `"Jenis transaksi"`, `"Jenis laporan"`, `"Filter transaksi"`.
- **Props:** `items: {id,label}[]`, `value`, `on:change`.

### 5.8 `Chips.svelte` (baris chip bisa scroll)

- **Ukuran:** `flex gap-2 overflow-x-auto -mx-4 px-4`, scrollbar disembunyikan; chip `whitespace-nowrap px-3 py-[7px] rounded-pill border border-line bg-card text-[12.5px] text-ink`.
- **Aktif:** `bg-ink text-on-ink border-ink`.
- **Chip khusus:** `+` di akhir baris kategori → buka sheet tambah kategori. Chip `‹` di awal baris periode → mundur satu periode.
- **Props:** `items: {id,label,icon?}[]`, `value`, `on:change`, `multiple=false`.

### 5.9 `Field.svelte` / `Select.svelte`

- **Ukuran:** `h-[46px] rounded-field border border-line bg-card px-3 body text-ink w-full`. Label di atas memakai `label`, jarak 8px.
- **State:** hover `border-ink2`; focus `border-ink ring-1 ring-ink outline-none`; invalid `border-accent`; disabled `opacity-50`.
- **Select akun:** teks opsi `"{nama}"`, dan di kanan field tampilkan saldo `amount-sm text-ink2` (render sebagai `div` kustom di atas `select` native yang `opacity-0 absolute inset-0` — supaya tetap native di mobile).
- **Field jumlah besar** (form transaksi): bukan `Field`; lihat `design.md` §Transaksi.

### 5.10 `Button.svelte`

| Varian | Class | Pakai |
|---|---|---|
| `primary` | `h-12 rounded-btn bg-accent text-on-accent font-semibold text-[15px] w-full` | Simpan transaksi |
| `ink` | `h-11 rounded-btn bg-ink text-on-ink font-semibold text-[14px]` | Simpan di sheet, Edit |
| `soft-danger` | `h-11 rounded-btn bg-accent-soft text-accent font-semibold text-[14px]` | Hapus di sheet |
| `ghost` | `h-11 rounded-btn bg-chip text-ink2 font-medium text-[14px]` | Batal |
| `link-danger` | `caption text-accent text-center` | "Hapus akun (hanya bila tidak ada transaksi)" |

State: hover `brightness-95` (light) / `brightness-110` (dark); active `translate-y-px`; disabled `opacity-50 pointer-events-none`; loading → teks diganti "Menyimpan…" dan disabled. Fokus: `outline-2 outline-ink outline-offset-2`.

### 5.11 `ListItem.svelte`

- **Anatomi:** `[ikon 36] [teks: judul + sub] [nominal kanan: nilai + sub] [chevron opsional]`.
- **Ukuran:** `flex items-center gap-3 py-3 border-b border-line last:border-0`, tinggi min 60px. Ikon `w-9 h-9 rounded-ico bg-chip grid place-items-center text-[15px]`. Judul `body font-medium truncate`; sub `caption-xs text-ink2 mt-0.5`. Nominal `amount .num text-right whitespace-nowrap`; sub-nominal `text-[11px] text-ink2 font-normal`.
- **Warna nominal:** income `text-pos` dengan `+`; expense `text-accent` dengan `−`; transfer `text-ink2` tanpa tanda. Di Home "Pengeluaran bulan ini" nominal `text-ink` (karena semua expense, tanda tidak perlu).
- **Progress bar opsional** (prop `percent`): di bawah judul, `h-1.5 rounded-pill bg-chip mt-1.5`, isi `bg-accent`.
- **Interaksi:** jika `on:click` ada → `cursor-pointer`, hover `bg-chip/40` di desktop, active `bg-chip`. Chevron `›` `text-ink2`.

### 5.12 `Sheet.svelte` (bottom sheet)

- **Anatomi:** scrim penuh layar + panel bawah dengan handle 36×4 `bg-line rounded-pill` di tengah atas.
- **Ukuran:** panel `fixed inset-x-0 bottom-0 bg-card rounded-t-sheet px-5 pt-3.5 pb-[30px] shadow-[var(--shadow-sheet)] z-50 max-h-[85dvh] overflow-auto`. Scrim `fixed inset-0 bg-[var(--scrim)] z-40`.
- **Desktop (≥1024px):** panel berubah jadi dialog tengah `max-w-[440px] rounded-card` (mx-auto, bottom auto, top 50% translate). Satu komponen, dua layout via media query.
- **Perilaku:** klik scrim / Esc / swipe bawah (opsional, boleh dilewati) → tutup. Fokus dipindah ke panel saat buka, dikembalikan saat tutup. `role="dialog" aria-modal="true" aria-labelledby`.
- **Animasi:** masuk `translateY(100%)→0` 220ms ease-out; keluar 160ms. Hormati `prefers-reduced-motion` (sudah ada di app.css).
- **Props:** `open`, `title`, slot, `on:close`.

### 5.13 `ConfirmDialog.svelte`

Pakai `Sheet` dengan isi: judul `h3`, deskripsi `body-sm text-ink2 mt-2`, dua tombol grid 2 kolom `ghost` + `soft-danger`. Mengganti `confirm()` native dan dialog `fixed inset-0 bg-black/40` yang ada di `TransactionList.svelte`.

### 5.14 `BottomNav.svelte`

- **Anatomi:** `<nav aria-label="Navigasi bawah">` berisi 4 `<button>` : Home, Transaksi, Laporan, Master (urutan tetap; `aria-label` tombol = teks persis, tanpa kata lain). Ikon stroke 22px + label `nav`. Tombol aktif `aria-current="page"`.
- **Ukuran:** `fixed inset-x-0 bottom-0 h-[78px] bg-card border-t border-line grid grid-cols-4 px-2 pt-2 pb-[18px] z-30`. `pb` memakai `max(18px, env(safe-area-inset-bottom))`.
- **Render:** komponen **tidak dirender** di desktop (`{#if !$isDesktop}` dengan store `isDesktop` dari `ui.ts` = `matchMedia('(min-width:1024px)')`), bukan disembunyikan CSS. Berlaku juga untuk `TopNav` (`{#if $isDesktop}`) dan `Fab`.
- **Ikon (SVG inline, stroke `currentColor`, `stroke-width 1.7`, aktif `2.1`):**
  - Home: `M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z`
  - Transaksi: `M4 6h16M4 12h16M4 18h10`
  - Laporan: `M4 19V10m5 9V5m5 14v-7m5 7V8`
  - Master: `rect x=3 y=6 w=18 h=13 rx=2` + `M3 10h18M16 15h2`
- **State:** tidak aktif `text-ink2`; aktif `text-ink`. Tidak ada latar/indikator lain.
- **Tampil:** hanya < 1024px. Di ≥1024px disembunyikan, nav pindah ke `TopNav`.

### 5.15 `TopNav.svelte` (desktop)

- `h-[60px] bg-card border-b border-line flex items-center px-7 gap-7`; kiri logo 30px + "Dompet Suami" `font-semibold text-[16px]`; kanan `<nav aria-label="Navigasi atas">` dengan `<button>` `px-3.5 py-2 rounded-seg text-[13.5px] font-medium text-ink2`, aktif `bg-chip text-ink aria-current="page"`; paling kanan `Pill ink` "+ Catat" → pindah ke Transaksi.
- Tampil hanya ≥1024px.

### 5.16 `Fab.svelte`

- `fixed right-4 bottom-[94px] w-[52px] h-[52px] rounded-fab bg-accent text-on-accent text-[28px] font-light grid place-items-center shadow-[var(--shadow-fab)] z-30`, `aria-label="Catat transaksi"`. (Di e2e, cari tombol nav dengan `exact: true` agar tidak bentrok dengan FAB.)
- Tampil hanya < 1024px dan hanya di view Home dan Laporan (di Transaksi form sudah terlihat; di Master tidak relevan).
- Klik → pindah ke view Transaksi, fokus ke field jumlah.

### 5.17 `BarChart.svelte` (tren 12 bulan)

- **Data:** `MonthlyPoint[]` 12 bulan (income, expense).
- **Gambar:** SVG `viewBox 0 0 W 150`, `W = 340` (mobile) / `700` (desktop). `W` dipilih komponen induk lewat prop `width` berdasarkan store `isDesktop`. Geometri (semua dalam unit viewBox):
  - margin kiri `ML = 34` (ruang label sumbu Y), kanan `MR = 4`; plot x dari `ML` sampai `W − MR`; plot y dari `20` (atas) sampai `130` (garis dasar).
  - lebar kolom per bulan `colW = (W − ML − MR) / 12`; batang income di `x = ML + i*colW + (colW − 2*bw − 1)/2`, batang expense tepat di kanannya + `bw + 1`; `bw = 9` (mobile) / `18` (desktop); `rx 2`.
  - tinggi batang `h = value / maxValue * 110`, `y = 130 − h`; batang dengan nilai 0 tidak digambar.
  - 3 garis grid horizontal `stroke var(--line)` di `r ∈ {1, 2/3, 1/3}` (`y = 130 − 110*r`).
  - label bulan: `x = ML + i*colW + colW/2`, `y = 145`, `font-size 9` (mobile) / `10` (desktop), mono, `text-anchor middle`, atribut `data-month="YYYY-MM"` (e2e menghitung 12 elemen ini). Bulan berjalan `fill var(--ink) font-weight 600`, lainnya `fill var(--ink-2)`.
  - label sumbu Y 3 nilai `formatCompact(maxValue * r)` untuk `r ∈ {1, 2/3, 1/3}` di `x = 0`, `y = 130 − 110*r + 3`, `font-size 9`, `text-anchor start`, `fill var(--ink-2)`, `data-axis="y"`. Garis grid mengikuti r yang sama (bukan 25/50/75).
  - warna batang: income `fill var(--pos-fill)`, expense `fill var(--accent-fill)`.
- **Skala:** `maxValue = max(1, …semua income & expense)`.
- **Interaksi:** per bulan satu `rect` transparan `x = ML + i*colW`, lebar `colW`, tinggi penuh, `pointer-events all`; `click`/`mouseenter` → set `active = i`; `mouseleave` SVG → `active = null`. Tooltip dirender di luar SVG (bukan `foreignObject`): `div` absolut di atas kartu (`relative` pada wadah), teks `Pill neutral` `"Okt · +18,34 jt · −12,28 jt"`, posisinya `left = (ML + active*colW + colW/2) / W * 100%`, `transform: translateX(-50%)`, `top: 0`. Satu tooltip pada satu waktu. Tanpa library.
- **Legenda:** di bawah SVG `flex gap-3.5 caption-xs text-ink2`; kotak 10×10 `rounded-[3px]`; kanan "Ketuk bulan untuk angka".
- **Kosong:** jika semua nilai 0 → teks `body-sm text-ink2 italic` "Belum ada data 12 bulan terakhir."
- **Mengganti** `LineChart.svelte` (hapus file lama).

### 5.18 `CategoryBars` (bukan komponen baru)

Daftar `ListItem` dengan `percent`. Maksimal 5 kategori teratas + 1 baris gabungan "N kategori lain" dengan ikon `⋯`. Persen = nilai ÷ total expense periode. Mengganti `PieChart.svelte` (hapus file lama).

### 5.19 Ikon kategori & akun

Ikon = **emoji** disimpan di kolom baru `icon text` (nullable) di tabel `accounts` dan `categories`. Default jika null:

| Jenis | Emoji default |
|---|---|
| account.bank | 🏦 |
| account.cash | 💵 |
| account.ewallet | 💳 |
| category.income | 💼 |
| category.expense | 🧾 |
| transfer (bukan kategori) | ⇄ (karakter teks, `text-ink2`) |

Pilihan emoji di sheet edit (chip 40×40): akun `🏦 💳 💵 🛍️ 📱 🐔`; kategori expense `🏠 🛒 🍜 ☕ 🚗 ⚡ 🎬 💝 🧾 ⋯`; kategori income `💼 🤝 🎁 📈`. Hanya dari daftar ini; tidak ada emoji picker bebas.

Migrasi: `supabase/schema.sql` ditambah `alter table accounts add column if not exists icon text; alter table categories add column if not exists icon text;`. Jalankan di lokal (port 55322) dan nanti di hosted oleh pemilik repo, bukan opencode.

---

## 6. Logo & ikon aplikasi

### 6.1 Logo

Celengan ayam jadul (tanah liat), ilustrasi vektor glossy. Sumber: `<symbol id="celengan">` di `docs/design/mockup-v4.html` baris `<defs>` sampai `</symbol>`. Salin **apa adanya** ke file mandiri `public/logo.svg` dengan `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` sebagai root dan `<defs>` di dalamnya (gradien `gBody gHead gComb gTail gBeak gGloss gSlot` harus ikut). Warna di dalam logo **hardcoded** (bukan CSS var) agar tampil benar sebagai ikon di luar aplikasi — ini perbaikan untuk bug ikon home screen saat ini (`favicon.svg` memakai `var(--color-ink)` yang tidak terdefinisi di luar app).

Pemakaian di app: `<img src="/logo.svg" alt="" width=… height=…>`, bukan `<use>`. File `public/logo.svg` dibuat di **Tugas 1** (bukan Tugas 10) karena TopNav (Tugas 3) dan Home (Tugas 5) sudah memakainya. Perhatian: Vite dev server membalas HTML (status 200) untuk file yang tidak ada, jadi gambar rusak tidak memunculkan error — periksa file benar-benar ada di `public/`.

| Tempat | Ukuran | Wadah |
|---|---|---|
| Avatar kanan atas Home (mobile) | 26px | lingkaran 40px `bg-accent-soft` |
| TopNav desktop | 30px | tanpa wadah |
| Favicon | `public/logo.svg` langsung | — |

### 6.2 Ikon PWA (PNG)

Dibuat dari `public/logo.svg` dengan latar `#f4f3ef`, radius 0 (OS yang membulatkan). File:

| File | Ukuran | Catatan |
|---|---|---|
| `public/icons/icon-192.png` | 192×192 | logo 70% lebar, tengah |
| `public/icons/icon-512.png` | 512×512 | logo 70% lebar, tengah |
| `public/icons/icon-maskable-512.png` | 512×512 | logo **60%** lebar, tengah (safe zone maskable 80% diameter) |
| `public/icons/apple-touch-icon.png` | 180×180 | logo 70%, latar `#f4f3ef` |

Cara buat: `npx -y sharp-cli` tidak dipakai (hindari dependency). Pakai skrip Node sekali jalan di `scripts/make-icons.mjs` dengan `@resvg/resvg-js`? **Tidak** — dependency baru. Cara yang dipilih: buka `public/logo.svg` di browser, screenshot dengan Playwright (sudah ada sebagai devDependency) pada viewport ukuran ikon. Skrip `scripts/make-icons.mjs` berisi: launch chromium → `setContent` HTML dengan body `background:#f4f3ef` dan `<img>` logo di tengah ukuran 70%/60% → `page.screenshot` ke tiap file. Jalankan sekali, commit PNG-nya.

### 6.3 Manifest

`public/manifest.webmanifest`:

```json
{
  "name": "Dompet Suami",
  "short_name": "Dompet",
  "description": "Buku kas rumah tangga: pemasukan, pengeluaran, transfer antar sumber dana.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f4f3ef",
  "theme_color": "#f4f3ef",
  "lang": "id",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

`index.html` `<head>` ditambah: `<link rel="manifest" href="/manifest.webmanifest">`, `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="default">`, `<meta name="apple-mobile-web-app-title" content="Dompet">`. `theme-color` light diganti `#f4f3ef` (sudah), dark `#101312` (sudah).

### 6.4 Service worker

Tanpa plugin (tidak ada dependency baru). File `public/sw.js`, didaftarkan di `src/main.ts` hanya di production (`import.meta.env.PROD`):

- `install`: `caches.open(CACHE)` lalu `addAll(['/', '/manifest.webmanifest', '/logo.svg'])`, kemudian `skipWaiting()`. (`/` adalah dokumen HTML yang dilayani Vercel untuk semua rute; **jangan** memakai `/index.html`.)
- `activate`: hapus cache lain selain `CACHE = 'dompet-v1'`, `clients.claim()`.
- `fetch`, hanya `GET`:
  - `request.mode === 'navigate'` → *network-first*: coba `fetch`, simpan salinan ke cache dengan kunci `'/'`; jika gagal (offline) → `caches.match('/')`.
  - same-origin selain navigasi (JS/CSS/PNG hash Vite) → *stale-while-revalidate* (balas cache jika ada, fetch di latar untuk memperbarui; jika tidak ada, fetch lalu simpan).
  - `fonts.googleapis.com` dan `fonts.gstatic.com` → *cache-first* (respons opaque boleh disimpan).
  - host lain (Supabase) → **tidak disentuh** (`return;` tanpa `respondWith`).
- Bump `CACHE` ke `dompet-v2` dst tiap rilis yang mengubah shell.

Batas yang diterima: aset JS/CSS ber-hash baru tersimpan saat pertama kali diminta **setelah SW aktif**, jadi kriteria offline berlaku setelah aplikasi dibuka **dua kali** (pertama memasang SW, kedua mengisi cache). Data tetap butuh koneksi — tampilkan banner `caption text-ink2` "Offline — data mungkin tidak terbaru" di bawah header jika `navigator.onLine === false`.

---

## 7. Gerak

| Hal | Durasi | Easing |
|---|---|---|
| Hover/fokus warna | 140ms | ease |
| Tombol active | 80ms | ease |
| Sheet masuk/keluar | 220ms / 160ms | ease-out / ease-in |
| Dots carousel | 160ms | ease |
| Ganti view (Home→Transaksi) | tanpa animasi | — |
| Toast simpan berhasil | muncul 180ms, tahan 2.5s, hilang 180ms | ease |

`prefers-reduced-motion: reduce` sudah ditangani global di `app.css`; pertahankan.

---

## 8. Aksesibilitas (wajib, dicek di e2e)

- Semua ikon-only button punya `aria-label`.
- Tablist/tab memakai `role` dan `aria-selected` (e2e lama bergantung ini).
- Sheet: `role="dialog" aria-modal aria-labelledby`, fokus terkunci di dalam, Esc menutup.
- Kontras: nilai token §2.1 sudah dihitung ≥ 4,5:1 untuk semua pasangan teks yang dipakai dokumen ini. Label kecil (`label`, `caption-xs`) selalu `--ink-2`, tidak pernah `--accent`/`--pos`.
- Fokus terlihat: `outline 2px solid var(--ink); outline-offset 2px` (sudah global).
- Angka dengan tanda: `aria-label` tetap teks penuh (`"minus Rp 147.500"` tidak perlu; screen reader membaca U+2212 sebagai "minus").

---

## 9. Larangan ringkas (checklist review)

- [ ] Tidak ada hex/rgb di file `.svelte` (hanya di `app.css`, `public/logo.svg`, `public/manifest.webmanifest`).
- [ ] Tidak ada ukuran font di luar skala §3.1 (teks SVG chart 9–10px dikecualikan).
- [ ] Tidak ada radius di luar §4.2.
- [ ] Tidak ada library UI/chart baru di `package.json`.
- [ ] Tidak ada runes Svelte 5.
- [ ] Tidak ada `confirm()`/`alert()` native.
- [ ] Tidak ada teks "Supabase" di UI.
- [ ] Tidak ada komponen yang hanya tampil di desktop, **kecuali** yang disebut eksplisit di `design.md`: TopNav, legenda §2.2, tabel transaksi terbaru §2.8, dan penyembunyian StatStrip §2.4. Prinsip §1 butir 4 berarti "tidak menambah pengecualian baru di luar daftar itu".
- [ ] Dark mode dicek di tiap layar (DevTools → Rendering → prefers-color-scheme).
