<script lang="ts">
  import Card from '../ui/Card.svelte';
  import SectionHeader from '../ui/SectionHeader.svelte';
  import { formatCompact } from '../../lib/format';
  import type { CategoryRow, MonthlyRow } from '../../lib/reports';

  export let income = 0;
  export let expense = 0;
  export let expenseRows: CategoryRow[] = [];
  export let months: { rows: MonthlyRow[]; total: Omit<MonthlyRow, 'month'> };
  export let title = 'Per bulan';
  export let selectedMonth: number | null = null;

  const NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const OPACITY = [1, 0.65, 0.35, 0.2];
  const signed = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${formatCompact(n)}`;
  const tone = (n: number) => (n < 0 ? 'text-accent' : n > 0 ? 'text-pos' : 'text-ink');

  $: net = income - expense;
  $: top = expenseRows.slice(0, 3).map((r) => r.amount);
  $: segments = [...top, expense - top.reduce((a, b) => a + b, 0)].filter((v) => v > 0);
  $: saving = income > 0 ? Math.round((net / income) * 100) : 0;
  $: ratio = income > 0 ? Math.round((expense / income) * 100) : 0;
</script>

<div class="grid gap-x-5 lg:grid-cols-12">
  <section class="lg:col-span-5">
    <SectionHeader title="Arus kas" />
    <Card>
      <div class="grid grid-cols-3 text-center">
        <div><div class="lbl">Masuk</div><div class="num text-[15px] font-semibold text-pos">{formatCompact(income)}</div></div>
        <div><div class="lbl">Keluar</div><div class="num text-[15px] font-semibold text-accent">{formatCompact(expense)}</div></div>
        <div><div class="lbl">Net</div><div class="num text-[15px] font-semibold {net < 0 ? 'text-accent' : 'text-ink'}">{signed(net)}</div></div>
      </div>
      <div class="mt-3.5 flex h-2.5 gap-1.5 overflow-hidden rounded-pill bg-chip">
        {#each segments as v, i}<div class="bg-accent" style="width:{(v / expense) * 100}%;opacity:{OPACITY[i]}"></div>{/each}
      </div>
      <p class="mt-2 text-[11px] text-ink2">{income > 0 ? `Rasio tabungan ${saving}% · Keluar/Masuk ${ratio}%` : 'Belum ada pemasukan di periode ini'}</p>
    </Card>
  </section>
  <section class="lg:col-span-7">
    <SectionHeader {title} />
    <Card dense>
      <table class="w-full">
        <thead><tr class="lbl text-right"><th scope="col" class="py-2 text-left">Bulan</th><th scope="col">Masuk</th><th scope="col">Keluar</th><th scope="col">Net</th></tr></thead>
        <tbody>
          {#each months.rows as r (r.month)}
            <tr class="border-t border-line text-[13px] {selectedMonth === r.month ? 'font-semibold' : ''}">
              <td class="py-2.5">{NAMES[r.month]}</td>
              <td class="num text-right text-pos">{formatCompact(r.income)}</td>
              <td class="num text-right text-accent">{formatCompact(r.expense)}</td>
              <td class="num text-right {tone(r.net)}">{signed(r.net)}</td>
            </tr>
          {/each}
          <tr class="tot border-t border-ink text-[13px] font-semibold">
            <td class="py-2.5">Total</td>
            <td class="num text-right text-pos">{formatCompact(months.total.income)}</td>
            <td class="num text-right text-accent">{formatCompact(months.total.expense)}</td>
            <td class="num text-right {tone(months.total.net)}">{signed(months.total.net)}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  </section>
</div>
