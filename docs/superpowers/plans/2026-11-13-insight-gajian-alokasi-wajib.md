# Insight Periode Gajian, Alokasi, dan Isian Wajib — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home membaca keuangan per periode gajian, kategori bisa ditandai alokasi, dan transaksi wajib lengkap saat disimpan.

**Architecture:** Semua aturan berupa fungsi murni di `src/lib/*.ts` dengan `*.check.ts` (node:assert). Komponen Svelte hanya memanggil fungsi itu. Satu kolom baru `categories.allocation`; kode tetap berjalan bila kolom belum ada di hosted.

**Tech Stack:** Svelte 5 sintaks legacy, TypeScript, Tailwind v4 (token), Supabase, Playwright (`scripts/e2e.mjs`), `tsx` untuk check.

**Spec:** `docs/superpowers/specs/2026-11-13-insight-gajian-alokasi-wajib-design.md` — baca lebih dulu; rencana ini tidak mengulang isinya.

## Global Constraints

- Svelte legacy saja: `export let`, `$:`, `on:click`. Tanpa runes.
- Tidak ada hex/rgb di `.svelte`; ukuran font hanya dari `docs/design-system.md` §3.1; tidak ada dependency baru.
- TDD wajib di setiap tugas: tulis tes → jalankan → lihat MERAH untuk alasan yang benar → baru ubah kode → HIJAU. Jangan memalsukan merah atau hijau.
- Supabase hosted hanya baca. Jangan menjalankan migrasi, `supabase db push`, atau perintah tulis ke hosted. Jangan membaca atau menampilkan `.env`, `.envrc`, `supabase/.temp/`.
- Lokal: Postgres `127.0.0.1:55322`, API `:55321`. Port 5432x milik proyek lain. `.env.local` harus menunjuk `http://127.0.0.1:55321`; guard di `scripts/e2e.mjs` tidak boleh dilepas.
- `npm run test:ui` men-`truncate` tabel lokal (perilaku yang sudah ada).
- Commit kecil per tugas di branch `feat/insight-gajian-alokasi`, Conventional Commits berbahasa Inggris. Jangan `git push`. Hanya `git add` berkas tugas itu; pohon kerja punya berkas kotor lain yang tidak boleh ikut.
- Ambang keterangan `500_000`; batas insight `5`; pesan persis: `Pilih kategori dulu.` dan `Isi keterangan untuk pengeluaran Rp 500 rb ke atas.`

## Review Focus

1. Gaji berikutnya terlambat dicatat (`remaining <= 0`): tidak boleh muncul "Sisa -3 hari" atau proyeksi. → tes di Task 4.
2. Periode tanpa pemasukan tetapi ada alokasi: tidak ada `NaN`/`Infinity`, teks alokasi tanpa persen. → tes di Task 4.
3. Hosted belum punya kolom `allocation`: menyimpan kategori tidak boleh mengirim kunci itu. → tes `categoryPayload` di Task 8.
4. Transaksi lama dengan kategori yang sudah dihapus: dianggap belum lengkap, bukan lolos. → tes di Task 1.
5. Mengedit transaksi lama yang belum lengkap: simpan harus ditolak sampai lengkap. → e2e di Task 11.

## Peta berkas

| Berkas | Tanggung jawab | Tugas |
|---|---|---|
| `src/lib/entry-rules.ts` (baru) | satu-satunya aturan "lengkap" | 1 |
| `src/lib/reports.ts` | `activePeriod`, `periodDays`, alokasi di `categoryReport`, `spendingRows` | 2 |
| `src/lib/dashboard.ts` | `topCategories` memisahkan alokasi | 3 |
| `src/lib/insights.ts` | insight per periode aktif | 4 |
| `src/lib/history.ts` | filter `incomplete` | 5 |
| `src/lib/store.ts` | penegakan aturan; `allocationSupported`; hapus `monthSummary` | 6, 8, 9 |
| `src/lib/master.ts` | `categoryPayload` | 8 |
| `src/components/EntryForm.svelte` | error per field | 7 |
| `src/components/MasterSheet.svelte`, `CategoryManager.svelte` | toggle dan tanda alokasi | 8 |
| `src/views/Home.svelte`, `ui/AccountRail.svelte` | Home per periode | 9 |
| `src/components/report/CategoryTab.svelte` | tab Kategori | 10 |
| `src/components/TransactionList.svelte` | chip "Perlu dilengkapi" | 11 |

**Ketergantungan:** Task 1, 2, 3 saling bebas (berkas berbeda) setelah Task 0. Task 4 butuh 1 dan 2; Task 5 butuh 1; keduanya saling bebas. Task 6–11 semuanya menyentuh `scripts/e2e.mjs` dan harus berurutan.

---

### Task 0: Baseline hijau, model, dan skema

**Files:**
- Modify: `src/models/Category.ts:7`, `supabase/schema.sql:19-26`
- Create: `supabase/migrations/2026-11-13-allocation.sql`

