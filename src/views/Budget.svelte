<script lang="ts">
  import { balances, totalBalance } from '../lib/store';
</script>

<div class="space-y-6">
  <h1 class="label">Anggaran</h1>

  <div class="rounded border border-line bg-paper p-6">
    <p class="text-ink2">Fitur anggaran sedang dalam pengembangan.</p>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <div class="rounded border border-line bg-paper p-6">
      <p class="text-[11px] font-bold text-ink2 uppercase">Total Saldo</p>
      <p class="mt-2 text-3xl font-bold text-ink">{ balances[$balances] }</p>
    </div>
    <div class="rounded border border-line bg-paper p-6">
      <p class="text-[11px] font-bold text-ink2 uppercase">Total Balance</p>
      <p class="mt-2 text-3xl font-bold text-ink">{ $totalBalance }</p>
    </div>
  </div>
</div>
