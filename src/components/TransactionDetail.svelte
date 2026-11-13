<script lang="ts">
  import { formatIDR } from '../lib/format';
  import type { Account } from '../models/Account';
  import type { Category } from '../models/Category';
  import type { Transaction } from '../models/Transaction';
  import Sheet from './ui/Sheet.svelte';

  export let tx: Transaction | null = null;
  export let accounts: Account[] = [];
  export let categories: Category[] = [];
  export let transactions: Transaction[] = [];

  const accountName = (id: string | undefined) => accounts.find((a) => a.id === id)?.name ?? id ?? '';
  const categoryName = (id: string | undefined) => categories.find((c) => c.id === id)?.name ?? '';
  const pairAmount = (t: Transaction) => transactions.find((item) => item.transferId === t.transferId && item.type === 'income')?.amount ?? t.amount;

  $: title = tx ? tx.description || categoryName(tx.categoryId) || 'Tanpa keterangan' : '';
</script>

<Sheet open={Boolean(tx)} {title} on:close>
  {#if tx}
    <p class="mt-1 text-[11.5px] leading-[1.4] text-ink2">{new Date(tx.timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
    <p class="num mt-2 text-[18px] font-semibold">{tx.transferId ? formatIDR(tx.type === 'expense' ? pairAmount(tx) : tx.amount) : `${tx.type === 'income' ? '+' : '−'}${formatIDR(tx.amount)}`}</p>
    <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px] leading-[1.45]">
      <dt class="text-ink2">Keterangan</dt><dd class="text-right">{tx.description || '-'}</dd>
      <dt class="text-ink2">Akun</dt><dd class="text-right">{accountName(tx.transferId && tx.type === 'income' ? tx.destination : tx.source)}</dd>
      {#if tx.transferId}
        <dt class="text-ink2">Ke</dt><dd class="text-right">{accountName(tx.type === 'income' ? tx.source : tx.destination)}</dd>
        <dt class="text-ink2">Biaya</dt><dd class="num text-right">{formatIDR(tx.type === 'expense' ? tx.amount - pairAmount(tx) : 0)}</dd>
      {:else}
        <dt class="text-ink2">Kategori</dt><dd class="text-right">{categoryName(tx.categoryId) || '-'}</dd>
      {/if}
    </dl>
    <slot name="actions" />
  {/if}
</Sheet>
