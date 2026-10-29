<script lang="ts">
  import { onMount } from 'svelte';
  import Home from './views/Home.svelte';
  import Master from './views/Master.svelte';
  import Transaction from './views/Transaction.svelte';
  import Report from './views/Report.svelte';
  import { loadInitialData } from './lib/store';

  const views = [
    { id: 'home', label: 'Home' },
    { id: 'master', label: 'Master' },
    { id: 'transaction', label: 'Transaksi' },
    { id: 'report', label: 'Laporan' }
  ];

  let currentView: 'home' | 'master' | 'transaction' | 'report' = 'home';

  onMount(async () => {
    try {
      await loadInitialData();
    } catch (err) {
      console.error('Gagal memuat data awal:', err);
    }
  });
</script>

<div class="min-h-screen">
  <header class="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-[3px]">
    <div class="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-6">
      <div class="flex items-center gap-2">
        <svg class="h-6 w-6 text-ink" aria-hidden="true">
          <use href="/icons.svg#piggy-bank-icon"></use>
        </svg>
        <span class="font-semibold text-lg text-ink">Dompet Suami</span>
        <span class="hidden font-mono text-[11px] text-ink2 sm:inline">buku kas</span>
      </div>

      <div class="flex gap-1 rounded-lg bg-line p-1">
        {#each views as view (view.id)}
          <button
            type="button"
            class="rounded px-4 py-1.5 text-[13px] font-medium transition-all duration-200 {
              currentView === view.id
                ? 'bg-paper text-ink shadow-sm'
                : 'text-ink2 hover:text-ink'
            }"
            on:click={() => currentView = view.id as any}
          >
            {view.label}
          </button>
        {/each}
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-[1180px] px-5 pb-14 pt-9 sm:px-6 sm:pt-11">
    {#if currentView === 'home'}
      <Home />
    {:else if currentView === 'master'}
      <Master />
    {:else if currentView === 'transaction'}
      <Transaction />
    {:else if currentView === 'report'}
      <Report />
    {/if}
  </main>

  <footer class="border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ink2">
    Data tersimpan di Supabase cloud. Unduh CSV untuk cadangan.
  </footer>
</div>
