<script lang="ts">
  import { onMount } from 'svelte';
  import { currentView, type View } from '../../lib/ui';
  import Pill from './Pill.svelte';
  import { viewer } from '../../lib/queen';
  import AccountMenu from '../AccountMenu.svelte';
  let desktop = typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches;
  onMount(() => {
    const query = window.matchMedia('(min-width:1024px)');
    const update = () => desktop = query.matches;
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
  const items: { id: View; label: string }[] = [
    { id: 'home', label: 'Home' }, { id: 'transaction', label: 'Transaksi' },
    { id: 'report', label: 'Laporan' }, { id: 'master', label: 'Master' }
  ];
</script>

{#if desktop}
  <header class="h-[60px] border-b border-line bg-card">
    <div class="mx-auto flex h-full max-w-[1180px] items-center gap-7 px-7">
      <div class="flex items-center gap-2 font-semibold text-[16px] text-ink"><img src="/logo.svg" alt="" width="30" height="30" />Dompet Suami</div>
      <nav aria-label="Navigasi atas" class="flex flex-1 items-center gap-1">
        {#each items as item (item.id)}
          <button type="button" aria-current={$currentView === item.id ? 'page' : undefined} class="rounded-seg px-3.5 py-2 text-[13.5px] font-medium {$currentView === item.id ? 'bg-chip text-ink' : 'text-ink2'}" on:click={() => currentView.set(item.id)}>{item.label}</button>
        {/each}
      </nav>
      {#if !$viewer}<button type="button" on:click={() => currentView.set('transaction')}><Pill variant="ink">+ Catat</Pill></button>{/if}
      <AccountMenu />
    </div>
  </header>
{/if}
