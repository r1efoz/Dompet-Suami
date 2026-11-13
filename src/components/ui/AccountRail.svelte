<script lang="ts">
  import type { Account } from '../../models/Account';
  import type { AccountMonthStat } from '../../lib/dashboard';
  import AccountCard from './AccountCard.svelte';
  import { currentView, reportState } from '../../lib/ui';
  import type { Period } from '../../lib/reports';
  export let accounts: Account[] = [];
  export let stats: AccountMonthStat[] = [];
  export let hiddenCount = 0;
  export let periodLabel: string;
  export let ledgerPeriod: Period | undefined = undefined;
  let rail: HTMLDivElement;
  let active = 0;
  $: cards = accounts.filter((account) => (stats.find((item) => item.id === account.id)?.balance ?? 0) !== 0 || (stats.find((item) => item.id === account.id)?.count ?? 0) > 0);
  $: visibleCards = cards.length ? cards : accounts;
  function openAccount(account: Account) { reportState.set({ tab: 'ledger', accountId: account.id, ...(ledgerPeriod ? { period: ledgerPeriod } : {}) }); currentView.set('report'); }
  function handleScroll() { active = Math.round(rail.scrollLeft / 292); }
</script>

{#if visibleCards.length === 0}<div class="grid gap-3 lg:grid-cols-4">{#each accounts as account, i}{@const balance = stats.find((item) => item.id === account.id)?.balance ?? 0}<AccountCard {account} {balance} incomeThisMonth={stats.find((item) => item.id === account.id)?.income ?? 0} expenseThisMonth={stats.find((item) => item.id === account.id)?.expense ?? 0} txCountThisMonth={stats.find((item) => item.id === account.id)?.count ?? 0} tone={i === 0 ? 'ink' : i === 1 ? 'accent' : 'card'} monthLabel={periodLabel} on:click={() => openAccount(account)} />{/each}</div>
{:else}
  <div data-testid="account-rail" bind:this={rail} on:scroll={handleScroll} class="rail -mx-4 flex max-w-[calc(100vw)] snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0" style="scrollbar-width:none">
    {#each visibleCards as account, i}{@const stat = stats.find((item) => item.id === account.id)}<AccountCard {account} balance={stat?.balance ?? 0} incomeThisMonth={stat?.income ?? 0} expenseThisMonth={stat?.expense ?? 0} txCountThisMonth={stat?.count ?? 0} tone={i === 0 ? 'ink' : i === 1 ? 'accent' : 'card'} monthLabel={periodLabel} on:click={() => openAccount(account)} />{/each}
    <button type="button" class="flex min-h-[150px] w-[280px] min-w-[280px] shrink-0 snap-start flex-col items-center justify-center rounded-acard border border-dashed border-line bg-card text-ink2 lg:hidden" on:click={() => currentView.set('master')}><span class="text-[26px] font-light">+</span><span class="text-[12px]">Tambah sumber dana</span>{#if hiddenCount > 0}<span class="text-[11.5px]">{hiddenCount} akun kosong disembunyikan</span>{/if}</button>
  </div>
  <div class="dots mt-2.5 flex justify-center gap-[5px] lg:hidden" aria-hidden="true">{#each visibleCards as _, i}<span class="h-1.5 w-1.5 rounded-pill bg-line transition-[width] duration-[160ms] {active === i ? 'w-4 bg-ink' : ''}"></span>{/each}</div>
{/if}
