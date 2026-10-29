<script lang="ts">
  import { accounts, deleteTransaction, editingTransaction, transactions } from '../lib/store';
  import { formatDate, formatIDR } from '../lib/format';

  type Filter = 'all' | 'income' | 'expense' | 'transfer';

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'income', label: 'Masuk' },
    { id: 'expense', label: 'Keluar' },
    { id: 'transfer', label: 'Transfer' }
  ];

  let filter: Filter = 'all';
  let deletingId = '';
  let error = '';

  async function removeTransaction(id: string) {
    try {
      await deleteTransaction(id);
      deletingId = '';
      error = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menghapus transaksi.';
    }
  }

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

  {#if error}
    <p class="mt-2 font-mono text-[12px] text-accent" role="alert">{error}</p>
  {/if}

  <div class="mt-2 flex gap-3 border-b border-line" role="tablist" aria-label="Filter transaksi">
    {#each filters as item (item.id)}
      <button type="button" role="tab" aria-selected={filter === item.id} class="tab text-[13px] px-3" on:click={() => (filter = item.id)}>
        {item.label}
      </button>
    {/each}
  </div>

  {#if deletingId}
    {@const selected = $transactions.find((tx) => tx.id === deletingId)}
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" role="presentation">
      <div class="w-full max-w-sm border border-line bg-paper p-5" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" tabindex="-1">
        <h3 id="delete-title" class="text-[15px] text-ink">Hapus transaksi?</h3>
        <p id="delete-description" class="mt-2 text-[13px] text-ink2">
          {selected?.transferId ? 'Kedua catatan transfer akan dihapus.' : 'Transaksi ini akan dihapus permanen.'}
        </p>
        <div class="mt-5 flex justify-end gap-4">
          <button type="button" class="btn-quiet" on:click={() => (deletingId = '')}>Batal</button>
          <button type="button" class="min-h-11 text-[13px] font-medium text-accent underline underline-offset-4" on:click={() => removeTransaction(deletingId)}>Hapus permanen</button>
        </div>
      </div>
    </div>
  {/if}

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
          <th scope="col" class="py-2 text-right font-normal">Aksi</th>
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
            <td class="py-2.5 pl-3 text-right">
              {#if !tx.transferId || tx.type === 'expense'}
                <div class="flex justify-end gap-3">
                  <button type="button" class="min-h-11 text-[12px] text-ink2 underline underline-offset-2 hover:text-ink" aria-label="Edit transaksi {tx.description}" on:click={() => editingTransaction.set(tx)}>Edit</button>
                  <button type="button" class="min-h-11 text-[12px] text-accent underline underline-offset-2" aria-label="Hapus transaksi {tx.description}" on:click={() => (deletingId = tx.id)}>Hapus</button>
                </div>
              {/if}
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
