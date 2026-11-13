<script lang="ts">
  import { accounts, categories, deleteTransaction, editingTransaction, transactions } from '../lib/store';
  import { formatIDR } from '../lib/format';
  import { filterHistory, groupByDay } from '../lib/history';
  import { showToast } from '../lib/ui';
  import { viewer } from '../lib/queen';
  import type { Transaction } from '../models/Transaction';
  import Card from './ui/Card.svelte';
  import Chips from './ui/Chips.svelte';
  import ListItem from './ui/ListItem.svelte';
  import Sheet from './ui/Sheet.svelte';
  import TransactionDetail from './TransactionDetail.svelte';

  type Filter = 'all' | 'income' | 'expense' | 'transfer' | 'incomplete';
  type Range = 'month' | 'last' | 'three' | 'all';

  $: incomplete = $categories.length === 0 ? [] : filterHistory($transactions, { filter: 'incomplete', categories: $categories });
  $: n = incomplete.length;
  $: filters = [
    { id: 'all', label: 'Semua' },
    { id: 'expense', label: 'Keluar' },
    { id: 'income', label: 'Masuk' },
    { id: 'transfer', label: 'Transfer' },
    ...(n > 0 ? [{ id: 'incomplete', label: `Perlu dilengkapi (${n})` }] : [])
  ];
  $: if (n === 0 && filter === 'incomplete') filter = 'all';
  const ranges: { id: Range; label: string }[] = [
    { id: 'month', label: 'Bulan ini' },
    { id: 'last', label: 'Bulan lalu' },
    { id: 'three', label: '3 bulan' },
    { id: 'all', label: 'Semua' }
  ];
  const PAGE = 50;
  const btn = 'active:translate-y-px focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2';

  let filter: Filter = 'all';
  let range: Range = 'month';
  let query = '';
  let account = '';
  let limit = PAGE;
  let rangeOpen = false;
  let detail: Transaction | null = null;
  let deleting: Transaction | null = null;

  const accountName = (id: string | undefined) => $accounts.find((account) => account.id === id)?.name ?? id ?? '';
  const categoryName = (id: string | undefined) => $categories.find((category) => category.id === id)?.name ?? '';
  const dayKey = (date: Date) => date.toLocaleDateString('en-CA');

  function inRange(tx: Transaction, kind: Range): boolean {
    if (kind === 'all') return true;
    const now = new Date();
    const time = new Date(tx.timestamp);
    if (kind === 'month') return time.getFullYear() === now.getFullYear() && time.getMonth() === now.getMonth();
    if (kind === 'last') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return time.getFullYear() === last.getFullYear() && time.getMonth() === last.getMonth();
    }
    return time >= new Date(now.getFullYear(), now.getMonth() - 2, 1);
  }

  function matches(tx: Transaction, text: string): boolean {
    const needle = text.trim().toLocaleLowerCase();
    return !needle || [tx.description, categoryName(tx.categoryId), accountName(tx.source), accountName(tx.destination)].some((value) => value.toLocaleLowerCase().includes(needle));
  }

  $: typed = filterHistory(filter === 'incomplete' ? $transactions : $transactions.filter((tx) => inRange(tx, range)), { filter, account, categories: $categories });
  $: filtered = typed.filter((tx) => matches(tx, query));
  $: ordered = filtered.filter((tx) => account || !tx.transferId || tx.type === 'expense').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() || b.id.localeCompare(a.id));
  $: days = groupByDay(ordered);
  $: total = days.reduce((sum, day) => sum + day.transactions.length, 0);
  $: shown = limitDays(days, limit);
  $: filtering = Boolean(query.trim()) || filter !== 'all' || Boolean(account);
  $: if (filter || range || query || account) limit = PAGE;

  function limitDays(source: typeof days, max: number) {
    let left = max;
    const out: typeof days = [];
    for (const day of source) {
      if (left <= 0) break;
      out.push({ ...day, transactions: day.transactions.slice(0, left) });
      left -= day.transactions.length;
    }
    return out;
  }

  function dayLabel(date: string): string {
    const parsed = new Date(`${date}T12:00:00`);
    const short = parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (date === dayKey(new Date())) return `Hari ini, ${short}`;
    if (date === dayKey(new Date(Date.now() - 86400000))) return `Kemarin, ${short}`;
    return parsed.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  function titleOf(tx: Transaction): string {
    return tx.description || categoryName(tx.categoryId) || 'Tanpa keterangan';
  }

  function tone(tx: Transaction): 'income' | 'expense' | 'transfer' {
    return tx.transferId ? 'transfer' : tx.type;
  }

  function amountOf(tx: Transaction): string {
    if (tx.transferId && account) return `${tx.type === 'income' ? '+' : '−'}${formatIDR(tx.amount)}`;
    if (tx.transferId) return formatIDR(tx.type === 'expense' ? pairAmount(tx) : tx.amount);
    return `${tx.type === 'income' ? '+' : '−'}${formatIDR(tx.amount)}`;
  }

  function pairAmount(tx: Transaction): number {
    return $transactions.find((item) => item.transferId === tx.transferId && item.type === 'income')?.amount ?? tx.amount;
  }

  function subtitleOf(tx: Transaction): string {
    if (tx.transferId && tx.type === 'income') return `${accountName($transactions.find((item) => item.transferId === tx.transferId && item.type === 'expense')?.source)} → ${accountName(tx.source)}`;
    return tx.transferId ? `${accountName(tx.source)} → ${accountName(tx.destination)}` : [categoryName(tx.categoryId), accountName(tx.source)].filter(Boolean).join(' · ');
  }

  function signed(value: number): string {
    return value === 0 ? '0' : `${value > 0 ? '+' : '−'}${formatIDR(value)}`;
  }

  function edit() {
    if (!detail) return;
    editingTransaction.set(detail);
    detail = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => document.getElementById('entry-amount')?.focus());
  }

  function askDelete() {
    deleting = detail;
    detail = null;
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTransaction(deleting.id);
      showToast('Transaksi dihapus.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus transaksi.', 'err');
    }
    deleting = null;
  }
