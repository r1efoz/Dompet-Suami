<script lang="ts">
  import { resetPassword, signIn } from '../lib/auth';
  import Field from '../components/ui/Field.svelte';

  let email = '';
  let password = '';
  let error = '';
  let busy = false;
  let info = '';

  async function submit() {
    busy = true;
    error = '';
    try { await signIn(email, password); }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal masuk.'; }
    busy = false;
  }

  async function forgot() {
    error = '';
    info = '';
    if (!email) { error = 'Isi email dulu.'; return; }
    try { await resetPassword(email); info = 'Jika email terdaftar, tautan untuk membuat kata sandi baru sudah dikirim.'; }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal.'; }
  }
</script>

<main class="mx-auto flex min-h-dvh max-w-[380px] flex-col justify-center gap-5 px-5">
  <div class="flex items-center gap-3"><img src="/logo.svg" alt="" width="40" height="40" /><h1 class="text-[20px] leading-[1.2] font-semibold">Dompet Suami</h1></div>
  <form class="grid gap-4" on:submit|preventDefault={submit}>
    <Field label="Email" type="email" bind:value={email} invalid={!!error} />
    <Field label="Kata sandi" type="password" bind:value={password} invalid={!!error} />
    {#if error}<p role="alert" class="text-[12px] text-accent">{error}</p>{/if}
    {#if info}<p role="status" class="text-[12px] text-ink2">{info}</p>{/if}
    <button type="submit" disabled={busy || !email || !password} class="h-12 w-full rounded-btn bg-accent text-[15px] font-semibold text-on-accent disabled:opacity-50">Masuk</button>
    <button type="button" class="text-center text-[12px] leading-[1.4] text-ink2" on:click={forgot}>Lupa kata sandi?</button>
  </form>
</main>
