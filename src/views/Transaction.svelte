<script lang="ts">
  import EntryForm from '../components/EntryForm.svelte';
  import { viewer } from '../lib/queen';
  import TransactionList from '../components/TransactionList.svelte';
</script>

<div class="grid min-w-0 gap-7 {$viewer ? '' : 'lg:grid-cols-[560px_1fr]'}">
  {#if !$viewer}<EntryForm />{/if}
  <TransactionList />
</div>