</script>

<section aria-label="Riwayat transaksi" class="min-w-0">
  <div class="flex items-baseline justify-between">
    <h3 id="ledger-heading" class="text-[15px] leading-[1.3] font-semibold">Riwayat</h3>
    <span class="text-[11.5px] text-ink2">{total} entri</span>
  </div>

  <div class="mt-2.5">
    <input
      type="search"
      bind:value={query}
      placeholder="🔍 Cari keterangan…"
      aria-label="Cari keterangan"
      class="h-10 w-full rounded-field border border-line bg-card px-3 text-[14px] leading-[1.45] text-ink hover:border-ink2 focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
    />
  </div>

  <label class="mt-2.5 block"><span class="sr-only">Sumber dana</span><select bind:value={account} aria-label="Sumber dana" class="h-10 w-full rounded-field border border-line bg-card px-3 text-ink focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"><option value="">Semua sumber dana</option>{#each $accounts as a (a.id)}<option value={a.id}>{a.name}</option>{/each}</select></label>

  <div class="mt-2.5 flex items-center gap-2" role="group" aria-label="Filter transaksi">
    <div class="min-w-0 flex-1"><Chips items={filters} value={filter} onChange={(id) => (filter = id as Filter)} /></div>
    <button type="button" disabled={filter === 'incomplete'} class="shrink-0 whitespace-nowrap rounded-pill border border-line bg-card px-3 py-[7px] text-[12.5px] text-ink {filter === 'incomplete' ? 'opacity-50' : ''}" on:click={() => (rangeOpen = true)}>{ranges.find((item) => item.id === range)?.label} ▾</button>
  </div>

  {#if total === 0}
    <div class="mt-4"><Card>
      <div class="py-10 text-center">
        <p class="text-[14px] leading-[1.45]">{filtering ? 'Tidak ada yang cocok.' : 'Belum ada transaksi.'}</p>
        <p class="mt-1 text-[11.5px] leading-[1.4] text-ink2">{filtering ? 'Ubah filter atau kata kunci.' : 'Isi formulir di atas untuk mulai.'}</p>
      </div>
    </Card></div>
  {:else}
    {#each shown as day (day.date)}
      <div class="mt-4 mb-1 flex justify-between text-[11.5px] leading-[1.4] text-ink2">
        <span>{dayLabel(day.date)}</span>
        <span class="num">{signed(day.subtotal)}</span>
      </div>
      <Card dense>
        {#each day.transactions as tx (tx.id)}
          <button type="button" class="block w-full text-left" aria-label="Detail {titleOf(tx)}" on:click={() => (detail = tx)}>
            <ListItem icon={tx.transferId ? '↔' : tx.type === 'income' ? '↓' : '↑'} title={titleOf(tx)} subtitle={subtitleOf(tx)} amount={amountOf(tx)} tone={tone(tx)} />
          </button>
        {/each}
      </Card>
    {/each}
    {#if total > shown.reduce((sum, day) => sum + day.transactions.length, 0)}
      <div class="mt-3"><button type="button" class="{btn} h-11 w-full rounded-btn bg-chip text-ink2 font-medium text-[14px]" on:click={() => (limit += PAGE)}>Tampilkan {PAGE} lagi</button></div>
    {/if}
  {/if}
</section>

<Sheet open={rangeOpen} title="Periode" on:close={() => (rangeOpen = false)}>
  <div class="mt-2">
    {#each ranges as item (item.id)}
      <button type="button" class="block w-full text-left" on:click={() => { range = item.id; rangeOpen = false; }}>
        <ListItem title={item.label} amount={range === item.id ? '✓' : ''} />
      </button>
    {/each}
  </div>
</Sheet>

<TransactionDetail tx={detail} on:close={() => (detail = null)}>
  <svelte:fragment slot="actions">
    {#if detail && !$viewer}<div class="mt-4 grid grid-cols-2 gap-2">
      {#if !detail.transferId || detail.type === 'expense'}
        <button type="button" class="{btn} h-11 rounded-btn bg-ink text-on-ink font-semibold text-[14px]" on:click={edit}>Edit</button>
      {:else}
        <span></span>
      {/if}
      <button type="button" class="{btn} h-11 rounded-btn bg-accent-soft text-accent font-semibold text-[14px]" on:click={askDelete}>Hapus</button>
    </div>{/if}
  </svelte:fragment>
</TransactionDetail>

<Sheet open={Boolean(deleting)} title="Hapus transaksi?" on:close={() => (deleting = null)}>
  <p class="text-[13px] leading-[1.45] text-ink2 mt-2">{deleting?.transferId ? 'Kedua catatan transfer akan dihapus.' : 'Transaksi ini akan dihapus permanen.'}</p>
  <div class="grid grid-cols-2 gap-2 mt-4">
    <button type="button" class="h-11 rounded-btn bg-chip text-ink2 text-[14px]" on:click={() => (deleting = null)}>Batal</button>
    <button type="button" class="h-11 rounded-btn bg-accent-soft text-accent text-[14px]" on:click={confirmDelete}>Hapus permanen</button>
  </div>
</Sheet>
