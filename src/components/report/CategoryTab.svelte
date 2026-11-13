<script lang="ts">
  import Card from '../ui/Card.svelte';
  import Pill from '../ui/Pill.svelte';
  import ListItem from '../ui/ListItem.svelte';
  import SectionHeader from '../ui/SectionHeader.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import { formatCompact, formatDayMonth, formatIDR } from '../../lib/format';
  import { spendingRows, type CategoryReport, type CategoryRow } from '../../lib/reports';
  import type { Transaction } from '../../models/Transaction';

  export let report: CategoryReport;
  export let transactions: Transaction[] = [];
  export let prevLabel = 'vs sblm';

  $: spending = spendingRows(report);
  $: hasAllocation = report.split.allocation > 0;

  let detail: { type: 'expense' | 'income'; row: CategoryRow } | null = null;
  $: detailTx = detail
    ? transactions
        .filter((tx) => tx.type === detail!.type && (detail!.row.id === 'total' || (tx.categoryId ?? '') === detail!.row.id) && !tx.transferId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 50)
    : [];

  function vsText(vs: CategoryRow['vs']) {
    return typeof vs === 'number' ? `${vs >= 0 ? '▲' : '▼'} ${Math.abs(vs)}%` : vs;
  }
  function vsTone(vs: CategoryRow['vs'], type: 'expense' | 'income') {
    if (typeof vs !== 'number' || vs === 0) return 'text-ink2';
    return (vs > 0) === (type === 'income') ? 'text-pos' : 'text-accent';
  }
  const sections = [
    { type: 'expense' as const, title: 'Pengeluaran', empty: 'pengeluaran' },
    { type: 'income' as const, title: 'Pemasukan', empty: 'pemasukan' }
  ];
</script>

{#each sections as s}
  {@const rows = s.type === 'expense' ? [...spending.real, ...spending.allocation] : report.income}
  <SectionHeader title={s.title} />
  <Card dense>
    {#if rows.length === 0}
      <p class="py-2.5 text-[13px] text-ink2">Belum ada {s.empty} di periode ini.</p>
    {:else}
      <table class="w-full">
        <thead><tr class="lbl text-right"><th scope="col" class="py-2 text-left">Kategori</th><th scope="col">Jumlah</th><th scope="col" class="pl-3">%</th><th scope="col">{prevLabel}</th></tr></thead>
        <tbody>
          {#each rows as r (r.id)}
            <tr class="cursor-pointer border-t border-line text-[13px]" on:click={() => (detail = { type: s.type, row: r })}>
              <td class="py-2.5">{r.name}{#if r.allocation} <Pill>Alokasi</Pill>{/if}</td>
              <td class="num text-right">{formatCompact(r.amount)}</td>
              <td class="num pl-3 text-right text-ink2">{r.allocation ? '—' : Math.round(r.percent)}</td>
              <td class="num text-right {vsTone(r.vs, s.type)}">{vsText(r.vs)}</td>
            </tr>
          {/each}
          {#each [report.total[s.type]] as t}
            <tr class="tot border-t border-ink text-[13px] font-semibold">
              <td class="py-2.5">Total</td>
              <td class="num text-right">{formatCompact(t.amount)}</td>
              <td class="num pl-3 text-right">{s.type === 'expense' && hasAllocation ? '—' : 100}</td>
              <td class="num text-right {vsTone(t.vs, s.type)}">{vsText(t.vs)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
    {#if s.type === 'expense' && hasAllocation}
      <p class="mt-2 text-[11.5px] leading-[1.4] text-ink2">Belanja {formatIDR(report.split.real)} · Alokasi {formatIDR(report.split.allocation)}</p>
    {/if}
  </Card>
{/each}

<Sheet open={detail !== null} title={detail ? `${detail.row.name} · ${formatCompact(detail.row.amount)}` : ''} on:close={() => (detail = null)}>
  {#each detailTx as tx (tx.id)}
    <ListItem title={tx.description || detail?.row.name || ''} subtitle={formatDayMonth(tx.timestamp)} amount={formatIDR(tx.amount)} tone={tx.type} />
  {/each}
</Sheet>
