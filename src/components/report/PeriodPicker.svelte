<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../ui/Button.svelte';
  import Chips from '../ui/Chips.svelte';
  import Field from '../ui/Field.svelte';
  import ListItem from '../ui/ListItem.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import { formatIDR } from '../../lib/format';
  import { periodRange, type PaydayPeriod, type Period } from '../../lib/reports';

  export let period: Period;
  export let paydays: PaydayPeriod[] = [];
  const dispatch = createEventDispatcher<{ change: Period }>();
  const now = new Date();
  let windowEnd = { y: now.getFullYear(), m: now.getMonth() };
  let rangeOpen = false;
  let paydayOpen = false;
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
    { id: 'payday', label: period.kind === 'payday' ? periodRange(period, paydays).label : 'Gajian…' },
    { id: 'range', label: period.kind === 'range' ? periodRange(period).label : 'Rentang…' }
  ];
  $: value = period.kind === 'year' ? 'year' : period.kind === 'range' ? 'range' : period.kind === 'payday' ? 'payday' : months.find((m) => m.p.kind === 'month' && period.kind === 'month' && m.p.y === period.y && m.p.m === period.m)?.id ?? '';

  function choose(id: string) {
    if (id === 'prev') windowEnd = { y: windowEnd.y, m: windowEnd.m - 1 };
    else if (id === 'year') dispatch('change', { kind: 'year', y: now.getFullYear() });
    else if (id === 'range') rangeOpen = true;
    else if (id === 'payday') paydayOpen = true;
    else dispatch('change', months.find((m) => m.id === id)!.p);
  }

  function apply() {
    if (!from || !to || from > to) return;
    dispatch('change', { kind: 'range', from, to });
    rangeOpen = false;
  }
</script>

<Chips {items} {value} onChange={choose} />
<Sheet open={paydayOpen} title="Pilih gajian" on:close={() => (paydayOpen = false)}>
  {#if paydays.length === 0}
    <p class="mt-2 text-[13px] leading-[1.45] text-ink2">Belum ada pemasukan berkategori Gaji. Catat gaji dengan kategori Gaji agar periode gajian muncul.</p>
  {:else}
    <div class="mt-2">
      {#each paydays.slice(0, 12) as p (p.day)}
        <button type="button" class="block w-full text-left" on:click={() => { dispatch('change', { kind: 'payday', day: p.day }); paydayOpen = false; }}>
          <ListItem title={p.label} subtitle="Gaji {formatIDR(p.amount)}" amount={period.kind === 'payday' && period.day === p.day ? '✓' : ''} />
        </button>
      {/each}
    </div>
  {/if}
</Sheet>
<Sheet open={rangeOpen} title="Rentang tanggal" on:close={() => (rangeOpen = false)}>
  <div class="mt-3.5 grid grid-cols-2 gap-3"><Field label="Dari" type="date" bind:value={from} /><Field label="Sampai" type="date" bind:value={to} /></div>
  <div class="mt-4 grid"><Button variant="ink" disabled={!from || !to || from > to} on:click={apply}>Terapkan</Button></div>
</Sheet>
