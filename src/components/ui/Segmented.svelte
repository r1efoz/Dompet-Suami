<script lang="ts">
  export let items: { id: string; label: string }[] = [];
  export let value = '';
  export let ariaLabel = '';
  export let onChange: (value: string) => void = () => {};
</script>

<div role="tablist" aria-label={ariaLabel} class="bg-chip rounded-field p-[3px] flex gap-[3px]">
  {#each items as item (item.id)}
    <button type="button" role="tab" aria-selected={value === item.id} class="flex-1 text-center py-2 rounded-seg text-[13px] font-medium text-ink2 aria-selected:bg-card aria-selected:text-ink aria-selected:shadow-seg" on:click={() => { value = item.id; onChange(item.id); }}>{item.label}</button>
  {/each}
</div>
