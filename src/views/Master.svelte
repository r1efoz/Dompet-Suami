<script lang="ts">
  import AccountsManager from '../components/AccountsManager.svelte';
  import CategoryManager from '../components/CategoryManager.svelte';
  import Segmented from '../components/ui/Segmented.svelte';
  import { isDesktop } from '../lib/ui';
  import { signOut } from '../lib/auth';

  let tab = 'account';
</script>

<h1 class="mb-3 text-[20px] leading-[1.2] font-semibold">Master</h1>
{#if $isDesktop}
  <div class="grid grid-cols-2 gap-7"><AccountsManager /><CategoryManager /></div>
{:else}
  <Segmented ariaLabel="Jenis master" items={[{ id: 'account', label: 'Sumber dana' }, { id: 'category', label: 'Kategori' }]} bind:value={tab} />
  <div class="mt-4">{#if tab === 'account'}<AccountsManager />{:else}<CategoryManager />{/if}</div>
{/if}
<div class="mt-8 text-center"><button type="button" class="text-[12px] leading-[1.4] text-accent" on:click={signOut}>Keluar</button></div>
