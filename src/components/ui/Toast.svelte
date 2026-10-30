<script lang="ts">
  import { toast } from '../../lib/ui';
</script>

{#if $toast}<div role="status" class="fixed left-4 right-4 bottom-[100px] lg:left-auto lg:right-7 lg:bottom-7 lg:w-[360px] rounded-card px-4 py-3 text-[13px] leading-[1.45] {$toast.kind === 'err' ? 'bg-accent text-on-accent' : 'bg-ink text-on-ink'}">{$toast.text}</div>{/if}
