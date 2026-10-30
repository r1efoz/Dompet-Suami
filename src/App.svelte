<script lang="ts">
  import { onMount } from 'svelte';
  import Home from './views/Home.svelte';
  import Master from './views/Master.svelte';
  import Transaction from './views/Transaction.svelte';
  import Report from './views/Report.svelte';
  import UiDemo from './views/UiDemo.svelte';
  import { loadInitialData } from './lib/store';
  import { currentView } from './lib/ui';
  import BottomNav from './components/ui/BottomNav.svelte';
  import TopNav from './components/ui/TopNav.svelte';
  import Fab from './components/ui/Fab.svelte';
  import OfflineBanner from './components/ui/OfflineBanner.svelte';

  let demo = false;
  let desktop = typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches;
  onMount(() => { demo = window.location.hash === '#demo'; });
  onMount(() => {
    const query = window.matchMedia('(min-width:1024px)');
    const update = () => desktop = query.matches;
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
  onMount(async () => {
    try { await loadInitialData(); }
    catch (err) { console.error('Gagal memuat data awal:', err); }
  });
</script>

<div class="min-h-dvh bg-paper text-ink">
  {#if desktop}<TopNav />{/if}
  <OfflineBanner />
  {#if demo}
    <UiDemo />
  {:else}
    <main class="mx-auto max-w-[1180px] px-4 pt-3 pb-[92px] lg:px-7 lg:pt-7 lg:pb-14">
      {#if $currentView === 'home'}<Home />
      {:else if $currentView === 'transaction'}<Transaction />
      {:else if $currentView === 'report'}<Report />
      {:else}<Master />{/if}
    </main>
    {#if !desktop}<Fab /><BottomNav />{/if}
  {/if}
</div>
