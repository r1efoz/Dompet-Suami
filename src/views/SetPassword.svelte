<script lang="ts">
  import { setPassword } from '../lib/auth';
  import Field from '../components/ui/Field.svelte';

  let password = '';
  let error = '';

  async function submit() {
    error = password.length < 8 ? 'Kata sandi minimal 8 karakter.' : '';
    if (error) return;
    try { await setPassword(password); history.replaceState(null, '', location.pathname); }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal menyimpan.'; }
  }
</script>

<main class="mx-auto flex min-h-dvh max-w-[380px] flex-col justify-center gap-5 px-5">
  <div class="flex items-center gap-3"><img src="/logo.svg" alt="" width="40" height="40" /><h1 class="text-[20px] leading-[1.2] font-semibold">Buat kata sandi</h1></div>
  <form class="grid gap-4" on:submit|preventDefault={submit}>
    <Field label="Kata sandi baru" type="password" bind:value={password} invalid={!!error} />
    {#if error}<p role="alert" class="text-[12px] text-accent">{error}</p>{/if}
    <button type="submit" class="h-12 w-full rounded-btn bg-accent text-[15px] font-semibold text-on-accent">Simpan dan lanjut</button>
  </form>
</main>
