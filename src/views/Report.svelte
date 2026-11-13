<script lang="ts">
  import { accounts, categories, transactions } from '../lib/store';
  import { reportState } from '../lib/ui';
  import { buildLedger, operating, summarize } from '../lib/ledger';
  import { accountBalanceReport, categoryReport, fullBackupRows, monthlyTable, paydayPeriods, periodRange, toCsv, totalBalanceBefore, type Period } from '../lib/reports';
  import ListItem from '../components/ui/ListItem.svelte';
  import Pill from '../components/ui/Pill.svelte';
  import Sheet from '../components/ui/Sheet.svelte';
  import BalanceTab from '../components/report/BalanceTab.svelte';
  import CashflowTab from '../components/report/CashflowTab.svelte';
  import CategoryTab from '../components/report/CategoryTab.svelte';
  import LedgerTab from '../components/report/LedgerTab.svelte';
  import PeriodPicker from '../components/report/PeriodPicker.svelte';

  const now = new Date();
  const TABS = [
    { id: 'cashflow', label: 'Arus kas' },
    { id: 'category', label: 'Kategori' },
    { id: 'balance', label: 'Saldo akun' },
    { id: 'ledger', label: 'Buku besar' }
  ] as const;
  const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad = (n: number) => String(n + 1).padStart(2, '0');

  let csvOpen = false;
  let accountId = $reportState.accountId ?? '';
  $: tab = $reportState.tab;
  $: paydays = paydayPeriods($transactions, $categories);
  // a payday whose salary entry was deleted/edited away falls back to the current month
  $: period = (($reportState.period?.kind === 'payday' && !paydays.some((p) => p.day === ($reportState.period as { day: string }).day) ? undefined : $reportState.period) ?? { kind: 'month', y: now.getFullYear(), m: now.getMonth() }) as Period;
  $: range = periodRange(period, paydays);
  $: spanning = period.kind === 'range' || period.kind === 'payday';
  $: openingAll = totalBalanceBefore($transactions, range.start);
  $: inPeriod = $transactions.filter((tx) => { const t = new Date(tx.timestamp).getTime(); return t >= range.start.getTime() && t < range.end.getTime(); });
  $: flow = operating(inPeriod);
  $: sum = summarize(flow);
  $: catReport = categoryReport($categories, $transactions, range.start, range.end, range.prevStart, range.prevEnd);
  $: balRows = accountBalanceReport($accounts, $transactions, range.start, range.end);
  // ponytail: a range spanning two years lists months of its start year only
  $: year = period.kind === 'range' || period.kind === 'payday' ? range.start.getFullYear() : period.y;
  $: monthly = (() => {
    const all = monthlyTable(spanning ? flow : $transactions, year);
    if (!spanning) return all;
    const rows = all.rows.filter((r) => range.start < new Date(year, r.month + 1, 1) && range.end > new Date(year, r.month, 1));
    const income = rows.reduce((s, r) => s + r.income, 0), expense = rows.reduce((s, r) => s + r.expense, 0);
    return { rows, total: { income, expense, net: income - expense } };
  })();
  $: prevLabel = period.kind === 'month' ? `vs ${SHORT[(period.m + 11) % 12]}` : period.kind === 'year' ? `vs ${period.y - 1}` : period.kind === 'payday' ? 'vs gajian sblm' : 'vs sblm';
  $: fileKey = period.kind === 'month' ? `${period.y}-${pad(period.m)}` : period.kind === 'year' ? String(period.y) : period.kind === 'payday' ? `gajian-${period.day}` : `${period.from}_${period.to}`;
  $: tabLabel = TABS.find((t) => t.id === tab)!.label;

  function setTab(id: typeof TABS[number]['id']) { reportState.update((s) => ({ ...s, tab: id })); }
  function setPeriod(p: Period) {
    if (p.kind === 'payday') accountId = '';
    reportState.update((s) => ({ ...s, period: p, ...(p.kind === 'payday' ? { accountId: '' } : {}) }));
  }
  function openLedger(id: string) { accountId = id; reportState.update((s) => ({ ...s, tab: 'ledger', accountId: id })); }

  function tabRows(): (string | number)[][] {
    if (tab === 'cashflow') return [['Bulan', 'Masuk', 'Keluar', 'Net'], ...monthly.rows.map((r) => [SHORT[r.month], r.income, r.expense, r.net])];
    if (tab === 'category') {
      const rows = (['expense', 'income'] as const).flatMap((t) => catReport[t].map((r) => [t === 'expense' ? 'Pengeluaran' : 'Pemasukan', r.name, r.amount, Math.round(r.percent), r.prev]));
      return [['Tipe', 'Kategori', 'Jumlah', 'Persen', 'Periode sebelumnya'], ...rows];
    }
    if (tab === 'balance') return [['Akun', 'Jenis', 'Awal', 'Masuk', 'Keluar', 'Akhir'], ...balRows.map((r) => [r.name, r.type, r.awal, r.masuk, r.keluar, r.akhir])];
    const open = accountId ? balRows.find((r) => r.id === accountId)?.awal ?? 0 : openingAll;
    const accountName = (id?: string) => $accounts.find((a) => a.id === id)?.name ?? '';
    const rows = buildLedger(inPeriod, accountId, open).map((l) => [new Date(l.tx.timestamp).toLocaleDateString('sv-SE'), l.tx.description, accountName(l.tx.source), l.tx.transferId ? 'transfer' : l.tx.type, l.tx.type === 'income' ? l.tx.amount : -l.tx.amount, l.runningBalance]);
    return [['Tanggal', 'Keterangan', 'Akun', 'Tipe', 'Mutasi', 'Saldo'], ...rows];
  }

  function download(rows: (string | number)[][], filename: string) {
    const url = URL.createObjectURL(new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    csvOpen = false;
  }
</script>

<div class="min-w-0">
  <header class="mb-3 flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-[20px] leading-[1.2] font-semibold">Laporan</h1>
    <button type="button" class="focus-visible:outline-2 focus-visible:outline-ink" on:click={() => (csvOpen = true)}><Pill variant="ink">⤓ CSV</Pill></button>
  </header>
  <div class="flex flex-wrap items-center gap-3">
    <div class="min-w-0"><PeriodPicker {period} {paydays} on:change={(e) => setPeriod(e.detail)} /></div>
    <div role="tablist" aria-label="Jenis laporan" class="flex gap-2 overflow-x-auto">
      {#each TABS as t}
        <button type="button" role="tab" aria-selected={tab === t.id} class="whitespace-nowrap rounded-pill border border-line px-3 py-[7px] text-[12.5px] {tab === t.id ? 'border-ink bg-ink text-on-ink' : 'bg-card text-ink'}" on:click={() => setTab(t.id)}>{t.label}</button>
      {/each}
    </div>
  </div>

  <div class="max-w-[920px]">
    {#if tab === 'cashflow'}
      <CashflowTab income={sum.income} expense={sum.expense} expenseRows={catReport.expense} months={monthly} title={spanning ? 'Per bulan' : `Per bulan, ${year}`} selectedMonth={period.kind === 'month' ? period.m : null} />
    {:else if tab === 'category'}
      <CategoryTab report={catReport} transactions={flow} {prevLabel} />
    {:else if tab === 'balance'}
      <div class="mt-3.5"><BalanceTab rows={balRows} on:select={(e) => openLedger(e.detail)} /></div>
    {:else}
      <LedgerTab accounts={$accounts} categories={$categories} rows={balRows} transactions={inPeriod} allTransactions={$transactions} catRows={catReport.expense} {openingAll} bind:accountId />
    {/if}
  </div>
</div>

<Sheet open={csvOpen} title="Unduh CSV" on:close={() => (csvOpen = false)}>
  <button type="button" class="block w-full text-left" on:click={() => download(tabRows(), `dompet-suami-${tab}-${fileKey}.csv`)}><ListItem title="{tabLabel} — {range.label}" icon="⤓" /></button>
  <button type="button" class="block w-full text-left" on:click={() => download(fullBackupRows($transactions, $accounts, $categories), `dompet-suami-semua-${new Date().toISOString().slice(0, 10)}.csv`)}><ListItem title="Semua transaksi (cadangan)" icon="⤓" /></button>
</Sheet>
