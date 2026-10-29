<script lang="ts">
  import { accounts, categories, transactions, balances, totalBalance, monthSummary } from '../lib/store';
  import { getDashboardData, monthlyTrend } from '../lib/dashboard';
  import { formatIDR } from '../lib/format';
  import PieChart from './PieChart.svelte';
  import LineChart from './LineChart.svelte';

  $: dashboard = getDashboardData($accounts, $categories, $transactions);
  $: monthly = monthlyTrend($transactions, 12);
  $: total = $totalBalance;
  $: share = (value: number) => {
    const base = Math.max(total, 1);
    if (base === 0) return '0';
    return ((value / base) * 100).toFixed(0);
  };
</script>

<div class="grid gap-4 lg:grid-cols-3">
  <!-- Summary Cards -->
  <div class="space-y-4 lg:col-span-3">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-line bg-paper p-3">
        <dt class="font-mono text-[11px] text-ink2">Saldo total</dt>
        <dd class="num mt-1 text-2xl font-medium text-ink">{formatIDR(dashboard.totalBalance)}</dd>
      </div>
      <div class="rounded-lg border border-line bg-paper p-5">
        <dt class="font-mono text-[11px] text-ink2">Pemasukan</dt>
        <dd class="num mt-1 text-2xl font-medium text-ink">+{formatIDR(dashboard.totalIncome)}</dd>
      </div>
      <div class="rounded-lg border border-line bg-paper p-5">
        <dt class="font-mono text-[11px] text-ink2">Pengeluaran</dt>
        <dd class="num mt-1 text-2xl font-medium text-accent">−{formatIDR(dashboard.totalExpense)}</dd>
      </div>
      <div class="rounded-lg border border-line bg-paper p-5">
        <dt class="font-mono text-[11px] text-ink2">Net</dt>
        <dd class="num mt-1 text-2xl font-medium {
          dashboard.net < 0 ? 'text-accent' : 'text-ink'
        }">{formatIDR(dashboard.net)}</dd>
      </div>
    </div>
  </div>

  <!-- Account Breakdown -->
  <div class="lg:col-span-2">
    <h3 class="label">Distribusi Saldo</h3>
    <div class="mt-4 space-y-4">
      {#each dashboard.accountBreakdown as account}
        <div>
          <div class="flex justify-between text-[13px]">
            <span class="text-ink">{account.name}</span>
            <span class="font-mono text-ink2">{account.percent}% · {formatIDR(account.value)}</span>
          </div>
          <div class="mt-2 h-2 w-full rounded-full bg-line">
            <div
              class="h-2 rounded-full bg-ink"
              style="width: {account.percent}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Recent Transactions -->
  <div>
    <h3 class="label">Transaksi Terbaru</h3>
    <div class="mt-4 space-y-3">
      {#if dashboard.recentTransactions.length === 0}
        <p class="text-[13px] text-ink2 italic">Belum ada transaksi</p>
      {:else}
        {#each dashboard.recentTransactions as tx}
          <div class="flex items-center justify-between rounded border border-line bg-paper px-3 py-2">
            <div class="min-w-0">
              <p class="truncate text-[13px] text-ink">{tx.description}</p>
              <p class="text-[11px] text-ink2">{new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
            </div>
            <p class="num text-[13px] font-medium {
              tx.type === 'income' ? 'text-ink' : 'text-accent'
            }">
              {tx.type === 'income' ? '+' : '−'}{formatIDR(tx.amount)}
            </p>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Pie Chart: Pengeluaran per Kategori -->
  <div class="lg:col-span-2">
    <PieChart
      data={dashboard.categoryBreakdown.filter((c) => c.value < 0)}
      title="Pengeluaran per Kategori"
    />
  </div>

  <!-- Line Chart: Trend Bulanan -->
  <div>
    <LineChart data={monthly} title="Trend Bulanan (12 bulan)" />
  </div>

  <!-- Month Summary -->
  <div>
    <h3 class="label">Bulan Ini</h3>
    <div class="mt-4 rounded-lg border border-line bg-paper p-5">
      <dl class="space-y-3">
        <div class="flex justify-between">
          <dt class="text-[13px] text-ink2">Jumlah transaksi</dt>
          <dd class="num text-[13px] text-ink">{dashboard.transactionCount}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-[13px] text-ink2">Saldo akhir</dt>
          <dd class="num text-[13px] font-medium text-ink">{formatIDR(total)}</dd>
        </div>
      </dl>
    </div>
  </div>
</div>
