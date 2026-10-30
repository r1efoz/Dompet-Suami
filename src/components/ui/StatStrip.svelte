<script lang="ts">
  import Card from './Card.svelte';
  import { formatCompact } from '../../lib/format';
  export let income: number;
  export let expense: number;
  export let net: number;
  export let periodLabel: string;
</script>

<Card><div class="grid grid-cols-3 gap-2 text-center py-3.5 px-3">
  <div><div class="lbl">MASUK · {periodLabel}</div><div class="num text-[14px] font-semibold mt-1 text-pos">{formatCompact(income)}</div></div>
  <div class="border-x border-line"><div class="lbl">KELUAR · {periodLabel}</div><div class="num text-[14px] font-semibold mt-1 text-accent">{formatCompact(expense)}</div></div>
  <div><div class="lbl">NET · {periodLabel}</div><div class="num text-[14px] font-semibold mt-1 {net < 0 ? 'text-accent' : 'text-ink'}">{net < 0 ? '−' : '+'}{formatCompact(net)}</div></div>
</div></Card>
