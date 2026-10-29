<script lang="ts">
  import { formatIDR } from '../lib/format';

  export let data: { month: string; income: number; expense: number }[] = [];
  export let title = '';

  let width = 340;
  let height = 160;
  const padding = { left: 42, right: 10, top: 6, bottom: 34 };

  $: plotWidth = width - padding.left - padding.right;
  $: plotHeight = height - padding.top - padding.bottom;

  $: maxValue = Math.max(
    1,
    ...data.flatMap((d) => [d.income, d.expense])
  );

  $: xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  function x(i: number) {
    return padding.left + i * xStep;
  }

  function y(value: number) {
    return padding.top + plotHeight - (value / maxValue) * plotHeight;
  }

  function line(points: { x: number; y: number }[]) {
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  }

  $: incomePoints = data.map((d, i) => ({ x: x(i), y: y(d.income) }));
  $: expensePoints = data.map((d, i) => ({ x: x(i), y: y(d.expense) }));

  function labelMonth(i: number) {
    const m = data[i]?.month ?? '';
    return m.slice(5, 7) + '/' + m.slice(2, 4); // MM/YY
  }
</script>

<div class="space-y-4">
  <h3 class="label">{title}</h3>
  {#if data.length === 0}
    <p class="text-[13px] text-ink2 italic">Belum ada data</p>
  {:else}
    <svg
      class="w-full max-w-[300px] h-auto block"
      viewBox={`0 0 ${width} ${height}`}
      aria-label={title}
      role="img"
    >
      <!-- grid lines -->
      {#each [0.25, 0.5, 0.75, 1] as ratio}
        <path
          d={`M ${padding.left} ${y(maxValue * ratio)} H ${padding.left + plotWidth}`}
          stroke="var(--line)"
          stroke-width="0.5"
        />
      {/each}

      <path d={line(incomePoints)} fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d={line(expensePoints)} fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />

      {#each incomePoints as p, i}
        <circle cx={p.x} cy={p.y} r="2" fill="var(--ink)" />
      {/each}
      {#each expensePoints as p, i}
        <circle cx={p.x} cy={p.y} r="2" fill="var(--accent)" />
      {/each}

      <!-- y-axis labels -->
      {#each [0, 0.25, 0.5, 0.75, 1] as ratio}
        <text
          x={padding.left - 6}
          y={y(maxValue * ratio) + 3}
          text-anchor="end"
          fill="var(--ink-2)"
          font-size="10"
          font-family="var(--font-mono)"
        >
          {formatIDR(Math.round(maxValue * ratio))}
        </text>
      {/each}

      <!-- x-axis labels -->
      {#each data as d, i}
        <text
          x={x(i)}
          y={padding.top + plotHeight + 16}
          text-anchor="end"
          fill="var(--ink-2)"
          font-size="10"
          font-family="var(--font-mono)"
          transform={`rotate(-45, ${x(i)}, ${padding.top + plotHeight + 16})`}
        >
          {labelMonth(i)}
        </text>
      {/each}
    </svg>

    <div class="flex items-center gap-4 text-[11px] font-mono">
      <button type="button" class="flex items-center gap-1.5 w-full lg:w-auto text-left lg:text-left" aria-pressed="false">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 bg-ink" aria-hidden="true"></span>
        <span class="text-ink">Pemasukan</span>
      </button>
      <button type="button" class="flex items-center gap-1.5 w-full lg:w-auto text-left lg:text-left" aria-pressed="false">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 bg-accent" aria-hidden="true"></span>
        <span class="text-ink">Pengeluaran</span>
      </button>
    </div>
  {/if}
</div>