- [ ] **Step 1: Nyalakan stack lokal.** `supabase status` harus menunjukkan port 553xx (bila mati: `supabase start`). Jalankan `npm run dev` di port 5173 (latar belakang). Bila guard e2e memicu, perbaiki `.env.local`, jangan melepas guard.
- [ ] **Step 2: Baseline.** Jalankan `npm run check`, `npm run build`, `npm run test:ui`. Ketiganya harus hijau ("semua check lulus"). Bila tidak, berhenti dan laporkan; jangan lanjut.
- [ ] **Step 3: Model.** Tambah `allocation?: boolean;` di `Category`.
- [ ] **Step 4: Skema.** Di `create table categories` tambah `allocation boolean not null default false,` setelah `icon`; di bawah blok "Upgrade existing databases" tambah `alter table categories add column if not exists allocation boolean not null default false;`. Berkas migrasi berisi `alter` yang sama dengan komentar satu baris.
- [ ] **Step 5: Terapkan di lokal.** `PGPASSWORD=postgres psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -f supabase/migrations/2026-11-13-allocation.sql`, lalu `… -c "\d categories"` harus memuat `allocation | boolean | not null | false`.
- [ ] **Step 6:** `npm run check` hijau. Commit: `feat(db): allocation flag on categories`.

### Task 1: Aturan kelengkapan transaksi

**Files:**
- Create: `src/lib/entry-rules.ts`, `src/lib/entry-rules.check.ts`
- Modify: `package.json:9` (tambah `&& tsx src/lib/entry-rules.check.ts` di akhir skrip `check`)

**Interfaces:**
- Produces:
  ```ts
  export const DESCRIPTION_REQUIRED_FROM = 500_000;
  export interface EntryProblem { field: 'category' | 'description'; message: string }
  export function entryProblem(
    entry: Pick<Transaction, 'type' | 'amount'> & { id?: string; categoryId?: string; description?: string; transferId?: string },
    categories: Category[]
  ): EntryProblem | null;
  ```

- [ ] **Step 1: Tulis check yang gagal** (`src/lib/entry-rules.check.ts`):

```ts
import assert from 'node:assert/strict';
import type { Category } from '../models/Category';
import { DESCRIPTION_REQUIRED_FROM, entryProblem } from './entry-rules';

const cats = [
  { id: 'food', name: 'Makanan', type: 'expense' },
  { id: 'wife', name: 'Transfer Ke Istri', type: 'expense', allocation: true },
  { id: 'salary', name: 'Gaji', type: 'income' }
] as Category[];
const noCat = { field: 'category', message: 'Pilih kategori dulu.' };
const noDesc = { field: 'description', message: 'Isi keterangan untuk pengeluaran Rp 500 rb ke atas.' };

assert.equal(DESCRIPTION_REQUIRED_FROM, 500_000);
assert.equal(entryProblem({ type: 'expense', amount: 1000, transferId: 'tr1' }, cats), null);
assert.equal(entryProblem({ id: 'fee_tr1', type: 'expense', amount: 2500 }, cats), null);
assert.deepEqual(entryProblem({ type: 'expense', amount: 1000 }, cats), noCat);
assert.deepEqual(entryProblem({ type: 'expense', amount: 1000, categoryId: '' }, cats), noCat);
assert.deepEqual(entryProblem({ type: 'expense', amount: 1000, categoryId: 'gone' }, cats), noCat);
assert.deepEqual(entryProblem({ type: 'income', amount: 1000 }, cats), noCat);
assert.equal(entryProblem({ type: 'expense', amount: 499_999, categoryId: 'food', description: '' }, cats), null);
assert.deepEqual(entryProblem({ type: 'expense', amount: 500_000, categoryId: 'food', description: '  ' }, cats), noDesc);
assert.equal(entryProblem({ type: 'expense', amount: 500_000, categoryId: 'food', description: 'PLN' }, cats), null);
assert.equal(entryProblem({ type: 'expense', amount: 8_500_000, categoryId: 'wife' }, cats), null);
assert.equal(entryProblem({ type: 'income', amount: 18_214_145, categoryId: 'salary' }, cats), null);
console.log('entry-rules self-check: 12 assertions passed');
```

- [ ] **Step 2:** `npx tsx src/lib/entry-rules.check.ts` → GAGAL karena modul `./entry-rules` belum ada.
- [ ] **Step 3:** Implementasikan `entry-rules.ts` sesuai tabel spec §5.5 (urutan kondisi 1→4).
- [ ] **Step 4:** `npm run check` hijau, termasuk baris "entry-rules self-check".
- [ ] **Step 5:** Commit: `feat(entry): single completeness rule for transactions`.

### Task 2: Periode aktif dan alokasi di laporan

**Files:**
- Modify: `src/lib/reports.ts`, `src/lib/reports.check.ts`

**Interfaces:**
- Consumes: `paydayPeriods`, `PaydayPeriod`, `MONTHS`, `fmtDay` (sudah ada di `reports.ts`).
- Produces:
  ```ts
  export interface ActivePeriod {
    kind: 'payday' | 'month'; start: Date; end: Date; expectedEnd: Date;
    prev?: { start: Date; end: Date };
    label: string; short: string; word: 'periode ini' | 'bulan ini'; payday?: PaydayPeriod;
  }
  export function activePeriod(paydays: PaydayPeriod[], now: Date): ActivePeriod;
  export function periodDays(period: ActivePeriod, now: Date): { elapsed: number; total: number; remaining: number };
  // CategoryRow += allocation: boolean   (baris Total: false)
  // CategoryReport += split: { real: number; allocation: number }   (pengeluaran saja)
  export function spendingRows(report: CategoryReport): { real: CategoryRow[]; allocation: CategoryRow[] };
  ```
  `categoryReport` tidak mengubah tanda tangan, urutan, maupun `percent`.

