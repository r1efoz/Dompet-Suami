<script lang="ts">
  export let variant: 'neutral' | 'pos' | 'neg' | 'ink' = 'neutral';
</script>

<span class="inline-block px-2 py-0.5 rounded-pill text-[11px] font-medium {variant === 'pos' ? 'bg-pos-soft text-pos' : variant === 'neg' ? 'bg-accent-soft text-accent' : variant === 'ink' ? 'bg-ink text-on-ink px-3' : 'bg-chip text-ink2'}"><slot /></span>
