<script lang="ts">
  import { activeAccounts, balances, categories, editingTransaction, recordEntry, recordTransfer, transactions, updateEntry, updateTransfer } from '../lib/store';
  import { formatIDR, formatNumber } from '../lib/format';
  import { categoryUsageOrder } from '../lib/history';
  import { showToast } from '../lib/ui';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import Chips from './ui/Chips.svelte';
  import Segmented from './ui/Segmented.svelte';

  type Mode = 'income' | 'expense' | 'transfer';

  const modes: { id: Mode; label: string }[] = [
    { id: 'expense', label: 'Keluar' },
    { id: 'income', label: 'Masuk' },
    { id: 'transfer', label: 'Transfer' }
  ];
  const fieldClass = 'h-[46px] rounded-field border border-line bg-card px-3 text-[14px] leading-[1.45] text-ink w-full focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none';

  const today = () => new Date().toLocaleDateString('en-CA');

  let mode: Mode = 'expense';
  let amount = '';
  let description = '';
  let source = 'bank';
  let destination = 'cash';
  let categoryId = '';
  let adminFee = '';
  let transactionDate = today();

  let error = '';
  let loadedEditId = '';
  $: editing = $editingTransaction;
  $: if ($editingTransaction && loadedEditId !== $editingTransaction.id) {
    const tx = $editingTransaction;
    loadedEditId = tx.id;
    mode = tx.transferId ? 'transfer' : tx.type;
    amount = String(tx.transferId && tx.type === 'expense' ? tx.amount - transferFee(tx) : tx.amount);
    description = tx.description;
    source = tx.transferId && tx.type === 'income' ? tx.destination ?? tx.source : tx.source;
    destination = tx.transferId && tx.type === 'expense' ? tx.destination ?? 'cash' : tx.source;
    categoryId = tx.categoryId ?? '';
    adminFee = String(tx.transferId && tx.type === 'expense' ? transferFee(tx) : 0);
    transactionDate = new Date(tx.timestamp).toLocaleDateString('en-CA');
    error = '';
  }

  function transferFee(tx: import('../models/Transaction').Transaction): number {
    const incoming = $transactions.find((item) => item.transferId === tx.transferId && item.type === 'income');
    return incoming ? tx.amount - incoming.amount : 0;
  }

  function parseInput(value: string): number {
    if (!value) return 0;
    return Number(value.replace(/\./g, ''));
  }

  function formatInput(value: string): string {
    const num = Number(value);
    if (isNaN(num)) return '';
    return formatNumber(num);
  }

  function dateLabel(value: string): string {
    const date = new Date(`${value}T12:00:00`);
    const short = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const diff = Math.round((new Date(`${today()}T12:00:00`).getTime() - date.getTime()) / 86400000);
    if (diff === 0) return `Hari ini, ${short}`;
    if (diff === 1) return `Kemarin, ${short}`;
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  $: amountDisplay = amount ? formatInput(amount) : '';
  $: adminFeeDisplay = adminFee ? formatInput(adminFee) : '';
  $: submitLabel =
    mode === 'income' ? 'Simpan pemasukan' : mode === 'expense' ? 'Simpan pengeluaran' : 'Pindahkan dana';
  $: categoryItems = categoryUsageOrder($categories.filter((c) => c.type === mode), $transactions).map((c) => ({ id: c.id, label: c.name }));
  $: placeholder = mode === 'income' ? 'Gaji bulanan' : mode === 'expense' ? 'Beli LPG' : 'Tarik tunai ATM';

  function reset() {
    amount = '';
    description = '';
    adminFee = '';
    error = '';
  }

  function switchMode(next: string) {
    mode = next as Mode;
    reset();
    categoryId = '';
    transactionDate = today();
    editingTransaction.set(null);
    loadedEditId = '';
  }

  function cancelEdit() {
    editingTransaction.set(null);
    loadedEditId = '';
    reset();
    categoryId = '';
    transactionDate = today();
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const value = parseInput(amount);
    const fee = parseInput(adminFee);
    error = '';
    if (!(value > 0)) {
      error = 'Jumlah harus lebih besar dari nol.';
      return;
    }
    if (mode === 'transfer' && source === destination) {
      error = 'Akun tujuan harus berbeda.';
      return;
    }

    try {
      const timestamp = new Date(`${transactionDate}T12:00:00`).toISOString();
      if (editing) {
        const input = { id: editing.id, type: mode === 'transfer' ? editing.type : mode, amount: value, description, source, destination, categoryId, adminFee: fee, timestamp, transferId: editing.transferId };
        if (editing.transferId) await updateTransfer(input);
        else await updateEntry(input);
        editingTransaction.set(null);
        loadedEditId = '';
        showToast('Perubahan disimpan.');
      } else if (mode === 'transfer') {
        await recordTransfer(source, destination, value, fee, timestamp);
        showToast('Transfer dicatat.');
      } else {
        await recordEntry({ type: mode, amount: value, description, source, categoryId, timestamp });
        showToast(mode === 'income' ? 'Pemasukan dicatat.' : 'Pengeluaran dicatat.');
      }
      amount = '';
      adminFee = '';
      description = '';
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan.', 'err');
    }
  }
</script>

<section aria-labelledby="entry-heading" class="min-w-0">
  <h2 id="entry-heading" class="text-[20px] leading-[1.2] font-semibold">{editing ? 'Ubah transaksi' : 'Catat transaksi, Pak'}</h2>

  <div class="mt-4">
    <Segmented ariaLabel="Jenis transaksi" items={modes} value={mode} onChange={switchMode} />
  </div>

  <form class="mt-4 space-y-4" on:submit={handleSubmit} novalidate>
    <div>
      <Card>
        <div class="py-[22px] text-center">
          <label class="lbl block" for="entry-amount">JUMLAH</label>
          <div class="mt-1 flex items-center justify-center gap-1.5">
            <span class="text-[18px] text-ink2">Rp</span>
            <input
              id="entry-amount"
              class="num w-full min-w-0 bg-transparent text-center text-[36px] font-semibold tracking-[-0.03em] outline-none"
              type="text"
              inputmode="numeric"
              placeholder="0"
              value={amountDisplay}
              on:input={(e) => {
                const target = e.target as HTMLInputElement;
                const raw = target.value.replace(/\./g, '');
                amount = raw;
                target.value = formatInput(raw);
              }}
              aria-describedby={error ? 'entry-error' : undefined}
              aria-invalid={error ? 'true' : undefined}
            />
          </div>
        </div>
      </Card>
      {#if error && error.startsWith('Jumlah')}<p id="entry-error" class="mt-1.5 text-[11.5px] leading-[1.4] text-accent" role="alert">{error}</p>{/if}
    </div>

    {#if mode !== 'transfer'}
      <div>
        <span class="lbl mb-2 block">KATEGORI</span>
        <div id="entry-category">
          <Chips items={categoryItems} value={categoryId} onChange={(id) => (categoryId = categoryId === id ? '' : id)} />
        </div>
        <input type="hidden" name="categoryId" value={categoryId} />
      </div>
    {/if}

    <div>
      <div class="mb-2 flex items-baseline justify-between">
        <label class="lbl" for="entry-source">{mode === 'transfer' ? 'DARI' : 'DARI AKUN'}</label>
        <span class="num text-[11.5px] text-ink2">{formatIDR($balances[source] ?? 0)}</span>
      </div>
      <select id="entry-source" class={fieldClass} bind:value={source}>
        {#each $activeAccounts as account (account.id)}
          <option value={account.id}>{account.name} · {formatIDR($balances[account.id] ?? 0)}</option>
        {/each}
      </select>
    </div>

    {#if mode === 'transfer'}
      <div>
        <label class="lbl mb-2 block" for="entry-destination">KE</label>
        <select id="entry-destination" class={fieldClass} bind:value={destination}>
          {#each $activeAccounts as account (account.id)}
            <option value={account.id}>{account.name} · {formatIDR($balances[account.id] ?? 0)}</option>
          {/each}
        </select>
        {#if error && !error.startsWith('Jumlah')}<p id="entry-error" class="mt-1.5 text-[11.5px] leading-[1.4] text-accent" role="alert">{error}</p>{/if}
      </div>
      <div>
        <label class="lbl mb-2 block" for="entry-fee">BIAYA ADMIN</label>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[14px] text-ink2">Rp</span>
          <input
            id="entry-fee"
            class="{fieldClass} num pl-10"
            type="text"
            inputmode="numeric"
            placeholder="0"
            value={adminFeeDisplay}
            on:input={(e) => {
              const target = e.target as HTMLInputElement;
              const raw = target.value.replace(/\./g, '');
              adminFee = raw;
              target.value = formatInput(raw);
            }}
          />
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-2 gap-2.5">
      <div>
        <span class="lbl mb-2 block">TANGGAL</span>
        <div class="relative">
          <div class="{fieldClass} flex items-center">{dateLabel(transactionDate)}</div>
          <input id="entry-date" class="absolute inset-0 h-full w-full opacity-0" type="date" aria-label="Tanggal" bind:value={transactionDate} />
        </div>
      </div>
      <div>
        <label class="lbl mb-2 block" for="entry-description">KETERANGAN</label>
        <input id="entry-description" class={fieldClass} type="text" {placeholder} bind:value={description} />
      </div>
    </div>

    <div>
      <Button variant="primary" type="submit">{editing ? 'Simpan perubahan' : submitLabel}</Button>
      {#if editing}
        <div class="mt-2"><button type="button" class="h-11 w-full rounded-btn bg-chip text-[14px] font-medium text-ink2" on:click={cancelEdit}>Batal</button></div>
      {/if}
    </div>
  </form>
</section>
