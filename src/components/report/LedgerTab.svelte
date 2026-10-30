<script lang="ts">
  import Card from '../ui/Card.svelte';
  import { formatCompact } from '../../lib/format';
  import { buildLedger } from '../../lib/ledger';
  import type { AccountBalanceRow } from '../../lib/reports';
  import type { Account } from '../../models/Account';
  import type { Transaction } from '../../models/Transaction';

  export let accounts: Account[] = [];
  export let rows: AccountBalanceRow[] = [];
  export let transactions: Transaction[] = [];
  export let accountId = '';

  const signed = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${formatCompact(n)}`;
  const name = (id?: string) => accounts.find((a) => a.id === id)?.name ?? '';

  $: if (!accounts.some((a) => a.id === accountId)) accountId = [...rows].sort((a, b) => b.akhir - a.akhir)[0]?.id ?? '';
  $: row = rows.find((r) => r.id === accountId);
  $: ledger = buildLedger(transactions, accountId, row?.awal ?? 0).reverse();
  function note(tx: Transaction) {
    const dir = tx.transferId ? (tx.type === 'expense' ? `→ ${name(tx.destination)}` : `← ${name(tx.destination)}`) : '';
    return [dir, tx.description].filter(Boolean).join(' ');
  }
</script>

<div class="max-w-[920px]">
  <label class="mt-3.5 block"><span class="lbl mb-2 block">Akun</span><select id="ledger-account" bind:value={accountId} class="h-[46px] w-full rounded-field border border-line bg-card px-3 text-[14px] text-ink focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none">{#each accounts as a (a.id)}<option value={a.id}>{a.name}</option>{/each}</select></label>
  {#if row}
    <div class="mt-3"><Card>
      <div class="grid grid-cols-3 text-center">
        <div><div class="lbl">Awal</div><div class="num text-[15px] font-semibold">{formatCompact(row.awal)}</div></div>
        <div><div class="lbl">Mutasi</div><div class="num text-[15px] font-semibold">{signed(row.masuk - row.keluar)}</div></div>
        <div><div class="lbl">Akhir</div><div class="num text-[15px] font-semibold">{formatCompact(row.akhir)}</div></div>
      </div>
    </Card></div>
  {/if}
  <div class="mt-3"><Card dense>
    {#if ledger.length === 0}
      <p class="py-2.5 text-[13px] text-ink2">Belum ada mutasi di periode ini.</p>
    {:else}
      <table class="w-full">
        <thead><tr class="lbl text-right"><th scope="col" class="py-2 text-left">Tanggal</th><th scope="col" class="text-left">Keterangan</th><th scope="col">Mutasi</th><th scope="col">Saldo</th></tr></thead>
        <tbody>
          {#each ledger as l (l.tx.id)}
            <tr class="border-t border-line text-[13px]">
              <td class="num whitespace-nowrap py-2.5 pr-2 text-[11.5px] text-ink2">{new Date(l.tx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
              <td class="max-w-[140px] truncate pr-2 lg:max-w-none">{note(l.tx)}</td>
              <td class="num text-right {l.tx.type === 'income' ? 'text-pos' : 'text-accent'}">{signed(l.tx.type === 'income' ? l.tx.amount : -l.tx.amount)}</td>
              <td class="num text-right font-semibold">{formatCompact(l.runningBalance)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </Card></div>
</div>