- [ ] **Step 1: Tambahkan check yang gagal** di akhir `reports.check.ts` (sebelum `console.log` penutup; impor `activePeriod, periodDays, spendingRows`):

```ts
// --- activePeriod ---
const apCats = [{ id: 'salary', name: 'Gaji', type: 'income' }] as Category[];
const sal = (id: string, y: number, m: number, d: number): Transaction =>
  ({ id, type: 'income', amount: 18_214_145, source: 'bank', categoryId: 'salary', description: '', timestamp: new Date(y, m, d, 12).toISOString() });
const apNow = new Date(2026, 10, 13, 10);
const at = (y: number, m: number, d: number) => new Date(y, m, d).getTime();

const one = activePeriod(paydayPeriods([sal('s1', 2026, 9, 27)], apCats, apNow), apNow);
assert.equal(one.kind, 'payday');
assert.equal(one.start.getTime(), at(2026, 9, 27));
assert.equal(one.end.getTime(), 8.64e15);
assert.equal(one.expectedEnd.getTime(), at(2026, 10, 27));
assert.equal(one.prev, undefined);
assert.deepEqual([one.label, one.short, one.word], ['Gajian 27 Okt', '27 Okt', 'periode ini']);
assert.equal(one.payday?.amount, 18_214_145);
assert.deepEqual(periodDays(one, apNow), { elapsed: 18, total: 31, remaining: 13 });

const two = activePeriod(paydayPeriods([sal('s0', 2026, 8, 27), sal('s1', 2026, 9, 27)], apCats, apNow), apNow);
assert.deepEqual([two.prev?.start.getTime(), two.prev?.end.getTime()], [at(2026, 8, 27), at(2026, 9, 27)]);

const future = activePeriod(paydayPeriods([sal('s1', 2026, 9, 27), sal('s2', 2026, 10, 27)], apCats, apNow), apNow);
assert.equal(future.start.getTime(), at(2026, 9, 27), 'gaji masa depan diabaikan');
assert.equal(future.end.getTime(), at(2026, 10, 27));

const febNow = new Date(2027, 1, 5, 10);
const clamp = activePeriod(paydayPeriods([sal('s3', 2027, 0, 31)], apCats, febNow), febNow);
assert.equal(clamp.expectedEnd.getTime(), at(2027, 1, 28), 'dijepit ke akhir bulan');

const late = new Date(2026, 11, 5, 10);
assert.ok(periodDays(activePeriod(paydayPeriods([sal('s1', 2026, 9, 27)], apCats, late), late), late).remaining <= 0);

// jam pada `now` tidak mengubah hitungan hari
assert.deepEqual(periodDays(one, new Date(2026, 10, 13, 14)), { elapsed: 18, total: 31, remaining: 13 });
assert.deepEqual(periodDays(one, new Date(2026, 10, 13, 23, 59)), { elapsed: 18, total: 31, remaining: 13 });
const payNoon = new Date(2026, 9, 27, 14);
assert.deepEqual(periodDays(activePeriod(paydayPeriods([sal('s1', 2026, 9, 27)], apCats, payNoon), payNoon), payNoon), { elapsed: 1, total: 31, remaining: 30 });
const monthEnd = new Date(2026, 10, 30, 14);
assert.deepEqual(periodDays(activePeriod([], monthEnd), monthEnd), { elapsed: 30, total: 30, remaining: 0 });

const none = activePeriod([], apNow);
assert.equal(none.kind, 'month');
assert.deepEqual([none.start.getTime(), none.end.getTime(), none.expectedEnd.getTime()], [at(2026, 10, 1), at(2026, 11, 1), at(2026, 11, 1)]);
assert.deepEqual([none.prev?.start.getTime(), none.prev?.end.getTime()], [at(2026, 9, 1), at(2026, 10, 1)]);
assert.deepEqual([none.label, none.short, none.word], ['November 2026', 'Nov', 'bulan ini']);

// --- alokasi di categoryReport ---
assert.deepEqual(catRep.split, { real: 600_000, allocation: 0 });
assert.ok(catRep.expense.every((r) => r.allocation === false));
const allocCats = [...categories, { id: 'wife', name: 'Istri', type: 'expense', allocation: true }] as Category[];
const allocTx: Transaction[] = [...catTx, { id: 'c5', type: 'expense', amount: 1_000_000, source: 'bank', categoryId: 'wife', timestamp: '2026-10-13T12:00:00Z', description: '' }];
const allocRep = categoryReport(allocCats, allocTx, start, end, prevStart, prevEnd);
assert.deepEqual(allocRep.split, { real: 600_000, allocation: 1_000_000 });
assert.equal(allocRep.total.expense.amount, 1_600_000, 'total tetap semua uang keluar');
assert.deepEqual([allocRep.expense[0].id, allocRep.expense[0].allocation], ['wife', true], 'urutan categoryReport tidak berubah');
assert.equal(Math.round(allocRep.expense[0].percent), 63, 'persen categoryReport tetap terhadap total');
const rows = spendingRows(allocRep);
assert.deepEqual(rows.real.map((r) => r.id), ['food', 'util', 'trans']);
assert.equal(Math.round(rows.real[0].percent), 50, 'persen terhadap belanja');
assert.deepEqual(rows.allocation.map((r) => [r.id, r.percent]), [['wife', 0]]);
```

