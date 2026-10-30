<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Card from '../ui/Card.svelte';
  import { formatCompact, formatIDR } from '../../lib/format';
  import type { AccountBalanceRow } from '../../lib/reports';

  export let rows: AccountBalanceRow[] = [];
  const dispatch = createEventDispatcher<{ select: string }>();
  const GROUPS = [
    { type: 'bank', label: 'Bank' },
    { type: 'ewallet', label: 'E-Wallet' },
    { type: 'cash', label: 'Tunai' }
  ];
  const sum = (key: 'awal' | 'masuk' | 'keluar' | 'akhir') => rows.reduce((s, r) => s + r[key], 0);
  const cols = ['awal', 'masuk', 'keluar', 'akhir'] as const;
</script>

<div class="max-w-[920px]">
<Card dense>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[330px]">
      <thead><tr class="lbl text-right"><th scope="col" class="py-2 text-left">Akun</th>{#each cols as c}<th scope="col">{c[0].toUpperCase() + c.slice(1)}</th>{/each}</tr></thead>
      <tbody>
        {#each GROUPS as g}
          {@const group = rows.filter((r) => r.type === g.type)}
          {#if group.length}
            <tr><th colspan="5" scope="colgroup" class="lbl pt-3 pb-1 text-left">{g.label}</th></tr>
            {#each group as r (r.id)}
              <tr class="cursor-pointer border-t border-line text-[13px]" on:click={() => dispatch('select', r.id)}>
                <td class="py-2.5">{r.name}</td>
                {#each cols as c}<td class="num text-right {c === 'akhir' ? 'font-semibold' : ''}" data-value={r[c]} title={formatIDR(r[c])}>{formatCompact(r[c])}</td>{/each}
              </tr>
            {/each}
          {/if}
        {/each}
        <tr class="tot border-t border-ink text-[13px] font-semibold" data-testid="balance-total">
          <td class="py-2.5">Total</td>
          {#each cols as c}<td class="num text-right" data-value={sum(c)} title={formatIDR(sum(c))}>{formatCompact(sum(c))}</td>{/each}
        </tr>
      </tbody>
    </table>
  </div>
</Card>
<p class="mt-2 text-[11px] text-ink2">Dalam rupiah, dipadatkan. Masuk/Keluar di sini termasuk transfer antar akun; tab Arus kas tidak.</p>
</div>
