<script lang="ts">
  import { categories } from '../lib/store';

  let newName = '';
  let newType: 'income' | 'expense' = 'expense';
  let editingId: string | null = null;
  let editName = '';
  let editType: 'income' | 'expense' = 'expense';

  function addCategory() {
    if (!newName.trim()) return;
    categories.update((cats) => [
      ...cats,
      { id: `${Date.now()}`, name: newName.trim(), type: newType }
    ]);
    newName = '';
  }

  function startEdit(category: typeof categories[$type][number]) {
    editingId = category.id;
    editName = category.name;
    editType = category.type;
  }

  function saveEdit() {
    if (!editingId) return;
    categories.update((cats) =>
      cats.map((c) =>
        c.id === editingId ? { ...c, name: editName.trim(), type: editType } : c
      )
    );
    editingId = null;
    editName = '';
  }

  function cancelEdit() {
    editingId = null;
    editName = '';
  }

  function deleteCategory(id: string) {
    if (confirm('Hapus kategori ini?')) {
      categories.update((cats) => cats.filter((c) => c.id !== id));
    }
  }
</script>

<div class="border-t border-line pt-8">
  <div class="flex items-end justify-between">
    <h2 class="label">Kategori</h2>
  </div>

  <div class="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
    <!-- Add form -->
    <div class="space-y-2 sm:col-span-2">
      <label class="label" for="category-name">Nama</label>
      <input
        id="category-name"
        type="text"
        bind:value={newName}
        placeholder="Contoh: Belanja pasar"
        class="w-full rounded border border-line bg-paper px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
      />
    </div>
    <div class="space-y-2">
      <label class="label" for="category-type">Jenis</label>
      <select
        id="category-type"
        bind:value={newType}
        class="w-full rounded border border-line bg-paper px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
      >
        <option value="income">Pemasukan</option>
        <option value="expense">Pengeluaran</option>
      </select>
    </div>
    <div class="flex items-end">
      <button
        on:click={addCategory}
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
      {#each $categories as category (category.id)}
        <tr class="cell-rule last:border-0">
          {#if editingId === category.id}
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
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
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
            <td class="py-3 text-[14px] text-ink">{category.name}</td>
            <td class="py-3 text-[12px] text-ink2">
              {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </td>
            <td class="py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  on:click={() => startEdit(category)}
                  class="rounded border border-line px-3 py-1 text-[12px] text-ink2 hover:bg-line"
                >
                  Edit
                </button>
                <button
                  on:click={() => deleteCategory(category.id)}
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
