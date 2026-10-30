<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { accounts, categories, transactions, saveAccount, saveCategory, deleteAccount, deleteCategory } from '../lib/store';
  import { isReferenced, validateName } from '../lib/master';
  import { showToast } from '../lib/ui';
  import ConfirmDialog from './ui/ConfirmDialog.svelte';
  import Field from './ui/Field.svelte';
  import Segmented from './ui/Segmented.svelte';
  import Sheet from './ui/Sheet.svelte';

  export let kind: 'account' | 'category';
  export let open = false;
  /** null = add mode */
  export let item: { id: string; name: string; type: string; icon?: string } | null = null;
  const dispatch = createEventDispatcher();

  const ICONS: Record<string, string[]> = {
    account: ['🏦', '💳', '💵', '🛍️', '📱', '🐔'],
    expense: ['🏠', '🛒', '🍜', '☕', '🚗', '⚡', '🎬', '💝', '🧾', '⋯'],
    income: ['💼', '🤝', '🎁', '📈']
  };
  const DEFAULT_ICON: Record<string, string> = { bank: '🏦', cash: '💵', ewallet: '💳', income: '💼', expense: '🧾' };
  const TYPES = kind === 'account'
    ? [{ id: 'bank', label: 'Bank' }, { id: 'cash', label: 'Tunai' }, { id: 'ewallet', label: 'E-Wallet' }]
    : [{ id: 'expense', label: 'Pengeluaran' }, { id: 'income', label: 'Pemasukan' }];

  let name = '';
  let type = TYPES[0].id;
  let icon = '';
  let error = '';
  let confirmOpen = false;
  function reset(src: typeof item) { name = src?.name ?? ''; type = src?.type ?? TYPES[0].id; icon = src?.icon ?? ''; error = ''; }
  $: if (open) reset(item);

  $: ref = kind === 'account' ? { accountId: item?.id } : { categoryId: item?.id };
  $: used = item ? isReferenced($transactions, ref) : false;
  $: typeLocked = kind === 'category' && used;
  $: choices = ICONS[kind === 'account' ? 'account' : type];
  $: shown = icon || DEFAULT_ICON[type];
  $: noun = kind === 'account' ? 'akun' : 'kategori';

  async function save() {
    const problem = validateName(kind === 'account' ? $accounts : $categories, name, type, item?.id);
    if (problem) { error = problem; return; }
    try {
      const row = { id: item?.id ?? String(Date.now()), name: name.trim(), type: type as never, icon: icon || undefined };
      if (kind === 'account') { await saveAccount(row); accounts.update((l) => (item ? l.map((a) => (a.id === row.id ? row : a)) : [...l, row])); }
      else { await saveCategory(row); categories.update((l) => (item ? l.map((c) => (c.id === row.id ? row : c)) : [...l, row])); }
      showToast('Disimpan.');
      dispatch('close');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Gagal menyimpan.';
    }
  }

  async function remove() {
    confirmOpen = false;
    try {
      if (kind === 'account') await deleteAccount(item!.id); else await deleteCategory(item!.id);
      showToast('Dihapus.');
      dispatch('close');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Gagal menghapus.';
    }
  }
</script>

<Sheet {open} title={item ? `Edit ${noun}` : kind === 'account' ? 'Tambah sumber dana' : 'Tambah kategori'} on:close>
  <div class="mt-3.5 grid gap-4">
    <Field label="Nama" bind:value={name} invalid={!!error} />
    <div>
      <span class="lbl mb-2 block">Jenis</span>
      {#if typeLocked}
        <p class="text-[13px] font-medium">{TYPES.find((t) => t.id === type)?.label}</p>
        <p class="mt-1 text-[11.5px] text-ink2">Jenis tidak bisa diubah karena sudah ada transaksi.</p>
      {:else}
        <Segmented items={TYPES} bind:value={type} ariaLabel="Jenis {noun}" />
      {/if}
    </div>
    <div>
      <span class="lbl mb-2 block">Ikon</span>
      <div class="flex flex-wrap gap-2">
        {#each choices as e}
          <button type="button" aria-label="Ikon {e}" aria-pressed={shown === e} class="grid h-10 w-10 place-items-center rounded-field border border-line text-[18px] {shown === e ? 'border-ink bg-chip' : 'bg-card'}" on:click={() => (icon = e)}>{e}</button>
        {/each}
      </div>
    </div>
    {#if error}<p role="alert" class="text-[12px] text-accent">{error}</p>{/if}
    <div class="grid grid-cols-2 gap-2"><button type="button" class="h-11 rounded-btn bg-ink text-on-ink text-[14px] font-semibold" on:click={save}>Simpan</button><button type="button" class="h-11 rounded-btn bg-chip text-ink2 text-[14px] font-medium" on:click={() => dispatch('close')}>Batal</button></div>
    {#if item}
      <button type="button" disabled={used} class="text-center text-[12px] leading-[1.4] text-accent disabled:opacity-50" on:click={() => (confirmOpen = true)}>Hapus {noun} (hanya bila tidak ada transaksi)</button>
    {/if}
  </div>
</Sheet>
<ConfirmDialog open={confirmOpen} title="Hapus {item?.name}?" description="Tindakan ini tidak bisa dibatalkan." on:close={() => (confirmOpen = false)} on:click={remove} />
