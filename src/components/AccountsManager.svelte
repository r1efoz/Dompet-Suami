<script lang="ts">
  import { accounts, saveAccount } from '../lib/store';

  let newName = '';
  let newType: 'bank' | 'cash' | 'ewallet' = 'bank';
  let editingId: string | null = null;
  let editName = '';
  let editType: 'bank' | 'cash' | 'ewallet' = 'bank';
  let error = '';

  async function addAccount() {
    if (!newName.trim()) return;
    const newAcc = { id: `${Date.now()}`, name: newName.trim(), type: newType };
    accounts.update((accs) => [...accs, newAcc]);
    try {
      await saveAccount(newAcc);
      newName = '';
      error = '';
    } catch (e) {
      accounts.update((accs) => accs.filter((a) => a.id !== newAcc.id));
      error = 'Gagal menyimpan: ' + (e instanceof Error ? e.message : 'Unknown error');
    }
  }

  function startEdit(account: typeof accounts[$type][number]) {
    editingId = account.id;
    editName = account.name;
    editType = account.type;
  }

  async function saveEdit() {
    if (!editingId) return;
    const idx = accounts.findIndex((a) => a.id === editingId);
    if (idx === -1) return;
    const prev = accounts[idx];
    const updated = { ...prev, name: editName.trim(), type: editType };
    accounts.update((accs) => {
      const copy = [...accs];
      copy[idx] = updated;
      return copy;
    });
    try {
      await saveAccount(updated);
    } catch (e) {
      accounts.update((accs) => {
        const copy = [...accs];
        copy[idx] = prev;
        return copy;
      });
      error = 'Gagal menyimpan: ' + (e instanceof Error ? e.message : 'Unknown error');
      return;
    }
    editingId = null;
    editName = '';
    error = '';
  }

  function cancelEdit() {
    editingId = null;
    editName = '';
    error = '';
  }

  function deleteAccount(id: string) {
    if (confirm('Hapus sumber dana ini?')) {
      accounts.update((accs) => accs.filter((a) => a.id !== id));
    }
  }
</script>

<div class="border-t border-line pt-8">
  <div class="flex items-end justify-between">
    <h2 class="label">Kelola sumber dana</h2>
  </div>

  <div class="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
    <!-- Add form -->
    <div class="space-y-2 sm:col-span-2">
      <label class="label" for="account-name">Nama</label>
      <input
        id="account-name"
        type="text"
        bind:value={newName}
        placeholder="Contoh: Tabungan"
        class="w-full rounded border border-line bg-paper px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
      />
    </div>
    <div class="space-y-2">
      <label class="label" for="account-type">Jenis</label>
      <select
        id="account-type"
        bind:value={newType}
        class="w-full rounded border border-line bg-paper px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
      >
        <option value="bank">Bank</option>
        <option value="cash">Tunai</option>
        <option value="ewallet">E-Wallet</option>
      </select>
    </div>
    <div class="flex items-end">
      <button
        on:click={addAccount}
        class="w-full rounded bg-ink px-4 py-2 text-[14px] font-medium text-paper hover:bg-ink2 focus:outline-none focus:ring-2 focus:ring-ink/50"
      >
        Tambah
      </button>
    </div>
  </div>

  <table class="mt-6 w-full">
    <thead>
      <tr class="cell-rule text-left font-mono text-[11px] text-ink2">
        <th class="pb-2 font-normal">Nama</th>
        <th class="pb-2 font-normal">Jenis</th>
        <th class="pb-2 text-right font-normal">Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each $accounts as account (account.id)}
        <tr class="cell-rule last:border-0">
          {#if editingId === account.id}
            <td class="py-3">
              <input
                type="text"
                bind:value={editName}
                class="w-full rounded border border-line bg-paper px-2 py-1 text-[14px] text-ink focus:border-ink focus:outline-none"
              />
            </td>
            <td class="py-3">
              <select
                bind:value={editType}
                class="w-full rounded border border-line bg-paper px-2 py-1 text-[14px] text-ink focus:border-ink focus:outline-none"
              >
                <option value="bank">Bank</option>
                <option value="cash">Tunai</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </td>
            <td class="py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  on:click={saveEdit}
                  class="rounded bg-ink px-3 py-1 text-[12px] font-medium text-paper hover:bg-ink2"
                >
                  Simpan
                </button>
                <button
                  on:click={cancelEdit}
                  class="rounded border border-line px-3 py-1 text-[12px] text-ink2 hover:bg-line"
                >
                  Batal
                </button>
              </div>
            </td>
          {:else}
            <td class="py-3 text-[14px] text-ink">
              <div class="flex items-center gap-2">
                {#if account.type === 'bank'}
                  <svg class="h-4 w-4"><use href="#bank-icon" /></svg>
                {:else if account.type === 'cash'}
                  <svg class="h-4 w-4"><use href="#cash-icon" /></svg>
                {:else}
                  <svg class="h-4 w-4"><use href="#ewallet-icon" /></svg>
                {/if}
                {account.name}
              </div>
            </td>
            <td class="py-3 text-[12px] text-ink2 capitalize">{account.type}</td>
            <td class="py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  on:click={() => startEdit(account)}
                  class="rounded border border-line px-3 py-1 text-[12px] text-ink2 hover:bg-line"
                >
                  Edit
                </button>
                <button
                  on:click={() => deleteAccount(account.id)}
                  class="rounded border border-red/30 px-3 py-1 text-[12px] text-red hover:border-red/60 hover:bg-red/10"
                >
                  Hapus
                </button>
              </div>
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
