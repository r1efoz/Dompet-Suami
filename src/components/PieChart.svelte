<script lang="ts">
  export let data: { name: string; value: number }[] = [];
  export let title = '';
  export let size = 140;

  const palette = [
    'var(--ink)',
    'var(--ink-2)',
    'var(--accent)',
    "color-mix(in srgb, var(--accent) 60%, var(--paper))",
    "color-mix(in srgb, var(--ink-2) 50%, var(--paper))"
  ];

  $: total = data.reduce((sum, d) => sum + Math.abs(d.value), 0);

  function buildSlices() {
    const slices: Array<{
      name: string;
      value: number;
      abs: number;
      startAngle: number;
      endAngle: number;
      color: string;
    }> = [];
    let startAngle = 0;
    let index = 0;
    for (const d of data) {
      const abs = Math.abs(d.value);
      if (abs === 0) continue;
      const sliceAngle = total === 0 ? 0 : (abs / total) * 360;
      const endAngle = startAngle + sliceAngle;
      slices.push({
        name: d.name,
        value: d.value,
        abs,
        startAngle,
        endAngle,
        color: palette[index % palette.length]
      });
      index += 1;
      startAngle = endAngle;
    }
    return slices;
  }

  $: slices = buildSlices();

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }

  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [`M ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, `L ${x} ${y}`].join(' ');
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;
</script>

<div class="space-y-4">
  <h3 class="label">{title}</h3>
  {#if total === 0 || slices.length === 0}
    <p class="text-[13px] text-ink2 italic">Belum ada data</p>
  {:else}
    <div class="flex flex-col lg:flex-row items-center gap-6">
      <svg
        class="w-full max-w-[140px] h-auto"
        viewBox={`0 0 ${size} ${size}`}
        aria-label={title}
        role="img"
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" stroke-width="1" />
        {#each slices as slice}
          <path d={describeArc(cx, cy, r, slice.startAngle, slice.endAngle)} fill={slice.color} />
        {/each}
      </svg>
      <div class="space-y-2 w-full max-w-xs">
        {#each slices as slice}
          <button
            type="button"
            class="flex items-center gap-2.5 w-full text-left px-3 py-2 text-[12px] rounded-md hover:bg-[color-mix(in_srgb,var(--ink)_12%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
          >
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: {slice.color}" aria-hidden="true"></span>
            <span class="text-ink truncate">{slice.name}</span>
            <span class="font-mono text-ink2 ml-auto">{Math.round((slice.abs / Math.max(total, 1)) * 100)}%</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
