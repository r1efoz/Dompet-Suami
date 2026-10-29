<script lang="ts">
  import { accounts, balances, transactions } from '../lib/store';
  import { buildLedger } from '../lib/ledger';
  import { formatDate, formatIDR } from '../lib/format';

  type ReportTab = 'trial' | 'ledger';

  let tab: ReportTab = 'trial';
  let selectedAccount = 'bank';
  let dateFrom = '';
  let dateTo = '';

  $: totalDebit = $accounts.reduce((sum, account) => {
    const value = $balances[account.id] ?? 0;
    return value > 0 ? sum + value : sum;
  }, 0);

  $: totalCredit = $accounts.reduce((sum, account) => {
    const value = $balances[account.id] ?? 0;
    return value < 0 ? sum + Math.abs(value) : sum;
  }, 0);

  $: filteredTx = $transactions.filter((tx) => {
    const t = new Date(tx.timestamp);
    t.setHours(0, 0, 0, 0);
    if (dateFrom) {
      const f = new Date(dateFrom);
      f.setHours(0, 0, 0, 0);
      if (t < f) return false;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(0, 0, 0, 0);
      if (t > end) return false;
    }
    return true;
  });

  $: ledgerRows = buildLedger(filteredTx, selectedAccount);

  function exportCsv() {
    const header = ['Tanggal', 'Tipe', 'Jumlah', 'Sumber', 'Tujuan', 'Keterangan'];
    const rows = [...filteredTx]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((tx) =>
        [
          new Date(tx.timestamp).toISOString(),
          tx.transferId ? 'transfer' : tx.type,
          tx.amount,
          tx.source,
          tx.destination ?? '',
          `"${tx.description.replace(/"/g, '""')}"`
        ].join(',')
      );

    const csv = [header.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dompet-suami-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<section class="border-t border-line pt-3" aria-labelledby="report-heading">
  <div class="flex items-baseline justify-between gap-3">
    <h2 id="report-heading" class="text-[14px] text-ink">Laporan</h2>
    <button type="button" on:click={exportCsv} class="btn-quiet text-[12px]">
      <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
      </svg>
      CSV
    </button>
  </div>

  <div class="mt-2 flex flex-wrap items-baseline gap-3 border-b border-line pb-2" role="group" aria-label="Filter rentang tanggal">
    <label class="label text-[12px]" for="report-date-from">Dari</label>
    <input type="date" id="report-date-from" class="field mt-1" bind:value={dateFrom} />
    <label class="label text-[12px]" for="report-date-to">Sampai</label>
    <input type="date" id="report-date-to" class="field mt-1" bind:value={dateTo} />
    {#if dateFrom || dateTo}
      <span class="font-mono text-[11px] text-ink2">{dateFrom} → {dateTo}</span>
      <button type="button" class="btn-quiet text-[12px]" on:click={() => { dateFrom = ''; dateTo = ''; }}>
        Reset filter
      </button>
    {/if}
  </div>

  <div class="mt-2 flex gap-2 border-b border-line" role="tablist" aria-label="Jenis laporan">
    <button type="button" role="tab" aria-selected={tab === 'trial'} class="tab text-[13px] px-3" on:click={() => (tab = 'trial')}>
      Neraca
    </button>
    <button type="button" role="tab" aria-selected={tab === 'ledger'} class="tab text-[13px] px-3" on:click={() => (tab = 'ledger')}>
      Buku
    </button>
  </div>

  <div class="mt-4">
    {#if tab === 'trial'}
      <div class="overflow-x-auto">
        <table class="w-full sm:min-w-0 min-w-[600px]">
          <caption class="sr-only">Neraca saldo setiap sumber dana</caption>
          <thead>
            <tr class="cell-rule text-left font-mono text-[11px] text-ink2">
              <th scope="col" class="pb-2 font-normal">Akun</th>
              <th scope="col" class="pb-2 text-right font-normal">Debit</th>
              <th scope="col" class="pb-2 text-right font-normal">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {#each $accounts as account (account.id)}
              {@const value = $balances[account.id] ?? 0}
              <tr class="cell-rule">
                <td class="py-2.5 text-[13px] text-ink">
                  {account.name}
                </td>
                <td class="num py-2.5 text-right text-[13px] text-ink">{value > 0 ? formatIDR(value) : '-'}</td>
                <td class="num py-2.5 text-right text-[13px] text-ink">{value < 0 ? formatIDR(Math.abs(value)) : '-'}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="text-[13px] font-medium text-ink">
              <td class="py-2.5">Total</td>
              <td class="num py-2.5 text-right">{formatIDR(totalDebit)}</td>
              <td class="num py-2.5 text-right">{formatIDR(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p class="mt-4 font-mono text-[11px] text-ink2">
        Saldo bersih {formatIDR(totalDebit - totalCredit)}
      </p>
    {:else}
      <div class="overflow-x-auto">
        <label class="label" for="ledger-account">Sumber dana</label>
        <select id="ledger-account" class="field mt-1.5" bind:value={selectedAccount}>
          {#each $accounts as account (account.id)}
            <option value={account.id}>{account.name}</option>
          {/each}
        </select>

        {#if ledgerRows.length === 0}
          <p class="mt-5 font-mono text-[12px] text-ink2">Belum ada mutasi.</p>
        {:else}
          <div class="mt-4 max-h-64 overflow-y-auto">
            <table class="w-full min-w-[600px]">
              <caption class="sr-only">Buku besar {selectedAccount}</caption>
              <thead class="sticky top-0 bg-paper">
                <tr class="cell-rule text-left font-mono text-[11px] text-ink2">
                  <th scope="col" class="pb-2 font-normal">Tanggal</th>
                  <th scope="col" class="pb-2 font-normal">Keterangan</th>
                  <th scope="col" class="pb-2 text-right font-normal">Mutasi</th>
                  <th scope="col" class="pb-2 text-right font-normal">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {#each ledgerRows as row (row.tx.id)}
                  <tr class="cell-rule">
                    <td class="num whitespace-nowrap py-2 text-[12px] text-ink2">{formatDate(row.tx.timestamp)}</td>
                    <td class="py-2 pr-2 text-[13px] text-ink">{row.tx.description}</td>
                    <td class="num whitespace-nowrap py-2 text-right text-[12px] {row.tx.type === 'income' ? 'text-ink' : 'text-accent'}">
                      {row.tx.type === 'income' ? '+' : '−'}{formatIDR(row.tx.amount)}
                    </td>
                    <td class="num whitespace-nowrap py-2 text-right text-[12px] font-medium text-ink">{formatIDR(row.runningBalance)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</section>
