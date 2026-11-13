<script lang="ts">
  import Card from '../ui/Card.svelte';
  import SectionHeader from '../ui/SectionHeader.svelte';
  import TransactionDetail from '../TransactionDetail.svelte';
  import { formatCompact, formatDayMonth, formatIDR } from '../../lib/format';
  import { buildLedger } from '../../lib/ledger';
  import type { AccountBalanceRow, CategoryRow } from '../../lib/reports';
  import type { Account } from '../../models/Account';
  import type { Category } from '../../models/Category';
  import type { Transaction } from '../../models/Transaction';

  export let accounts: Account[] = [];
  export let categories: Category[] = [];
  export let rows: AccountBalanceRow[] = [];
  export let transactions: Transaction[] = [];
  export let catRows: CategoryRow[] = [];
  /** Combined balance of every account at period start. */
  export let openingAll = 0;
  /** '' = all accounts combined. */
  export let accountId = '';

  const TOP = 5;
  const signed = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${formatIDR(Math.abs(n))}`;
  const name = (id?: string) => accounts.find((a) => a.id === id)?.name ?? '';
  const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name ?? '';

  let detail: Transaction | null = null;

  $: if (accountId !== '' && !accounts.some((a) => a.id === accountId)) accountId = '';
  $: combined = accountId === '';
  $: awal = combined ? openingAll : rows.find((r) => r.id === accountId)?.awal ?? 0;
  $: ledger = buildLedger(transactions, accountId, awal);
  $: akhir = ledger.length ? ledger[ledger.length - 1].runningBalance : awal;
  $: top = catRows.slice(0, TOP);
  $: rest = catRows.slice(TOP);
  function note(tx: Transaction) {
    if (combined) return `${tx.description || categoryName(tx.categoryId) || 'Tanpa keterangan'} · ${name(tx.source)}`;
    const dir = tx.transferId ? (tx.type === 'expense' ? `→ ${name(tx.destination)}` : `← ${name(tx.destination)}`) : '';
    return [dir, tx.description].filter(Boolean).join(' ');
  }
  function activate(event: KeyboardEvent, tx: Transaction) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); detail = tx; }
  }
</script>

<div class="max-w-[920px]">
  <label class="mt-3.5 block"><span class="lbl mb-2 block">Akun</span><select id="ledger-account" bind:value={accountId} class="h-[46px] w-full rounded-field border border-line bg-card px-3 text-[14px] text-ink focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"><option value="">Semua akun</option>{#each accounts as a (a.id)}<option value={a.id}>{a.name}</option>{/each}</select></label>
  <div class="mt-3"><Card>
    <div class="grid grid-cols-3 text-center">
      <div><div class="lbl">Awal</div><div class="num text-[15px] font-semibold">{formatIDR(awal)}</div></div>
      <div><div class="lbl">Mutasi</div><div class="num text-[15px] font-semibold">{signed(akhir - awal)}</div></div>
      <div><div class="lbl">Akhir</div><div class="num text-[15px] font-semibold" data-testid="ledger-akhir" data-value={akhir}>{formatIDR(akhir)}</div></div>
    </div>
  </Card></div>
  <div class="mt-3"><Card dense>
    {#if ledger.length === 0}
      <p class="py-2.5 text-[13px] text-ink2">Belum ada mutasi di periode ini.</p>
    {:else}
      <table class="w-full">
        <thead><tr class="lbl text-right"><th scope="col" class="py-2 text-left">Tanggal</th><th scope="col" class="text-left">Keterangan</th><th scope="col">Mutasi</th><th scope="col">Saldo</th></tr></thead>
        <tbody>
          <tr class="border-t border-line text-[13px]">
            <td class="py-2.5 pr-2" colspan="3"><span class="text-ink2">Saldo awal</span></td>
            <td class="num text-right font-semibold">{formatIDR(awal)}</td>
          </tr>
          {#each ledger as l (l.tx.id)}
            {@const label = note(l.tx)}
            <tr class="cursor-pointer border-t border-line text-[13px] hover:bg-chip focus-visible:outline-2 focus-visible:outline-ink" role="button" tabindex="0" aria-label="Detail {label}" on:click={() => (detail = l.tx)} on:keydown={(e) => activate(e, l.tx)}>
              <td class="num whitespace-nowrap py-2.5 pr-2 text-[11.5px] text-ink2">{formatDayMonth(l.tx.timestamp)}</td>
              <td class="max-w-[140px] truncate pr-2 lg:max-w-none">{label}</td>
              <td class="num text-right {l.tx.type === 'income' ? 'text-pos' : 'text-accent'}">{signed(l.tx.type === 'income' ? l.tx.amount : -l.tx.amount)}</td>
              <td class="num text-right font-semibold">{formatIDR(l.runningBalance)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </Card></div>
  {#if combined && catRows.length > 0}
    <SectionHeader title="Kategori terbesar" />
    <Card dense>
      <table class="w-full">
        <tbody>
          {#each top as r (r.id)}
            <tr class="border-t border-line text-[13px] first:border-t-0"><td class="py-2.5">{r.name}</td><td class="num text-right">{formatCompact(r.amount)}</td><td class="num w-10 text-right text-ink2">{Math.round(r.percent)}%</td></tr>
          {/each}
          {#if rest.length > 0}
            <tr class="border-t border-line text-[13px]"><td class="py-2.5 text-ink2">Lainnya</td><td class="num text-right">{formatCompact(rest.reduce((sum, r) => sum + r.amount, 0))}</td><td class="num w-10 text-right text-ink2">{Math.round(rest.reduce((sum, r) => sum + r.percent, 0))}%</td></tr>
          {/if}
        </tbody>
      </table>
    </Card>
  {/if}
</div>

<TransactionDetail tx={detail} on:close={() => (detail = null)} />
