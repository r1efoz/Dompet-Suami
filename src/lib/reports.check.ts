import assert from 'node:assert/strict';
import type { Account } from '../models/Account';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';
import { buildLedger, computeBalances } from './ledger';
import {
  periodRange,
  accountBalanceReport,
  categoryReport,
  monthlyTable,
  toCsv,
  fullBackupRows,
  paydayPeriods,
  activePeriod,
  periodDays,
  spendingRows
} from './reports';

// --- Test 1: accountBalanceReport ---
const accounts: Account[] = [
  { id: 'bank', name: 'Bank Mandiri', type: 'bank' },
  { id: 'cash', name: 'Tunai Dompet', type: 'cash' }
];

const start = new Date(2026, 9, 1); // 1 Okt 2026
const end = new Date(2026, 10, 1);   // 1 Nov 2026

const transactions: Transaction[] = [
  // Before period (September)
  { id: 't1', type: 'income', amount: 2_000_000, source: 'bank', timestamp: '2026-09-10T12:00:00Z', description: 'Gaji Sep' },
  { id: 't2', type: 'expense', amount: 500_000, source: 'bank', timestamp: '2026-09-15T12:00:00Z', description: 'Belanja Sep' },
  // Within period (October)
  { id: 't3', type: 'income', amount: 3_000_000, source: 'bank', timestamp: '2026-10-05T12:00:00Z', description: 'Bonus Okt' },
  { id: 't4', type: 'expense', amount: 1_000_000, source: 'bank', destination: 'cash', transferId: 'tr1', timestamp: '2026-10-10T12:00:00Z', description: 'Tarik tunai' },
  { id: 't5', type: 'income', amount: 1_000_000, source: 'cash', destination: 'bank', transferId: 'tr1', timestamp: '2026-10-10T12:00:00Z', description: 'Tarik tunai' },
  { id: 't6', type: 'expense', amount: 200_000, source: 'cash', categoryId: 'food', timestamp: '2026-10-15T12:00:00Z', description: 'Makan' }
];

const balReport = accountBalanceReport(accounts, transactions, start, end);
const bankBal = balReport.find((r) => r.id === 'bank')!;
const cashBal = balReport.find((r) => r.id === 'cash')!;

assert.equal(bankBal.awal, 1_500_000, 'bank awal');
assert.equal(bankBal.masuk, 3_000_000, 'bank masuk');
assert.equal(bankBal.keluar, 1_000_000, 'bank keluar');
assert.equal(bankBal.akhir, 3_500_000, 'bank akhir');

assert.equal(cashBal.awal, 0, 'cash awal');
assert.equal(cashBal.masuk, 1_000_000, 'cash masuk');
assert.equal(cashBal.keluar, 200_000, 'cash keluar');
assert.equal(cashBal.akhir, 800_000, 'cash akhir');

// Invarian: akhir === computeBalances(...)[id] untuk periode sampai sekarang
const allBal = computeBalances(accounts, transactions);
assert.equal(bankBal.akhir, allBal.bank, 'invarian bank akhir');
assert.equal(cashBal.akhir, allBal.cash, 'invarian cash akhir');

// --- Test 2: categoryReport ---
const categories: Category[] = [
  { id: 'food', name: 'Makanan', type: 'expense' },
  { id: 'trans', name: 'Transport', type: 'expense' },
  { id: 'util', name: 'Listrik', type: 'expense' }
];

const catTx: Transaction[] = [
  // Prev period (Sep)
  { id: 'c1', type: 'expense', amount: 100_000, source: 'cash', categoryId: 'food', timestamp: '2026-09-10T12:00:00Z', description: 'Makan Sep' },
  // Curr period (Okt)
  { id: 'c2', type: 'expense', amount: 300_000, source: 'cash', categoryId: 'food', timestamp: '2026-10-05T12:00:00Z', description: 'Makan Okt' },
  { id: 'c3', type: 'expense', amount: 100_000, source: 'cash', categoryId: 'trans', timestamp: '2026-10-10T12:00:00Z', description: 'Bensin' }, // prev 0 -> 'baru'
  { id: 'c4', type: 'expense', amount: 200_000, source: 'bank', categoryId: 'util', timestamp: '2026-10-12T12:00:00Z', description: 'PLN' }    // prev 0 -> 'baru'
];

const prevStart = new Date(2026, 8, 1);
const prevEnd = new Date(2026, 9, 1);
const catRep = categoryReport(categories, catTx, start, end, prevStart, prevEnd);

const expRows = catRep.expense;
const totalPercent = expRows.reduce((sum, r) => sum + r.percent, 0);
assert.ok(Math.abs(totalPercent - 100) <= 1, `persen jumlah 100±1 (got ${totalPercent})`);

const transRow = expRows.find((r) => r.id === 'trans')!;
assert.equal(transRow.vs, 'baru', 'transaksi prev 0 -> baru');

