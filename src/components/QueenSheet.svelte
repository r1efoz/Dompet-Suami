<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { session } from '../lib/auth';
  import { queenEmail, removeQueen, saveQueen } from '../lib/queen';
  import { showToast } from '../lib/ui';
  import Field from './ui/Field.svelte';
  import Sheet from './ui/Sheet.svelte';

  export let open = false;
  const dispatch = createEventDispatcher();
  let email = '';
  let error = '';
  function reset() { email = $queenEmail; error = ''; }
  $: if (open) reset();

  async function save() {
    error = '';
    try { await saveQueen($session!.user.id, email); showToast('Tersimpan.'); dispatch('close'); }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal menyimpan.'; }
  }
  async function revoke() {
    try { await removeQueen($session!.user.id); showToast('Akses dicabut.'); dispatch('close'); }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal mencabut akses.'; }
  }
</script>

<Sheet {open} title="The Queen 👑" on:close>
  <p class="mt-2 text-[12px] leading-[1.45] text-ink2">Istri bisa melihat dompet ini (hanya baca) setelah masuk dengan email di bawah. Akunnya dibuat dulu lewat undangan.</p>
  <form class="mt-3.5 grid gap-3" on:submit|preventDefault={save}>
    <Field label="Email istri" type="email" bind:value={email} invalid={!!error} />
    {#if error}<p role="alert" class="text-[12px] text-accent">{error}</p>{/if}
    <div class="grid grid-cols-2 gap-2">
      <button type="submit" class="h-11 rounded-btn bg-ink text-[14px] font-semibold text-on-ink">Simpan</button>
      {#if $queenEmail}<button type="button" class="h-11 rounded-btn bg-accent-soft text-[14px] font-semibold text-accent" on:click={revoke}>Cabut akses</button>{:else}<button type="button" class="h-11 rounded-btn bg-chip text-[14px] font-medium text-ink2" on:click={() => dispatch('close')}>Batal</button>{/if}
    </div>
  </form>
</Sheet>
