<script lang="ts">
  import EntryForm from '../components/EntryForm.svelte';
  import TransactionList from '../components/TransactionList.svelte';
</script>

<div class="grid min-w-0 gap-7 lg:grid-cols-[560px_1fr]">
  <EntryForm />
  <TransactionList />
</div>