- [ ] **Step 2:** `npx tsx src/lib/reports.check.ts` → GAGAL: `activePeriod` bukan ekspor.
- [ ] **Step 3:** Implementasikan. Gajian terpilih = entri pertama `paydays` (urut terbaru dulu) dengan `start <= now`. Selisih hari dihitung dari tengah malam lokal `now` (jam diabaikan), lalu dibulatkan (`Math.round(ms / 86_400_000)`), `elapsed` minimal 1. Label bulan lewat `toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })`.
- [ ] **Step 4:** `npm run check` hijau.
- [ ] **Step 5:** Commit: `feat(report): active payday period and allocation split`.

### Task 3: `topCategories` memisahkan alokasi

**Files:**
- Modify: `src/lib/dashboard.ts:71-87`, `src/lib/dashboard.check.ts`

**Interfaces:**
- Produces: `topCategories(tx, categories, limit): { top: CategorySlice[]; rest: CategorySlice | null; total: number; allocation: CategorySlice[] }`. `top`, `rest`, `total` hanya belanja; `allocation` satu slice per kategori alokasi, urut nilai, `percent: 0`.

- [ ] **Step 1:** Di `dashboard.check.ts` ubah baris 11 menjadi `… rest: null, total: 1000, allocation: [] }` dan tambah:

```ts
const mixCats = [...categories, { id: 'wife', name: 'Istri', type: 'expense', allocation: true }] as import('../models/Category').Category[];
const mixTx: Transaction[] = [...tx, { id: 'w', type: 'expense', amount: 2000, description: '', source: 'bank', categoryId: 'wife', timestamp: new Date(2026, 9, 2, 12).toISOString() }];
assert.deepEqual(topCategories(mixTx, mixCats, 5), {
  top: [{ id: 'food', name: 'Makan', icon: '🧾', value: 1000, percent: 100 }],
  rest: null, total: 1000,
  allocation: [{ id: 'wife', name: 'Istri', icon: '🧾', value: 2000, percent: 0 }]
});
```
  Perbarui angka di `console.log` penutup.
- [ ] **Step 2:** `npx tsx src/lib/dashboard.check.ts` → GAGAL di deepEqual (kunci `allocation` tidak ada).
- [ ] **Step 3:** Implementasikan.
- [ ] **Step 4:** `npm run check` dan `npm run build` hijau (Home masih membaca `top`/`rest`/`total`).
- [ ] **Step 5:** Commit: `feat(home): top categories exclude allocation`.

### Task 4: Insight per periode aktif

**Files:**
- Modify: `src/lib/insights.ts` (tulis ulang isi `buildInsights`), `src/lib/insights.check.ts` (tulis ulang)

**Interfaces:**
- Consumes: `activePeriod`, `periodDays`, `paydayPeriods` (Task 2); `entryProblem` (Task 1); `operating` (`ledger.ts`).
- Produces: `Insight['id']` = `'incomplete' | 'top-category' | 'allocation' | 'savings-ratio' | 'daily-average' | 'vs-previous' | 'new-category'`. Tanda tangan `buildInsights(transactions, categories, now)` tetap. Maksimal 5.

**Teks persis** (`W` = `period.word`; `P` = "gajian lalu" atau "bulan lalu"; nominal ringkas = `'Rp ' + formatCompact(x)`):

| id | tone | teks (bagian tebal dalam `**`) |
|---|---|---|
| `incomplete` | neg | `**N transaksi** (Rp X) perlu dilengkapi. Buka Riwayat → Perlu dilengkapi.` |
| `top-category` | neg | `**{nama}** adalah pengeluaran terbesar: Rp X (N% dari belanja).` |
| `allocation` | neutral | satu kategori: `Alokasi **{nama}** Rp X (N% dari pemasukan).`; lebih: `Alokasi **(k kategori)** Rp X (N% dari pemasukan).`; tanpa pemasukan: berakhir `Rp X.` |
| `savings-ratio` | neg / pos bila ≥ 20 | rasio < 0: `Pengeluaran melebihi pemasukan W (**N%** lebih besar).`; selain itu `Rasio tabungan W **N%** — di atas|di bawah target 20%.` |
| `daily-average` | neutral | `remaining > 0`: `Rata-rata belanja harian **{formatIDR(avg)}**. Sisa N hari, proyeksi sampai gajian berikutnya **{formatIDR(avg × total)}**.` (bulan: `proyeksi akhir bulan`); selain itu `Rata-rata belanja harian **{formatIDR(avg)}** W.` |
| `vs-previous` | neg naik / pos turun / neutral sama | `Belanja naik|turun **N%** dibanding rentang yang sama P.`; 0%: `Belanja **sama** dengan rentang yang sama P.` |
| `new-category` | neutral | `Kategori baru W: **{nama}** Rp X.` |

Definisi angka ada di spec §5.3. `incomplete` dihitung atas **semua** transaksi, bukan hanya periode.

