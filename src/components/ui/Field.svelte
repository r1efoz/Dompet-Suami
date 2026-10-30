<script lang="ts">
  export let label = '';
  export let value = '';
  export let type = 'text';
  export let placeholder = '';
  export let invalid = false;
</script>

<label class="block">{#if label}<span class="lbl block mb-2">{label}</span>{/if}<input {type} bind:value {placeholder} class="h-[46px] rounded-field border border-line bg-card px-3 text-[14px] leading-[1.45] text-ink w-full hover:border-ink2 focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none {invalid ? 'border-accent' : ''}" /></label>
