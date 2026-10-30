<script lang="ts">
  import type { Account } from '../../models/Account';
  import { formatCompact } from '../../lib/format';
  export let account: Account;
  export let balance: number;
  export let incomeThisMonth: number;
  export let expenseThisMonth: number;
  export let txCountThisMonth: number;
  export let tone: 'ink' | 'accent' | 'card';
  export let monthLabel: string;
</script>

<button type="button" on:click class="relative flex min-h-[150px] w-[280px] min-w-[280px] shrink-0 flex-col overflow-hidden rounded-acard p-4 px-[18px] text-left transition-transform duration-[80ms] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 {tone === 'ink' ? 'bg-acard-ink text-on-acard-ink' : tone === 'accent' ? 'bg-accent text-on-accent' : 'border border-line bg-card text-ink'}">
  {#if tone !== 'card'}<span class="pointer-events-none absolute -right-[30px] -top-[30px] h-[120px] w-[120px] rounded-full bg-overlay" aria-hidden="true"></span>{/if}
  <span class="relative flex items-center justify-between gap-2">
    <span class="truncate text-[13.5px] font-semibold">{account.icon ?? (account.type === 'bank' ? '🏦' : account.type === 'cash' ? '💵' : '💳')} {account.name}</span>
    <span class="shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-medium {tone === 'card' ? 'bg-chip text-ink2' : 'bg-overlay'}">{account.type === 'bank' ? 'Bank' : account.type === 'cash' ? 'Tunai' : 'E-Wallet'}</span>
  </span>
  <span class="num relative mt-3.5 mb-auto text-[26px] leading-none font-semibold tracking-[-0.03em]">{formatCompact(balance)}</span>
  <span class="relative mt-3.5 grid grid-cols-3 text-[12px]">
    <span><span class="block text-[10px] uppercase tracking-[0.04em] opacity-70">Masuk</span><span class="num font-semibold {tone === 'ink' ? 'text-pos-on-dark' : tone === 'accent' ? 'text-on-accent' : 'text-pos'}">{formatCompact(incomeThisMonth)}</span></span>
    <span><span class="block text-[10px] uppercase tracking-[0.04em] opacity-70">Keluar</span><span class="num font-semibold {tone === 'ink' ? 'text-neg-on-dark' : tone === 'accent' ? 'text-on-accent' : 'text-accent'}">{formatCompact(expenseThisMonth)}</span></span>
    <span class="text-right"><span class="block text-[10px] uppercase tracking-[0.04em] opacity-70">{monthLabel}</span><span class="font-semibold">{txCountThisMonth} trx</span></span>
  </span>
</button>