- [ ] **Step 1: Tulis ulang `insights.check.ts`:**

```ts
import assert from 'node:assert/strict';
import { buildInsights, insightText } from './insights';
import { formatCompact, formatIDR } from './format';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';

const cats = [
  { id: 'salary', name: 'Gaji', type: 'income' },
  { id: 'food', name: 'Makanan', type: 'expense' },
  { id: 'house', name: 'Operasional Rumah', type: 'expense' },
  { id: 'wife', name: 'Transfer Ke Istri', type: 'expense', allocation: true }
] as Category[];
const tx = (id: string, type: 'income' | 'expense', amount: number, categoryId: string | undefined, m: number, d: number, description = 'x'): Transaction =>
  ({ id, type, amount, description, source: 'bank', categoryId, timestamp: new Date(2026, m, d, 12).toISOString() });
const now = new Date(2026, 10, 13, 10);
const ids = (list: ReturnType<typeof buildInsights>) => list.map((i) => i.id);
const text = (list: ReturnType<typeof buildInsights>, id: string) => insightText(list.find((i) => i.id === id)!);
const rp = (n: number) => 'Rp ' + formatCompact(n);

// 1. Kasus nyata: gaji 27 Okt, belanja November, sekarang 13 Nov.
const real = [
  tx('s', 'income', 18_214_145, 'salary', 9, 27),
  tx('w', 'expense', 8_500_000, 'wife', 9, 27, ''),
  tx('h', 'expense', 3_289_364, 'house', 9, 28),
  tx('u', 'expense', 1_189_149, undefined, 10, 3),
  tx('f', 'expense', 225_902, 'food', 10, 5)
];
const a = buildInsights(real, cats, now);
assert.deepEqual(ids(a), ['incomplete', 'top-category', 'allocation', 'savings-ratio', 'daily-average']);
assert.ok(a.every((i) => !insightText(i).includes('melebihi pemasukan')), 'regresi 2558%');
assert.equal(text(a, 'incomplete'), `1 transaksi (${rp(1_189_149)}) perlu dilengkapi. Buka Riwayat → Perlu dilengkapi.`);
assert.equal(text(a, 'top-category'), `Operasional Rumah adalah pengeluaran terbesar: ${rp(3_289_364)} (70% dari belanja).`);
assert.equal(text(a, 'allocation'), `Alokasi Transfer Ke Istri ${rp(8_500_000)} (47% dari pemasukan).`);
assert.equal(text(a, 'savings-ratio'), 'Rasio tabungan periode ini 28% — di atas target 20%.');
const avg = 4_704_415 / 18;
assert.equal(text(a, 'daily-average'), `Rata-rata belanja harian ${formatIDR(avg)}. Sisa 13 hari, proyeksi sampai gajian berikutnya ${formatIDR(avg * 31)}.`);

// 2. Alokasi tidak pernah menjadi tabungan: rasio sama dengan atau tanpa penanda.
const plain = cats.map((c) => ({ ...c, allocation: false })) as Category[];
assert.equal(text(buildInsights(real, plain, now), 'savings-ratio'), text(a, 'savings-ratio'));

// 3. incomplete dihitung sepanjang waktu.
const old = buildInsights([...real, tx('o', 'expense', 1000, undefined, 0, 5)], cats, now);
assert.ok(text(old, 'incomplete').startsWith('2 transaksi'));

// 4. Dua gajian: bandingkan rentang hari yang sama (27 Sep–14 Okt), bukan periode lalu penuh.
const pair = [
  tx('s0', 'income', 10_000_000, 'salary', 8, 27), tx('p1', 'expense', 1_000_000, 'food', 9, 1), tx('p2', 'expense', 5_000_000, 'food', 9, 20),
  tx('s1', 'income', 10_000_000, 'salary', 9, 27), tx('c1', 'expense', 2_000_000, 'food', 10, 1)
];
const b = buildInsights(pair, cats, now);
assert.deepEqual(ids(b), ['top-category', 'savings-ratio', 'daily-average', 'vs-previous']);
assert.equal(text(b, 'vs-previous'), 'Belanja naik 100% dibanding rentang yang sama gajian lalu.');

// 5. Satu gajian: tanpa pembanding.
assert.ok(!ids(a).includes('vs-previous') && !ids(a).includes('new-category'));

// 6. Tanpa gajian → bulan kalender.
const monthCats = [{ id: 'food', name: 'Makan', type: 'expense' }] as Category[];
const m = buildInsights([tx('e', 'expense', 1000, 'food', 9, 10)], monthCats, new Date(2026, 9, 30));
assert.equal(text(m, 'top-category'), 'Makan adalah pengeluaran terbesar: Rp 1 rb (100% dari belanja).');
assert.ok(text(m, 'daily-average').includes('proyeksi akhir bulan'));
assert.ok(!ids(m).includes('savings-ratio'));

// 7. Gaji berikutnya terlambat dicatat: tanpa proyeksi dan tanpa "Sisa".
const lateText = text(buildInsights(real, cats, new Date(2026, 11, 5, 10)), 'daily-average');
assert.ok(!lateText.includes('Sisa') && lateText.endsWith('periode ini.'), lateText);

// 8. Alokasi tanpa pemasukan: tanpa persen, tanpa NaN.
const noIncome = buildInsights([tx('w', 'expense', 2000, 'wife', 10, 2, '')], cats, now);
assert.equal(text(noIncome, 'allocation'), 'Alokasi Transfer Ke Istri Rp 2 rb.');
assert.ok(noIncome.every((i) => !/NaN|Infinity/.test(insightText(i))));

// 9. Batas dan kosong.
assert.ok(buildInsights([...real, ...pair], cats, now).length <= 5);
assert.deepEqual(buildInsights([], cats, now), []);
console.log('insights self-check: 9 groups passed');
```

