<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Sheet from './Sheet.svelte';
  const dispatch = createEventDispatcher();
  export let open = false;
  export let title = '';
  export let description = '';
</script>

<Sheet {open} {title} on:close><p class="text-[13px] leading-[1.45] text-ink2 mt-2">{description}</p><div class="grid grid-cols-2 gap-2 mt-4"><button class="h-11 rounded-btn bg-chip text-ink2 text-[14px]" on:click={() => dispatch('close')}>Batal</button><button class="h-11 rounded-btn bg-accent-soft text-accent text-[14px]" on:click>Hapus</button></div></Sheet>