// --- Test 3: periodRange ---
const octRange = periodRange({ kind: 'month', y: 2026, m: 9 });
assert.equal(octRange.start.getFullYear(), 2026);
assert.equal(octRange.start.getMonth(), 9);
assert.equal(octRange.start.getDate(), 1);
assert.equal(octRange.end.getFullYear(), 2026);
assert.equal(octRange.end.getMonth(), 10);
assert.equal(octRange.end.getDate(), 1);
assert.equal(octRange.prevStart.getMonth(), 8, 'prev month is September');

// --- Test 4: toCsv ---
const csv = toCsv([['a', 'b"c'], ['x,y', 'z']]);
assert.equal(csv, 'a,"b""c"\r\n"x,y",z');

// formula injection: text cells starting with = + - @ get a leading quote; numbers untouched
assert.equal(toCsv([['=1+1', '@x', -5, 'ok']]), "'=1+1,'@x,-5,ok");

// --- Test 5: buildLedger with opening ---
const bankTx = transactions.filter((t) => t.source === 'bank');
const ledgerWithOpening = buildLedger(bankTx, 'bank', 1000);
assert.equal(ledgerWithOpening[0].runningBalance, 1000 + 2_000_000);

const ledgerDefault = buildLedger(bankTx, 'bank');
assert.equal(ledgerDefault[0].runningBalance, 2_000_000);

// --- Test 6: fullBackupRows ---
const backup = fullBackupRows(transactions, accounts, categories);
assert.equal(backup[0].join(','), 'Tanggal,Tipe,Jumlah,Sumber,Tujuan,Kategori,Keterangan');
// Check that accounts and categories use names, not IDs
const t6Row = backup.find((r) => r[6] === 'Makan')!;
assert.equal(t6Row[3], 'Tunai Dompet', 'Sumber using account name');
assert.equal(t6Row[5], 'Makanan', 'Kategori using category name');

// Check monthlyTable
const mTable = monthlyTable(transactions, 2026);
assert.ok(mTable.rows.length >= 2, 'monthlyTable rows count');

// --- Test 7: payday periods ---
const payCats: Category[] = [
  { id: 'salary', name: 'Gaji', type: 'income' },
  { id: 'bonus', name: 'Bonus', type: 'income' },
  { id: 'food', name: 'Makanan', type: 'expense' }
];
const payTx: Transaction[] = [
  { id: 'p1', type: 'income', amount: 5_000_000, source: 'bank', categoryId: 'salary', timestamp: '2026-09-25T12:00:00', description: 'Gaji Sep' },
  { id: 'p2', type: 'expense', amount: 100_000, source: 'bank', categoryId: 'food', timestamp: '2026-09-26T12:00:00', description: 'Makan' },
  { id: 'p3', type: 'income', amount: 5_000_000, source: 'bank', categoryId: 'salary', timestamp: '2026-10-25T12:00:00', description: 'Gaji Okt' },
  { id: 'p4', type: 'income', amount: 500_000, source: 'bank', categoryId: 'salary', timestamp: '2026-10-25T12:00:00', description: 'Gaji tambahan' },
  { id: 'p5', type: 'income', amount: 700_000, source: 'bank', categoryId: 'bonus', timestamp: '2026-10-28T12:00:00', description: 'Bonus' },
  { id: 'p6', type: 'income', amount: 1_000_000, source: 'cash', categoryId: 'salary', transferId: 'x', timestamp: '2026-10-29T12:00:00', description: 'transfer' }
];
const now = new Date(2026, 10, 13);
const pds = paydayPeriods(payTx, payCats, now);
assert.equal(pds.length, 2, 'two payday periods');
assert.equal(pds[0].day, '2026-10-25', 'newest first');
assert.equal(pds[0].amount, 5_500_000, 'same-day salaries merged');
assert.equal(pds[0].end, undefined, 'current period open-ended');
assert.equal(pds[0].prevDay, '2026-09-25');
assert.equal(pds[1].end!.getTime(), new Date(2026, 9, 25).getTime(), 'ends at next payday 00:00');
assert.equal(pds[0].label, 'Gajian 25 Okt');
assert.equal(pds[1].label, 'Gajian 25 Sep – 24 Okt');
assert.deepEqual(paydayPeriods(payTx, [{ id: 'food', name: 'Makanan', type: 'expense' }], now), [], 'no Gaji category => none');

const pr = periodRange({ kind: 'payday', day: '2026-10-25' }, pds);
assert.equal(pr.start.getTime(), new Date(2026, 9, 25).getTime());
assert.ok(pr.end.getTime() > new Date(2100, 0, 1).getTime(), 'open-ended end');
assert.equal(pr.prevStart.getTime(), new Date(2026, 8, 25).getTime());
assert.equal(pr.prevEnd.getTime(), pr.start.getTime());
assert.equal(pr.label, 'Gajian 25 Okt');

const payAccounts: Account[] = [{ id: 'bank', name: 'Bank', type: 'bank' }, { id: 'cash', name: 'Tunai', type: 'cash' }];
const openingAll = accountBalanceReport(payAccounts, payTx, pr.start, pr.end).reduce((s, r) => s + r.awal, 0);
assert.equal(openingAll, 5_000_000 - 100_000, 'combined opening = sum of account openings');

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

console.log('reports self-check: all assertions passed');