- [ ] **Step 2:** `npx tsx src/lib/insights.check.ts` → GAGAL di asersi pertama (urutan id; implementasi lama memakai bulan kalender).
- [ ] **Step 3:** Tulis ulang `buildInsights`. Hapus `isWife`. Persen dibulatkan `Math.round`. Rentang pembanding `vs-previous`: `prev.start <= t < prev.start + elapsed hari`.
- [ ] **Step 4:** `npm run check` dan `npm run build` hijau.
- [ ] **Step 5:** Commit: `feat(home): insights follow the active payday period`.

### Task 5: Filter riwayat `incomplete`

**Files:**
- Modify: `src/lib/history.ts:25-31`, `src/lib/history.check.ts`

**Interfaces:**
- Consumes: `entryProblem` (Task 1).
- Produces: `filterHistory(transactions, options: { query?: string; filter?: 'all' | 'income' | 'expense' | 'transfer' | 'incomplete'; account?: string; categories?: Category[] })`.

- [ ] **Step 1:** Tambah di `history.check.ts`:

```ts
const histCats = [{ id: 'food', name: 'Makanan', type: 'expense' }] as import('../models/Category').Category[];
assert.deepEqual(filterHistory(transactions, { filter: 'incomplete', categories: histCats }).map((tx) => tx.id), ['expense', 'income']);
assert.deepEqual(filterHistory([{ ...transactions[0], categoryId: 'food' }], { filter: 'incomplete', categories: histCats }), []);
```
  Perbarui angka di `console.log`.
- [ ] **Step 2:** `npx tsx src/lib/history.check.ts` → GAGAL: filter tidak dikenal, semua baris lolos.
- [ ] **Step 3:** Implementasikan (`categories` default `[]`).
- [ ] **Step 4:** `npm run check` hijau.
- [ ] **Step 5:** Commit: `feat(history): incomplete filter`.

### Task 6: Store menolak transaksi belum lengkap

**Files:**
- Modify: `src/lib/store.ts` (`recordEntry` :117, `updateEntry` :216), `scripts/e2e.mjs` (:104-111, :187-189)

**Interfaces:**
- Consumes: `entryProblem` (Task 1).
- Produces: `recordEntry` dan `updateEntry` melempar `new Error(problem.message)` sebelum cek saldo.

- [ ] **Step 1: e2e merah lebih dulu.** Di langkah 3 (`// 3. Expense from cash`), setelah mengisi jumlah, akun, dan keterangan tetapi **sebelum** memilih kategori:

```js
await page.getByRole("button", { name: "Simpan pengeluaran" }).click();
check("simpan tanpa kategori ditolak", await page.getByText("Pilih kategori dulu.").first().waitFor({ timeout: 3000 }).then(() => true).catch(() => false));
await page.locator("#entry-category").getByRole("button", { name: "Makanan" }).click();
```
  lalu simpan seperti sekarang. Setelah toast "Pengeluaran dicatat." tambah:

```js
await amount.fill("600000");
await page.getByRole("button", { name: "Simpan pengeluaran" }).click();
check("≥ 500 rb tanpa keterangan ditolak", await page.getByText("Isi keterangan untuk pengeluaran Rp 500 rb ke atas.").first().waitFor({ timeout: 3000 }).then(() => true).catch(() => false));
```
  Di `:187` ganti `/Tanpa kategori/` menjadi `/Makanan/`.
- [ ] **Step 2:** `npm run test:ui` → GAGAL pada "simpan tanpa kategori ditolak" (simpan masih berhasil). Skrip boleh berhenti lebih awal; yang penting kegagalan pertama adalah cek itu.
- [ ] **Step 3:** Panggil `entryProblem` di `recordEntry` dan `updateEntry` dengan `get(categories)`.
- [ ] **Step 4:** `npm run check` dan `npm run test:ui` hijau ("semua check lulus"). Total yang dipatok (4.000.000 / 750.000 / 4.750.000) tidak boleh berubah.
- [ ] **Step 5:** Commit: `feat(entry): reject incomplete transactions on save`.

### Task 7: Error per field di form

**Files:**
- Modify: `src/components/EntryForm.svelte`, `scripts/e2e.mjs`

**Interfaces:**
- Consumes: `entryProblem` (Task 1).
- Produces: id elemen pesan `entry-amount-error`, `entry-category-error`, `entry-description-error`, `entry-destination-error`.

