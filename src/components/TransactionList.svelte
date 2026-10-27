<script lang="ts">
  import { accounts, transactions } from '../lib/store';
  import { formatDate, formatIDR } from '../lib/format';

  type Filter = 'all' | 'income' | 'expense' | 'transfer';

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'income', label: 'Masuk' },
    { id: 'expense', label: 'Keluar' },
    { id: 'transfer', label: 'Transfer' }
  ];

  let filter: Filter = 'all';

  $: ordered = [...$transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  $: visible = ordered.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'transfer') return Boolean(tx.transferId);
    if (filter === 'income') return tx.type === 'income' && !tx.transferId;
    return tx.type === 'expense' && !tx.transferId;
  });

  $: shown = visible.slice(0, 50);

  $: accountName = (id: string) => $accounts.find((account) => account.id === id)?.name ?? id;
</script>

<section aria-labelledby="ledger-heading">
  <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
    <h2 id="ledger-heading" class="text-[15px] text-ink">Riwayat</h2>
    <span class="font-mono text-[11px] text-ink2">{visible.length} entri</span>
  </div>

  <div class="mt-2 flex gap-3 border-b border-line" role="tablist" aria-label="Filter transaksi">
    {#each filters as item (item.id)}
      <button type="button" role="tab" aria-selected={filter === item.id} class="tab text-[13px] px-3" on:click={() => (filter = item.id)}>
        {item.label}
      </button>
    {/each}
  </div>

  {#if visible.length === 0}
    <div class="border-b border-line py-12 text-center">
      <p class="text-[14px] text-ink">Belum ada transaksi.</p>
      <p class="mt-1 font-mono text-[11px] text-ink2">Isi formulir di atas untuk mulai.</p>
    </div>
  {:else}
    <table class="w-full text-left">
      <caption class="sr-only">Transaksi terbaru beserta jumlah dan sumber dana</caption>
      <thead>
        <tr class="cell-rule font-mono text-[11px] text-ink2">
          <th scope="col" class="py-2 font-normal">Tanggal</th>
          <th scope="col" class="py-2 font-normal">Keterangan</th>
          <th scope="col" class="hidden py-2 font-normal sm:table-cell">Sumber</th>
          <th scope="col" class="py-2 text-right font-normal">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        {#each shown as tx (tx.id)}
          <tr class="cell-rule">
            <td class="num whitespace-nowrap py-2.5 pr-4 text-[12px] text-ink2">{formatDate(tx.timestamp)}</td>
            <td class="py-2.5 pr-4 text-[13px] text-ink">
              {tx.description}
              <span class="mt-0.5 block font-mono text-[11px] text-ink2 sm:hidden">{accountName(tx.source)}</span>
            </td>
            <td class="hidden py-2.5 pr-4 font-mono text-[11px] text-ink2 sm:table-cell">{accountName(tx.source)}</td>
            <td class="num whitespace-nowrap py-2.5 text-right text-[13px] font-medium {tx.type === 'income' ? 'text-ink' : 'text-accent'}">
              {tx.type === 'income' ? '+' : '−'}{formatIDR(tx.amount)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if visible.length > shown.length}
      <p class="border-b border-line py-2.5 text-center font-mono text-[11px] text-ink2">
        50 entri terbaru dari {visible.length}
      </p>
    {/if}
  {/if}
</section>
