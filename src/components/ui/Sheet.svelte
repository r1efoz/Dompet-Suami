<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  export let open = false;
  export let title = '';
  const dispatch = createEventDispatcher();
  let panel: HTMLElement;
  function close() { dispatch('close'); }
  function keydown(event: KeyboardEvent) { if (event.key === 'Escape' && open) close(); }
  $: if (open && panel) requestAnimationFrame(() => panel?.focus());
  onMount(() => { window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown); });
</script>

{#if open}<div class="fixed inset-0 bg-[var(--scrim)] z-40" on:click={close} aria-hidden="true"></div><div bind:this={panel} tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="sheet-title" class="fixed inset-x-0 bottom-0 bg-card rounded-t-sheet px-5 pt-3.5 pb-[30px] shadow-[var(--shadow-sheet)] z-50 max-h-[85dvh] overflow-auto lg:inset-x-auto lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:w-full lg:max-w-[440px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-card"><div class="mx-auto mb-3.5 h-1 w-9 rounded-pill bg-line"></div><h2 id="sheet-title" class="text-[15px] leading-[1.3] font-semibold">{title}</h2><slot /></div>{/if}
