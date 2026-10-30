<script lang="ts">
  import { signIn } from '../lib/auth';
  import Field from '../components/ui/Field.svelte';

  let email = '';
  let password = '';
  let error = '';
  let busy = false;

  async function submit() {
    busy = true;
    error = '';
    try { await signIn(email, password); }
    catch (e) { error = e instanceof Error ? e.message : 'Gagal masuk.'; }
    busy = false;
  }
</script>

<main class="mx-auto flex min-h-dvh max-w-[380px] flex-col justify-center gap-5 px-5">
  <div class="flex items-center gap-3"><img src="/logo.svg" alt="" width="40" height="40" /><h1 class="text-[20px] leading-[1.2] font-semibold">Dompet Suami</h1></div>
  <form class="grid gap-4" on:submit|preventDefault={submit}>
    <Field label="Email" type="email" bind:value={email} invalid={!!error} />
    <Field label="Kata sandi" type="password" bind:value={password} invalid={!!error} />
    {#if error}<p role="alert" class="text-[12px] text-accent">{error}</p>{/if}
    <button type="submit" disabled={busy || !email || !password} class="h-12 w-full rounded-btn bg-accent text-[15px] font-semibold text-on-accent disabled:opacity-50">Masuk</button>
  </form>
</main>
