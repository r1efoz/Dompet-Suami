<script lang="ts">
  import { accounts, balances, categories, recordEntry, recordTransfer } from '../lib/store';
  import { formatIDR, formatNumber } from '../lib/format';

  type Mode = 'income' | 'expense' | 'transfer';

  const modes: { id: Mode; label: string }[] = [
    { id: 'income', label: 'Pemasukan' },
    { id: 'expense', label: 'Pengeluaran' },
    { id: 'transfer', label: 'Transfer' }
  ];

  let mode: Mode = 'income';
  let amount = '';
  let description = '';
  let source = 'bank';
  let destination = 'cash';
  let categoryId = '';
  let adminFee = '';

  let error = '';
  let success = '';
  let timer: ReturnType<typeof setTimeout>;

  function parseInput(value: string): number {
    if (!value) return 0;
    return Number(value.replace(/\./g, ''));
  }

  function formatInput(value: string): string {
    const num = Number(value);
    if (isNaN(num)) return '';
    return formatNumber(num);
  }

  $: amountDisplay = amount ? formatInput(amount) : '';
  $: adminFeeDisplay = adminFee ? formatInput(adminFee) : '';
  $: submitLabel =
    mode === 'income' ? 'Simpan pemasukan' : mode === 'expense' ? 'Simpan pengeluaran' : 'Pindahkan dana';

  function notify(message: string, kind: 'success' | 'error') {
    clearTimeout(timer);
    success = kind === 'success' ? message : '';
    error = kind === 'error' ? message : '';
    timer = setTimeout(() => {
      success = '';
      error = '';
    }, 4000);
  }

  function switchMode(next: Mode) {
    mode = next;
    error = '';
    success = '';
    amount = '';
    description = '';
    categoryId = '';
    adminFee = '';
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const value = parseInput(amount);
    const fee = parseInput(adminFee);

    try {
      if (mode === 'transfer') {
        await recordTransfer(source, destination, value, fee);
        notify('Transfer dicatat.', 'success');
      } else {
        await recordEntry({ type: mode, amount: value, description, source, categoryId, adminFee: fee });
        notify(mode === 'income' ? 'Pemasukan dicatat.' : 'Pengeluaran dicatat.', 'success');
      }
      amount = '';
      adminFee = '';
      description = '';
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menyimpan.', 'error');
    }
  }
</script>

<section class="border-t border-line pt-5" aria-labelledby="entry-heading">
  <h2 id="entry-heading" class="text-[15px] text-ink">Catat transaksi</h2>

  <div class="mt-2 flex gap-3 border-b border-line" role="tablist" aria-label="Jenis transaksi">
    {#each modes as item (item.id)}
      <button
        type="button"
        role="tab"
        aria-selected={mode === item.id}
        class="tab text-[13px] px-3"
        on:click={() => switchMode(item.id)}
      >
        {item.label}
      </button>
    {/each}
  </div>

  <form class="mt-5 space-y-4" on:submit={handleSubmit} novalidate>
    <div>
      <label class="label" for="entry-amount">Jumlah, rupiah</label>
      <div class="relative mt-1.5">
        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-[12px] text-ink2">Rp</span>
        <input
          id="entry-amount"
          class="field num pl-10 text-[15px]"
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
          class:is-invalid={Boolean(error)}
        />
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="label" for="entry-source">{mode === 'transfer' ? 'Dari' : 'Sumber dana'}</label>
        <select id="entry-source" class="field mt-1.5" bind:value={source}>
          {#each $accounts as account (account.id)}
            <option value={account.id}>{account.name} · {formatIDR($balances[account.id] ?? 0)}</option>
          {/each}
        </select>
      </div>

      {#if mode === 'transfer'}
        <div>
          <label class="label" for="entry-destination">Ke</label>
          <select id="entry-destination" class="field mt-1.5" bind:value={destination}>
            {#each $accounts as account (account.id)}
              <option value={account.id}>{account.name} · {formatIDR($balances[account.id] ?? 0)}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label" for="entry-fee">Biaya admin</label>
          <div class="relative mt-1.5">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-[12px] text-ink2">Rp</span>
            <input
              id="entry-fee"
              class="field num pl-10 text-[15px]"
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
      {:else}
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="entry-category">Kategori</label>
            <select id="entry-category" class="field mt-1.5" bind:value={categoryId}>
              <option value="">-</option>
              {#each $categories.filter(c => c.type === mode) as cat (cat.id)}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="label" for="entry-description">Keterangan</label>
            <input
              id="entry-description"
              class="field mt-1.5"
              type="text"
              placeholder={mode === 'income' ? 'Gaji bulanan' : 'Belanja pasar'}
              bind:value={description}
            />
          </div>
        </div>
      {/if}
    </div>

    {#if mode === 'transfer'}
      <div>
        <label class="label" for="entry-note">Catatan, opsional</label>
        <input id="entry-note" class="field mt-1.5" type="text" placeholder="Tarik tunai ATM" bind:value={description} />
      </div>
    {/if}

    <button type="submit" class="btn-primary">{submitLabel}</button>

    <div aria-live="polite">
      {#if error}
        <p id="entry-error" class="font-mono text-[12px] text-accent">{error}</p>
      {:else if success}
        <p class="font-mono text-[12px] text-ink2">{success}</p>
      {/if}
    </div>
  </form>
</section>
