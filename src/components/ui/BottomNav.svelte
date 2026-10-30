<script lang="ts">
  import { currentView, type View } from '../../lib/ui';
  import { onMount } from 'svelte';
  let desktop = typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches;
  onMount(() => {
    const query = window.matchMedia('(min-width:1024px)');
    const update = () => desktop = query.matches;
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
  const items: { id: View; label: string; path: string }[] = [
    { id: 'home', label: 'Home', path: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    { id: 'transaction', label: 'Transaksi', path: 'M4 6h16M4 12h16M4 18h10' },
    { id: 'report', label: 'Laporan', path: 'M4 19V10m5 9V5m5 14v-7m5 7V8' },
    { id: 'master', label: 'Master', path: 'M3 6h18v13H3z M3 10h18M16 15h2' }
  ];
</script>

{#if !desktop}
  <nav aria-label="Navigasi bawah" class="fixed inset-x-0 bottom-0 z-30 grid h-[78px] grid-cols-4 border-t border-line bg-card px-2 pt-2 pb-[max(18px,env(safe-area-inset-bottom))]">
    {#each items as item (item.id)}
      <button type="button" aria-label={item.label} aria-current={$currentView === item.id ? 'page' : undefined} class="flex flex-col items-center justify-center gap-1 text-ink2 {$currentView === item.id ? 'text-ink' : ''}" on:click={() => currentView.set(item.id)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" stroke="currentColor" stroke-width={$currentView === item.id ? 2.1 : 1.7} stroke-linecap="round" stroke-linejoin="round"><path d={item.path} /></svg>
        <span class="text-[10.5px] font-medium">{item.label}</span>
      </button>
    {/each}
  </nav>
{/if}
