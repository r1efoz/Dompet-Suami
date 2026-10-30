<script lang="ts">
  import { accounts, categories, transactions, balances, totalBalance, monthSummary } from '../lib/store';
  import { accountMonthStats, balanceAt, monthlyTrend, topCategories } from '../lib/dashboard';
  import { buildInsights } from '../lib/insights';
  import { formatCompact, formatIDR } from '../lib/format';
  import { APP_OWNER_NAME, currentView, reportState } from '../lib/ui';
  import AccountMenu from '../components/AccountMenu.svelte';
  import AccountRail from '../components/ui/AccountRail.svelte';
  import BarChart from '../components/ui/BarChart.svelte';
  import Card from '../components/ui/Card.svelte';
  import ListItem from '../components/ui/ListItem.svelte';
  import Pill from '../components/ui/Pill.svelte';
  import SectionHeader from '../components/ui/SectionHeader.svelte';
  import StatStrip from '../components/ui/StatStrip.svelte';

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  $: stats = accountMonthStats($accounts, $transactions, start, end);
  $: activeAccounts = $accounts.filter((account) => (stats.find((item) => item.id === account.id)?.balance ?? 0) !== 0 || (stats.find((item) => item.id === account.id)?.count ?? 0) > 0);
  $: hiddenCount = $accounts.length - activeAccounts.length;
  $: orderedAccounts = [...$accounts].sort((a, b) => ($balances[b.id] ?? 0) - ($balances[a.id] ?? 0));
  $: insights = buildInsights($transactions, $categories, now);
  $: categoriesTop = topCategories($transactions.filter((tx) => !tx.transferId && tx.type === 'expense' && new Date(tx.timestamp) >= start && new Date(tx.timestamp) < end), $categories, 5);
  $: monthly = monthlyTrend($transactions, 12, now);
  $: monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();
  $: compactMonth = now.toLocaleDateString('id-ID', { month: 'short' });
  $: beginning = balanceAt($accounts, $transactions, start);
  $: delta = $totalBalance - beginning;
  $: desktop = typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches;
  function openCashflow() { currentView.set('report'); reportState.set({ tab: 'cashflow', period: { kind: 'year', y: now.getFullYear() } }); }
  function openCategories() { currentView.set('report'); reportState.set({ tab: 'category', period: { kind: 'month', y: now.getFullYear(), m: now.getMonth() } }); }
  function dateLabel(timestamp: string) { return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); }
</script>

<div class="grid min-w-0 gap-0 lg:grid-cols-12 lg:gap-x-5">
  <header class="mb-5 flex items-center justify-between lg:col-span-12 lg:mb-2">
    <div><div class="lbl">{monthName}</div><h1 class="text-[20px] leading-[1.2] font-semibold">Halo, {APP_OWNER_NAME}</h1></div>
    <div class="lg:hidden"><AccountMenu /></div>
  </header>
  <section class="lg:col-span-12">
    <div class="flex flex-wrap items-end justify-between gap-2"><div><div class="lbl">TOTAL SEMUA AKUN</div><div class="flex flex-wrap items-center gap-2"><span data-testid="home-total" data-value={$totalBalance} class="num text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] lg:text-[34px]">{formatIDR($totalBalance)}</span>{#if delta !== 0}<Pill variant={delta > 0 ? 'pos' : 'neg'}>{delta > 0 ? '▲' : '▼'} {formatCompact(delta)} bulan ini</Pill>{/if}</div></div>
      {#if desktop}<div class="hidden items-center gap-2 text-[11.5px] text-ink2 lg:flex"><span class="text-pos">■</span> Masuk {formatCompact($monthSummary.income)} · <span class="text-accent">■</span> Keluar {formatCompact($monthSummary.expense)} · Net {formatCompact($monthSummary.net)}</div>{/if}</div>
    <div class="mt-3"><AccountRail accounts={orderedAccounts} {stats} {hiddenCount} /></div>
  </section>
  <div class="mt-5 lg:hidden"><StatStrip income={$monthSummary.income} expense={$monthSummary.expense} net={$monthSummary.net} periodLabel={compactMonth.toUpperCase()} /></div>
  <section class="min-w-0 lg:col-span-8"><SectionHeader title="Tren 12 bulan" actionLabel="Detail →" on:action={openCashflow} /><Card><BarChart data={monthly} width={desktop ? 700 : 340} /></Card></section>
  <section class="min-w-0 lg:col-span-4"><SectionHeader title="Insight" /><Card dense>
    {#if insights.length === 0}<p class="py-2.5 text-[13px] leading-[1.45] text-ink2">Belum ada transaksi bulan ini. Catat yang pertama lewat tombol +.</p>
    {:else}{#each insights as insight, i}<div data-testid="insight-row" class="flex gap-2.5 py-2.5 {i < insights.length-1 ? 'border-b border-line' : ''}"><span class="mt-1.5 h-2 w-2 shrink-0 rounded-full {insight.tone === 'pos' ? 'bg-pos' : insight.tone === 'neutral' ? 'bg-ink2' : 'bg-accent'}"></span><p class="text-[13px] leading-[1.45]">{#each insight.segments as segment}{#if segment.b}<b>{segment.t}</b>{:else}{segment.t}{/if}{/each}</p></div>{/each}{/if}
  </Card></section>
  <section class="min-w-0 lg:col-span-4"><SectionHeader title="Pengeluaran bulan ini" actionLabel="Semua →" on:action={openCategories} /><Card dense>
    {#if categoriesTop.top.length === 0}<p class="py-2.5 text-[13px] text-ink2 italic">Belum ada pengeluaran bulan ini.</p>{:else}{#each [...categoriesTop.top, ...(categoriesTop.rest ? [categoriesTop.rest] : [])] as category}<ListItem icon={category.icon} title={category.name} amount={formatCompact(category.value)} amountSubtitle="{category.percent}%" percent={category.value / Math.max(categoriesTop.total, 1) * 100} />{/each}{/if}
  </Card></section>
  <section class="min-w-0 lg:col-span-8"><SectionHeader title="Transaksi terbaru" actionLabel="Riwayat →" on:action={() => currentView.set('transaction')} /><Card dense>
    {#if $transactions.length === 0}<p class="py-2.5 text-[13px] text-ink2">Belum ada transaksi.</p>{:else}{#each [...$transactions].sort((a,b) => new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime() || b.id.localeCompare(a.id)).slice(0,5) as tx}<div class="flex min-h-[60px] items-center justify-between gap-3 border-b border-line last:border-0"><div class="min-w-0"><p class="truncate text-[14px] font-medium">{tx.description || $categories.find((c) => c.id === tx.categoryId)?.name || 'Tanpa keterangan'}</p><p class="text-[11.5px] text-ink2">{dateLabel(tx.timestamp)} · {$accounts.find((a) => a.id === tx.source)?.name ?? ''}</p></div><span class="num whitespace-nowrap text-[14px] font-semibold {tx.type === 'income' ? 'text-pos' : 'text-accent'}">{tx.type === 'income' ? '+' : '−'}{formatCompact(tx.amount)}</span></div>{/each}{/if}
  </Card></section>
</div>
