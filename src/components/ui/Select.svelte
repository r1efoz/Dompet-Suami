<script lang="ts">
  export let label = '';
  export let value = '';
  export let options: { id: string; label: string; balance?: string }[] = [];
</script>

<label class="block">{#if label}<span class="lbl block mb-2">{label}</span>{/if}<select bind:value class="h-[46px] rounded-field border border-line bg-card px-3 text-[14px] leading-[1.45] text-ink w-full focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none">{#each options as option (option.id)}<option value={option.id}>{option.label}{option.balance ? ` · ${option.balance}` : ''}</option>{/each}</select></label>
