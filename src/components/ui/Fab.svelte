<script lang="ts">
  import { onMount } from 'svelte';
  import { currentView } from '../../lib/ui';
  let desktop = typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches;
  onMount(() => {
    const query = window.matchMedia('(min-width:1024px)');
    const update = () => desktop = query.matches;
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
</script>

{#if !desktop && ($currentView === 'home' || $currentView === 'report')}
  <button type="button" aria-label="Catat transaksi" class="fixed right-4 bottom-[94px] z-30 grid h-[52px] w-[52px] place-items-center rounded-fab bg-accent text-[28px] font-light text-on-accent shadow-[var(--shadow-fab)]" on:click={() => {
    currentView.set('transaction');
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#entry-amount')?.focus());
  }}>+</button>
{/if}