- [ ] **Step 1: e2e merah.** Ubah dua cek Task 6 agar menunjuk elemen: `page.locator("#entry-category-error")` berisi "Pilih kategori dulu." dan `page.locator("#entry-description-error")` berisi pesan keterangan; tambah cek `(await page.locator("#entry-description").getAttribute("aria-invalid")) === "true"`.
- [ ] **Step 2:** `npm run test:ui` → GAGAL: elemen `#entry-category-error` tidak ada (pesan masih toast).
- [ ] **Step 3:** Implementasikan sesuai spec §5.6: `let errors: Partial<Record<'amount' | 'category' | 'description' | 'destination', string>> = {}` menggantikan `error`; dikosongkan di `reset()`; `entryProblem` dipanggil di `handleSubmit` bila `mode !== 'transfer'`; kelas pesan `mt-1.5 text-[11.5px] leading-[1.4] text-accent` dengan `role="alert"`; field keterangan invalid memakai `border-accent`; grup chip `role="group"` + `aria-describedby`; teks "Belum ada kategori. Tambah di Master." bila daftar kosong.
- [ ] **Step 4:** `npm run check`, `npm run build`, `npm run test:ui` hijau. Cek `:102` ("Akun tujuan harus berbeda.") harus tetap lulus.
- [ ] **Step 5:** Commit: `feat(entry): inline field errors for category and description`.

### Task 8: Penanda alokasi di Master

**Files:**
- Modify: `src/lib/master.ts`, `src/lib/master.check.ts`, `src/lib/store.ts` (`loadInitialData` :87, `saveCategory` :286), `src/components/MasterSheet.svelte`, `src/components/CategoryManager.svelte:18`, `scripts/e2e.mjs`

**Interfaces:**
- Produces:
  ```ts
  // master.ts
  export function categoryPayload(category: Category, allocationSupported: boolean): Record<string, unknown>;
  // store.ts
  export const allocationSupported: Writable<boolean>;
  ```
  `categoryPayload`: `icon` hanya bila terisi (perilaku sekarang); `allocation` selalu dikirim sebagai boolean bila didukung, tidak pernah dikirim bila tidak.

- [ ] **Step 1: check merah** di `master.check.ts`:

```ts
const cat = { id: 'c1', name: 'Istri', type: 'expense', allocation: true } as import('../models/Category').Category;
assert.deepEqual(categoryPayload(cat, false), { id: 'c1', name: 'Istri', type: 'expense' });
assert.deepEqual(categoryPayload(cat, true), { id: 'c1', name: 'Istri', type: 'expense', allocation: true });
assert.deepEqual(categoryPayload({ ...cat, allocation: undefined, icon: '💝' }, true), { id: 'c1', name: 'Istri', type: 'expense', icon: '💝', allocation: false });
```
- [ ] **Step 2:** `npx tsx src/lib/master.check.ts` → GAGAL: `categoryPayload` bukan ekspor.
- [ ] **Step 3:** Implementasikan `categoryPayload`; `saveCategory` memakainya dengan `get(allocationSupported)`; `loadInitialData` men-set `allocationSupported` = ada baris kategori yang memiliki kunci `allocation` (di-set di setiap pemuatan, termasuk ke `false`).
- [ ] **Step 4: e2e merah.** Tambah **blok akhir** tepat sebelum `await browser.close()` (halaman baru 1440×900 dari `context`): Master → ketuk kategori "Makanan" → di dialog pilih tab "Alokasi" pada tablist ber-`aria-label` "Dihitung sebagai" → Simpan → cek baris Makanan memuat teks "Alokasi ·". Jalankan → GAGAL: tablist tidak ada.
- [ ] **Step 5:** MasterSheet: `item` menerima `allocation?: boolean`; state `allocation`; `Segmented` (`Belanja` / `Alokasi`) hanya bila `kind === 'category' && type === 'expense' && $allocationSupported`, tidak dikunci oleh `used`; baris yang disimpan menyertakan `allocation: type === 'expense' && allocation`; keterangan `text-[11.5px] leading-[1.4] text-ink2` dengan teks spec §5.6. CategoryManager: subtitle `Alokasi · {sub lama}` untuk kategori alokasi.
- [ ] **Step 6:** `npm run check`, `npm run build`, `npm run test:ui` hijau.
- [ ] **Step 7:** Commit: `feat(master): mark an expense category as allocation`.

### Task 9: Home per periode aktif

**Files:**
- Modify: `src/views/Home.svelte`, `src/components/ui/AccountRail.svelte`, `src/lib/store.ts:43-45` (hapus `monthSummary` dan impor yang jadi tak terpakai), `scripts/e2e.mjs:416-417`

**Interfaces:**
- Consumes: `activePeriod`, `paydayPeriods` (Task 2); `topCategories().allocation` (Task 3); `summarize`, `operating` (`ledger.ts`).
- Produces: `AccountRail` prop baru `periodLabel: string` dan `ledgerPeriod: Period | undefined`.

