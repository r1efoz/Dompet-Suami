<script lang="ts">
  import { accounts, balances, transactions } from '../lib/store';
  import { formatIDR } from '../lib/format';
  import { isReferenced } from '../lib/master';
  import type { Account } from '../models/Account';
  import { viewer } from '../lib/queen';
  import { currentView, reportState } from '../lib/ui';
  import Card from './ui/Card.svelte';
  import ListItem from './ui/ListItem.svelte';
  import Pill from './ui/Pill.svelte';
  import MasterSheet from './MasterSheet.svelte';

  const GROUPS = [{ type: 'bank', label: 'Bank', icon: '🏦' }, { type: 'ewallet', label: 'E-Wallet', icon: '💳' }, { type: 'cash', label: 'Tunai', icon: '💵' }];
  const now = new Date();
  let open = false;
  let item: Account | null = null;

  const monthCount = (id: string) => $transactions.filter((t) => t.source === id && new Date(t.timestamp).getMonth() === now.getMonth() && new Date(t.timestamp).getFullYear() === now.getFullYear()).length;
  const sub = (id: string) => (isReferenced($transactions, { accountId: id }) ? `${monthCount(id)} transaksi bulan ini` : 'Belum dipakai');
  const sorted = (type: string) => $accounts.filter((a) => a.type === type).sort((a, b) => ($balances[b.id] ?? 0) - ($balances[a.id] ?? 0) || a.name.localeCompare(b.name));
  function history(a: Account) { reportState.set({ tab: 'ledger', accountId: a.id }); currentView.set('report'); }
  function edit(a: Account | null) { item = a; open = true; }
</script>

<section>
  <div class="mb-2.5 flex items-baseline justify-between"><h2 class="text-[15px] leading-[1.3] font-semibold">Akun · {$accounts.length}</h2>{#if !$viewer}<button type="button" class="h-7" on:click={() => edit(null)}><Pill variant="ink">+ Tambah</Pill></button>{/if}</div>
  {#each GROUPS as g}
    {@const list = sorted(g.type)}
    {#if list.length}
      <div class="lbl mt-3.5 mb-1.5">{g.label}</div>
      <Card dense>
        {#each list as a (a.id)}
          <div class="flex items-center border-b border-line last:border-0"><button type="button" class="block min-w-0 flex-1 text-left" aria-label="Mutasi {a.name}" on:click={() => history(a)}><ListItem icon={a.icon || g.icon} title={a.name} subtitle={sub(a.id)} amount={formatIDR($balances[a.id] ?? 0)} /></button>{#if !$viewer}<button type="button" class="h-10 shrink-0 px-3 text-[12px] text-ink2" aria-label="Ubah {a.name}" on:click={() => edit(a)}>Ubah</button>{/if}</div>
        {/each}
      </Card>
    {/if}
  {/each}
</section>
<MasterSheet kind="account" {open} {item} on:close={() => (open = false)} />
