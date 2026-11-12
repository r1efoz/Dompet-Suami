// Self-check for ledger math. Run: npx tsx src/lib/ledger.check.ts
import assert from 'node:assert/strict';
import type { Account } from '../src/models/Account';
import type { Transaction } from '../src/models/Transaction';
import { buildLedger, computeBalances, operating, startOfMonth, summarize, summarizeSince } from '../src/lib/ledger';

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

// transfer with admin fee: fee is the only real expense; income - expense must equal total balance change
const withTransfer: Transaction[] = [
  tx({ id: 'a', type: 'income', amount: 1_000_000, source: 'bank' }),
  tx({ id: 'o', type: 'expense', amount: 100_500, source: 'bank', destination: 'cash', transferId: 't1' }),
  tx({ id: 'i', type: 'income', amount: 100_000, source: 'cash', destination: 'cash', transferId: 't1' })
];
const op = operating(withTransfer);
const opSum = summarize(op);
const totalBalance = Object.values(computeBalances(accounts, withTransfer)).reduce((a, b) => a + b, 0);
assert.equal(opSum.expense, 500, 'fee counted as expense');
assert.equal(opSum.income - opSum.expense, totalBalance, 'net equals total balance change');

// combined ledger (accountId ''): transfers hidden, fee shown, income before expense on same timestamp
const same = '2026-10-25T12:00:00.000Z';
const combined: Transaction[] = [
  tx({ id: 'z-exp', type: 'expense', amount: 200_000, source: 'bank', timestamp: same }),
  tx({ id: 'a-inc', type: 'income', amount: 5_000_000, source: 'bank', timestamp: same }),
  tx({ id: 'o', type: 'expense', amount: 100_500, source: 'bank', destination: 'cash', transferId: 't9', timestamp: same }),
  tx({ id: 'i', type: 'income', amount: 100_000, source: 'cash', destination: 'cash', transferId: 't9', timestamp: same })
];
const all = buildLedger(combined, '', 1_000);
assert.equal(all[0].tx.id, 'a-inc', 'income leads same-timestamp rows');
assert.equal(all.length, 3, 'transfer hidden, fee + 2 entries');
assert.equal(all[all.length - 1].runningBalance, 1_000 + 5_000_000 - 200_000 - 500, 'combined running balance');

console.log('ledger self-check: 13 assertions passed');
