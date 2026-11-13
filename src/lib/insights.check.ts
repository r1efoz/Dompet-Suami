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
