<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../ui/Button.svelte';
  import Chips from '../ui/Chips.svelte';
  import Field from '../ui/Field.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import { periodRange, type Period } from '../../lib/reports';

  export let period: Period;
  const dispatch = createEventDispatcher<{ change: Period }>();
  const now = new Date();
  let windowEnd = { y: now.getFullYear(), m: now.getMonth() };
  let rangeOpen = false;
  let from = '';
  let to = '';

  $: months = [0, 1, 2, 3].map((i) => {
    const d = new Date(windowEnd.y, windowEnd.m - i, 1);
    const p: Period = { kind: 'month', y: d.getFullYear(), m: d.getMonth() };
    const active = period.kind === 'month' && period.y === p.y && period.m === p.m;
    const label = periodRange(p).label;
    return { id: `m${i}`, p, label: active ? label : label.split(' ')[0] };
  });
  $: items = [
    { id: 'prev', label: '‹' },
    ...months.map(({ id, label }) => ({ id, label })),
    { id: 'year', label: 'Tahun ini' },
    { id: 'range', label: period.kind === 'range' ? periodRange(period).label : 'Rentang…' }
  ];
  $: value = period.kind === 'year' ? 'year' : period.kind === 'range' ? 'range' : months.find((m) => m.p.kind === 'month' && period.kind === 'month' && m.p.y === period.y && m.p.m === period.m)?.id ?? '';

  function choose(id: string) {
    if (id === 'prev') windowEnd = { y: windowEnd.y, m: windowEnd.m - 1 };
    else if (id === 'year') dispatch('change', { kind: 'year', y: now.getFullYear() });
    else if (id === 'range') rangeOpen = true;
    else dispatch('change', months.find((m) => m.id === id)!.p);
  }

  function apply() {
    if (!from || !to || from > to) return;
    dispatch('change', { kind: 'range', from, to });
    rangeOpen = false;
  }
</script>

<Chips {items} {value} onChange={choose} />
<Sheet open={rangeOpen} title="Rentang tanggal" on:close={() => (rangeOpen = false)}>
  <div class="mt-3.5 grid grid-cols-2 gap-3"><Field label="Dari" type="date" bind:value={from} /><Field label="Sampai" type="date" bind:value={to} /></div>
  <div class="mt-4"><Button variant="ink" disabled={!from || !to || from > to} on:click={apply}>Terapkan</Button></div>
</Sheet>
