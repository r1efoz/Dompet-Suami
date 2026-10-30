<script lang="ts">
  export let title: string;
  export let actionLabel = '';
</script>

<div class="flex justify-between items-baseline mt-[22px] mb-2.5">
  <h3 class="text-[15px] leading-[1.3] font-semibold">{title}</h3>
  {#if actionLabel}<button class="text-[12px] leading-[1.4] text-ink2 hover:text-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2" on:click>{actionLabel}</button>{/if}
</div>
