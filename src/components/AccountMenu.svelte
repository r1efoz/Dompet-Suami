<script lang="ts">
  import { session, setPassword, signOut } from '../lib/auth';
  import { showToast } from '../lib/ui';
  import Field from './ui/Field.svelte';
  import Sheet from './ui/Sheet.svelte';

  let open = false;
  let sheet = false;
  let password = '';
  let error = '';

  function openSheet() { open = false; password = ''; error = ''; sheet = true; }

  async function save() {
    if (password.length < 8) { error = 'Kata sandi minimal 8 karakter.'; return; }
    try {
      await setPassword(password);
      sheet = false;
      showToast('Kata sandi diubah.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      error = /different/i.test(msg) ? 'Kata sandi baru harus berbeda dari yang lama.' : 'Gagal mengubah kata sandi.';
    }
  }
</script>

<svelte:window on:click={() => (open = false)} on:keydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative">
  <button type="button" aria-label="Menu akun" aria-haspopup="menu" aria-expanded={open} class="grid h-10 w-10 place-items-center rounded-full bg-accent-soft" on:click|stopPropagation={() => (open = !open)}><img src="/logo.svg" alt="" width="26" height="26" /></button>
  {#if open}
    <div role="menu" class="absolute right-0 top-12 z-30 w-[240px] rounded-card border border-line bg-card p-1.5 shadow-[var(--shadow-sheet)]" on:click|stopPropagation on:keydown|stopPropagation>
      {#if $session?.user.email}<p class="truncate px-3 py-2 text-[11.5px] text-ink2">{$session.user.email}</p>{/if}
      <button type="button" role="menuitem" class="block w-full rounded-seg px-3 py-2.5 text-left text-[13.5px] hover:bg-chip" on:click={openSheet}>Ubah kata sandi</button>
      <button type="button" role="menuitem" class="block w-full rounded-seg px-3 py-2.5 text-left text-[13.5px] text-accent hover:bg-chip" on:click={signOut}>Keluar</button>
    </div>
  {/if}
</div>

<Sheet open={sheet} title="Ubah kata sandi" on:close={() => (sheet = false)}>
  <form class="mt-3.5 grid gap-4" on:submit|preventDefault={save}>
    <Field label="Kata sandi baru" type="password" bind:value={password} invalid={!!error} />
    {#if error}<p role="alert" class="text-[12px] text-accent">{error}</p>{/if}
    <div class="grid grid-cols-2 gap-2"><button type="submit" class="h-11 rounded-btn bg-ink text-[14px] font-semibold text-on-ink">Simpan</button><button type="button" class="h-11 rounded-btn bg-chip text-[14px] font-medium text-ink2" on:click={() => (sheet = false)}>Batal</button></div>
  </form>
</Sheet>
