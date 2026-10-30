<script lang="ts">
  export let title: string;
  export let subtitle = '';
  export let amount = '';
  export let amountSubtitle = '';
  export let icon = '';
  export let tone: 'income' | 'expense' | 'transfer' | 'default' = 'default';
  export let percent: number | undefined = undefined;
</script>

<div class="flex items-center gap-3 py-3 border-b border-line last:border-0 min-h-[60px]">
  <span class="w-9 h-9 rounded-ico bg-chip grid place-items-center text-[15px]">{icon}</span>
  <div class="min-w-0 flex-1"><div class="text-[14px] leading-[1.45] font-medium truncate">{title}</div>{#if subtitle}<div class="text-[11.5px] leading-[1.4] text-ink2 mt-0.5">{subtitle}</div>{/if}{#if percent !== undefined}<div class="h-1.5 rounded-pill bg-chip mt-1.5"><div class="h-full rounded-pill bg-accent-fill" style={`width:${Math.max(0, Math.min(percent, 100))}%`}></div></div>{/if}</div>
  <div class="text-right whitespace-nowrap"><div class="num text-[14px] font-semibold {tone === 'income' ? 'text-pos' : tone === 'expense' ? 'text-accent' : tone === 'transfer' ? 'text-ink2' : 'text-ink'}">{amount}</div>{#if amountSubtitle}<div class="text-[11px] text-ink2">{amountSubtitle}</div>{/if}</div>
</div>
