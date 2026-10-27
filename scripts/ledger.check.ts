// Self-check for ledger math. Run: npx tsx src/lib/ledger.check.ts
import assert from 'node:assert/strict';
import type { Account } from '../src/models/Account';
import type { Transaction } from '../src/models/Transaction';
import { buildLedger, computeBalances, startOfMonth, summarize, summarizeSince } from '../src/lib/ledger';

const accounts: Account[] = [
  { id: 'bank', name: 'Bank', type: 'bank' },
  { id: 'cash', name: 'Tunai', type: 'cash' }
];

const tx = (over: Partial<Transaction> & Pick<Transaction, 'id' | 'type' | 'amount' | 'source'>): Transaction => ({
  description: 'test',
  timestamp: '2026-10-01T00:00:00.000Z',
  ...over
});

const transactions: Transaction[] = [
  tx({ id: '1', type: 'income', amount: 5_000_000, source: 'bank', timestamp: '2026-10-01T00:00:00.000Z' }),
  tx({ id: '2', type: 'expense', amount: 1_000_000, source: 'bank', timestamp: '2026-10-02T00:00:00.000Z' }),
  tx({ id: '3', type: 'income', amount: 1_000_000, source: 'cash', timestamp: '2026-10-02T00:00:00.000Z' }),
  tx({ id: '4', type: 'expense', amount: 250_000, source: 'cash', timestamp: '2026-09-15T00:00:00.000Z' })
];

const balances = computeBalances(accounts, transactions);
assert.equal(balances.bank, 4_000_000, 'bank balance');
assert.equal(balances.cash, 750_000, 'cash balance');

const totals = summarize(transactions);
assert.equal(totals.income, 6_000_000, 'total income');
assert.equal(totals.expense, 1_250_000, 'total expense');
assert.equal(totals.net, 4_750_000, 'net flow');

const september = summarizeSince(transactions, '2026-09-01T00:00:00.000Z');
assert.equal(september.expense, 1_250_000, 'september expense');

const ledger = buildLedger(transactions, 'bank');
assert.equal(ledger.length, 2, 'bank ledger rows');
assert.equal(ledger[1].runningBalance, 4_000_000, 'bank running balance');

const som = new Date(startOfMonth(new Date('2026-10-27T10:00:00Z')));
assert.equal(som.getDate(), 1, 'start of month day');
assert.equal(som.getMonth(), 9, 'start of month is October');

console.log('ledger self-check: 10 assertions passed');
