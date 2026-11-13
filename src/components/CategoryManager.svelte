<script lang="ts">
  import { categories, transactions } from '../lib/store';
  import { formatCompact } from '../lib/format';
  import { isReferenced } from '../lib/master';
  import type { Category } from '../models/Category';
  import { viewer } from '../lib/queen';
  import Card from './ui/Card.svelte';
  import ListItem from './ui/ListItem.svelte';
  import Pill from './ui/Pill.svelte';
  import MasterSheet from './MasterSheet.svelte';

  const GROUPS = [{ type: 'expense', label: 'Pengeluaran', icon: '🧾' }, { type: 'income', label: 'Pemasukan', icon: '💼' }];
  const now = new Date();
  let open = false;
  let item: Category | null = null;

  $: month = (id: string) => $transactions.filter((t) => !t.transferId && t.categoryId === id && new Date(t.timestamp).getMonth() === now.getMonth() && new Date(t.timestamp).getFullYear() === now.getFullYear()).reduce((s, t) => s + t.amount, 0);
  $: sub = (id: string) => (isReferenced($transactions, { categoryId: id }) ? `Rp ${formatCompact(month(id))} bulan ini` : 'Belum dipakai');
  $: sorted = (type: string) => $categories.filter((c) => c.type === type).sort((a, b) => month(b.id) - month(a.id) || a.name.localeCompare(b.name));
  function edit(c: Category | null) { item = c; open = true; }
</script>

<section>
  <div class="mb-2.5 flex items-baseline justify-between"><h2 class="text-[15px] leading-[1.3] font-semibold">Kategori · {$categories.length}</h2>{#if !$viewer}<button type="button" class="h-7" on:click={() => edit(null)}><Pill variant="ink">+ Tambah</Pill></button>{/if}</div>
  {#each GROUPS as g}
    {@const list = sorted(g.type)}
    {#if list.length}
      <div class="lbl mt-3.5 mb-1.5">{g.label} · {list.length}</div>
      <Card dense>
        {#each list as c (c.id)}
          <button type="button" class="block w-full text-left" on:click={() => !$viewer && edit(c)}><ListItem icon={c.icon || g.icon} title={c.name} subtitle={c.allocation ? `Alokasi · ${sub(c.id)}` : sub(c.id)} /></button>
        {/each}
      </Card>
    {/if}
  {/each}
</section>
<MasterSheet kind="category" {open} {item} on:close={() => (open = false)} />
