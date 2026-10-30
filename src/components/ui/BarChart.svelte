<script lang="ts">
  import type { MonthlyPoint } from '../../lib/dashboard';
  import { formatCompact } from '../../lib/format';
  export let data: MonthlyPoint[] = [];
  export let width = 340;
  let active: number | null = null;
  const ML = 34, MR = 4, top = 20, base = 130;
  const labels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  $: maxValue = Math.max(1, ...data.flatMap((point) => [point.income, point.expense]));
  $: colW = (width - ML - MR) / 12;
  $: bw = width === 700 ? 18 : 9;
  $: nowMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  $: current = active === null ? null : data[active];
</script>

{#if data.every((point) => point.income === 0 && point.expense === 0)}<p class="text-[13px] leading-[1.45] text-ink2 italic">Belum ada data 12 bulan terakhir.</p>
{:else}
<div class="relative">
  {#if current}<span class="absolute top-0 z-10 -translate-x-1/2 rounded-pill bg-chip px-2 py-0.5 text-[11px] font-medium" style="left:{(ML + active! * colW + colW / 2) / width * 100}%">{labels[Number(current.month.slice(5)) - 1]} · +{formatCompact(current.income)} · −{formatCompact(current.expense)}</span>{/if}
  <svg class="block h-auto w-full" viewBox="0 0 {width} 150" aria-label="Tren 12 bulan" role="img" on:mouseleave={() => active = null}>
    {#each [1, 2/3, 1/3] as r}<line x1={ML} x2={width-MR} y1={base-110*r} y2={base-110*r} stroke="var(--line)" />{/each}
    {#each data as point, i}
      {@const x = ML + i * colW + (colW - 2*bw - 1) / 2}
      {#if point.income > 0}<rect x={x} y={base-point.income/maxValue*110} width={bw} height={point.income/maxValue*110} rx="2" fill="var(--pos-fill)" />{/if}
      {#if point.expense > 0}<rect x={x+bw+1} y={base-point.expense/maxValue*110} width={bw} height={point.expense/maxValue*110} rx="2" fill="var(--accent-fill)" />{/if}
      <rect x={ML+i*colW} y="20" width={colW} height="110" fill="transparent" pointer-events="all" role="button" tabindex="0" on:click={() => active=i} on:keydown={(event) => event.key === 'Enter' && (active=i)} on:mouseenter={() => active=i} />
      <text data-month={point.month} x={ML+i*colW+colW/2} y="145" text-anchor="middle" fill={point.month === nowMonth ? 'var(--ink)' : 'var(--ink-2)'} font-size={width === 700 ? 10 : 9} font-family="var(--font-mono)" font-weight={point.month === nowMonth ? 600 : 400}>{labels[Number(point.month.slice(5))-1]}</text>
    {/each}
    {#each [1, 2/3, 1/3] as r}<text x="0" y={base-110*r+3} font-size="9" text-anchor="start" fill="var(--ink-2)" font-family="var(--font-mono)">{formatCompact(maxValue*r)}</text>{/each}
  </svg>
  <div class="flex items-center gap-2 text-[11.5px] text-ink2"><span class="h-2.5 w-2.5 rounded-[3px] bg-pos-fill" aria-hidden="true"></span><span>Masuk</span><span class="h-2.5 w-2.5 rounded-[3px] bg-accent-fill" aria-hidden="true"></span><span>Keluar</span><span class="ml-auto">Ketuk bulan untuk angka</span></div>
</div>
{/if}
