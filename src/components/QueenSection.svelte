<script lang="ts">
  import { session } from '../lib/auth';
  import { queenEmail, removeQueen, saveQueen } from '../lib/queen';
  import { showToast } from '../lib/ui';
  import Card from './ui/Card.svelte';
  import Field from './ui/Field.svelte';

  let email = '';
  let error = '';
  $: email = $queenEmail;

  async function save() {
    error = '';
    try { await saveQueen($session!.user.id, email); showToast('Tersimpan.'); }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal menyimpan.'; }
  }
  async function revoke() {
    try { await removeQueen($session!.user.id); showToast('Akses dicabut.'); }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal mencabut akses.'; }
  }
</script>

<section class="mt-7">
  <h2 class="mb-2.5 text-[15px] leading-[1.3] font-semibold">The Queen 👑</h2>
  <Card>
    <p class="mb-3 text-[12px] leading-[1.45] text-ink2">Istri bisa melihat dompet ini (hanya baca) setelah masuk dengan email di bawah. Akunnya dibuat dulu lewat undangan.</p>
    <form class="grid gap-3" on:submit|preventDefault={save}>
      <Field label="Email istri" type="email" bind:value={email} invalid={!!error} />
      {#if error}<p role="alert" class="text-[12px] text-accent">{error}</p>{/if}
      <div class="grid grid-cols-2 gap-2">
        <button type="submit" class="h-11 rounded-btn bg-ink text-[14px] font-semibold text-on-ink">Simpan</button>
        {#if $queenEmail}<button type="button" class="h-11 rounded-btn bg-accent-soft text-[14px] font-semibold text-accent" on:click={revoke}>Cabut akses</button>{/if}
      </div>
    </form>
  </Card>
</section>
