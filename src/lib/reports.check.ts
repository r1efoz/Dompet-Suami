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
  fullBackupRows
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

console.log('reports self-check: all assertions passed');
