<script lang="ts">
  export let items: { id: string; label: string; icon?: string }[] = [];
  export let value = '';
  export let multiple = false;
  export let onChange: (value: string) => void = () => {};
  let selected: string[] = [];
  $: selected = multiple ? value.split(',').filter(Boolean) : [value];
  function choose(id: string) {
    value = multiple ? (selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]).join(',') : id;
    onChange(value);
  }
</script>

<div class="flex gap-2 overflow-x-auto -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  {#each items as item (item.id)}<button type="button" class="whitespace-nowrap px-3 py-[7px] rounded-pill border border-line bg-card text-[12.5px] text-ink {selected.includes(item.id) ? 'bg-ink text-on-ink border-ink' : ''}" on:click={() => choose(item.id)}>{item.icon ?? ''}{item.label}</button>{/each}
</div>
