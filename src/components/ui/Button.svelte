<script lang="ts">
  export let variant: 'primary' | 'ink' | 'soft-danger' | 'ghost' | 'link-danger' = 'ink';
  export let disabled = false;
  export let loading = false;
  export let type: 'button' | 'submit' = 'button';
</script>

<button {type} {disabled} class="{variant === 'primary' ? 'h-12 rounded-btn bg-accent text-on-accent font-semibold text-[15px] w-full' : variant === 'ink' ? 'h-11 rounded-btn bg-ink text-on-ink font-semibold text-[14px]' : variant === 'soft-danger' ? 'h-11 rounded-btn bg-accent-soft text-accent font-semibold text-[14px]' : variant === 'link-danger' ? 'text-[12px] leading-[1.4] text-accent text-center' : 'h-11 rounded-btn bg-chip text-ink2 font-medium text-[14px]'} disabled:opacity-50 disabled:pointer-events-none hover:brightness-95 dark:hover:brightness-110 active:translate-y-px focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"><slot>{loading ? 'Menyimpan…' : ''}</slot></button>
