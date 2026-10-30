<script lang="ts">
  import { onMount } from 'svelte';
  import Home from './views/Home.svelte';
  import Master from './views/Master.svelte';
  import Transaction from './views/Transaction.svelte';
  import Report from './views/Report.svelte';
  import Login from './views/Login.svelte';
  import SetPassword from './views/SetPassword.svelte';
  import { needsPassword, session } from './lib/auth';
  import { available, bootstrap, switchWallet, viewer } from './lib/queen';
  import { currentView } from './lib/ui';
  import BottomNav from './components/ui/BottomNav.svelte';
  import TopNav from './components/ui/TopNav.svelte';
  import Fab from './components/ui/Fab.svelte';
  import OfflineBanner from './components/ui/OfflineBanner.svelte';
  import Toast from './components/ui/Toast.svelte';

  let desktop = typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches;
  onMount(() => {
    const query = window.matchMedia('(min-width:1024px)');
    const update = () => desktop = query.matches;
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
  let loadedFor = '';
  $: if ($session && $session.user.id !== loadedFor) {
    loadedFor = $session.user.id;
    bootstrap($session.user.id, $session.user.email ?? '').catch((err) => console.error('Gagal memuat data awal:', err));
  }
</script>

{#if $session === undefined}
  <div class="min-h-dvh bg-paper"></div>
{:else if $session && $needsPassword}
  <div class="min-h-dvh bg-paper text-ink"><SetPassword /></div>
{:else if $session === null}
  <div class="min-h-dvh bg-paper text-ink"><Login /></div>
{:else}
<div class="min-h-dvh bg-paper text-ink">
  {#if desktop}<TopNav />{/if}
  <OfflineBanner />
  {#if $viewer}<p class="bg-chip px-4 py-2 text-center text-[12px] text-ink2">Mode lihat — dompet {$viewer.ownerEmail} · <button type="button" class="font-medium underline" on:click={() => switchWallet(false)}>Pakai dompet saya</button></p>
  {:else if $available}<p class="bg-chip px-4 py-2 text-center text-[12px] text-ink2">{$available.ownerEmail} membagikan dompetnya · <button type="button" class="font-medium underline" on:click={() => switchWallet(true)}>Lihat dompet</button></p>{/if}
  <main class="mx-auto max-w-[1180px] px-4 pt-3 pb-[92px] lg:px-7 lg:pt-7 lg:pb-14">
      {#if $currentView === 'home'}<Home />
      {:else if $currentView === 'transaction'}<Transaction />
      {:else if $currentView === 'report'}<Report />
      {:else}<Master />{/if}
  </main>
  {#if !desktop}<Fab /><BottomNav />{/if}
  <Toast />
</div>
{/if}