- [ ] **Step 1: e2e merah.** Di blok "Task 5 Home acceptance checks": ganti cek insight menjadi "Home menampilkan 1–5 insight" (`<= 5`); tambah `check("Home berlabel periode gajian", /gajian .* gaji rp/i.test(await homePage.locator("header .lbl").first().innerText()))`. Di blok akhir (setelah Makanan ditandai alokasi) buka Home dan cek ada `insight-row` yang memuat "Alokasi Makanan" dan kartu belanja memuat baris bersubjudul "Alokasi".
- [ ] **Step 2:** `npm run test:ui` → GAGAL pada "Home berlabel periode gajian" (label masih nama bulan).
- [ ] **Step 3:** Implementasikan tabel spec §5.2. Ringkasan: `summarize(operating($transactions).filter(dalam periode))`. Kartu belanja: `top`/`rest` seperti sekarang, lalu `allocation` sebagai `ListItem` dengan `subtitle="Alokasi"` tanpa `percent`; judul "Belanja periode ini" / "Belanja bulan ini". `AccountRail`: `monthLabel={periodLabel}` di kedua tempat (:17, :20); `openAccount` menyertakan `period: ledgerPeriod` bila ada. `ledgerPeriod` untuk gajian = `{ kind: 'range', from: <hari gajian YYYY-MM-DD>, to: <hari ini YYYY-MM-DD> }`; untuk bulan `undefined`. "Semua →" membuka `{ kind: 'payday', day }` bila gajian.
- [ ] **Step 4:** `npm run check`, `npm run build`, `npm run test:ui` hijau. `grep -rn monthSummary src` harus kosong.
- [ ] **Step 5:** Commit: `feat(home): all period figures follow the active payday period`.

### Task 10: Tab Kategori memisahkan alokasi

**Files:**
- Modify: `src/components/report/CategoryTab.svelte:35-62`, `scripts/e2e.mjs` (blok akhir)

**Interfaces:**
- Consumes: `spendingRows`, `CategoryReport.split` (Task 2).

- [ ] **Step 1: e2e merah.** Di blok akhir: Laporan → tab "Kategori" → cek baris Makanan memuat pill "Alokasi" dan halaman memuat teks yang cocok `/Belanja Rp .* · Alokasi Rp/`.
- [ ] **Step 2:** `npm run test:ui` → GAGAL pada cek itu.
- [ ] **Step 3:** Untuk seksi pengeluaran pakai `spendingRows(report)`: baris `real` lalu `allocation`; baris alokasi diberi `Pill` neutral "Alokasi" setelah nama dan kolom persen "—"; persen baris Total "—" bila `split.allocation > 0`, selain itu `100`; satu baris `text-[11.5px] leading-[1.4] text-ink2` di bawah tabel: `Belanja {formatIDR(real)} · Alokasi {formatIDR(allocation)}` bila ada alokasi. Seksi pemasukan tidak berubah.
- [ ] **Step 4:** `npm run check`, `npm run build`, `npm run test:ui` hijau.
- [ ] **Step 5:** Commit: `feat(report): category tab separates allocation from spending`.

### Task 11: Chip "Perlu dilengkapi" di Riwayat

**Files:**
- Modify: `src/components/TransactionList.svelte:17-22, 62, 160-163`, `scripts/e2e.mjs` (blok akhir)

**Interfaces:**
- Consumes: `filterHistory` dengan `'incomplete'` (Task 5); `entryProblem` (Task 1).

- [ ] **Step 1: e2e merah.** Di blok akhir, setelah cek alokasi, sisipkan baris lama lewat helper `psql` yang sudah ada:

```js
psql(`-c "insert into transactions (id, type, amount, description, source, timestamp, user_id) values ('legacy-incomplete', 'expense', 1000, '', 'cash', now() - interval '70 days', '${uidOf(E2E_USER.email)}')"`);
```
  Muat ulang, buka Transaksi (rentang default "Bulan ini"): cek tombol "Perlu dilengkapi (1)" terlihat; klik → baris "Tanpa keterangan" terlihat dan tombol rentang `disabled`; klik baris → Edit → "Simpan perubahan" → `#entry-category-error` memuat "Pilih kategori dulu."; buka Home → ada `insight-row` yang diawali "1 transaksi".
- [ ] **Step 2:** `npm run test:ui` → GAGAL: tombol "Perlu dilengkapi (1)" tidak ada.
- [ ] **Step 3:** `filters` menjadi reaktif: chip `{ id: 'incomplete', label: \`Perlu dilengkapi (${n})\` }` ditambahkan bila `n > 0`, dengan `n` = jumlah `$transactions` yang `entryProblem(tx, $categories) !== null`. `typed` melewati `inRange` bila `filter === 'incomplete'` dan meneruskan `categories: $categories`. Tombol rentang `disabled` + `opacity-50` saat itu. Bila `n` menjadi 0 sementara filter aktif, kembali ke `'all'`.
- [ ] **Step 4:** `npm run check`, `npm run build`, `npm run test:ui` hijau.
- [ ] **Step 5:** Commit: `feat(history): find and complete legacy transactions`.

### Task 12: Tinjauan dan verifikasi akhir

- [ ] **Step 1:** Tinjauan UI/UX pada diff (375px dan dark mode; cek `docs/design-system.md` §9).
- [ ] **Step 2:** `simplify`, lalu ulangi `npm run check` dan `npm run test:ui`.
- [ ] **Step 3:** `code-review` level `medium`.
- [ ] **Step 4:** `security-review` (diff menyentuh skema DB dan validasi input).
- [ ] **Step 5:** `superpowers:verification-before-completion`: `npm run check`, `npm run build`, `npm run test:ui` hijau setelah semua perubahan tinjauan.
- [ ] **Step 6:** Laporkan ke pemilik urutan rilis spec §7. Jangan push, jangan deploy, jangan menyentuh hosted.
