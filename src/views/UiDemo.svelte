<script lang="ts">
  import Card from '../components/ui/Card.svelte';
  import SectionHeader from '../components/ui/SectionHeader.svelte';
  import StatStrip from '../components/ui/StatStrip.svelte';
  import Pill from '../components/ui/Pill.svelte';
  import Segmented from '../components/ui/Segmented.svelte';
  import Chips from '../components/ui/Chips.svelte';
  import Field from '../components/ui/Field.svelte';
  import Select from '../components/ui/Select.svelte';
  import Button from '../components/ui/Button.svelte';
  import ListItem from '../components/ui/ListItem.svelte';
  import Sheet from '../components/ui/Sheet.svelte';
  import ConfirmDialog from '../components/ui/ConfirmDialog.svelte';
  import Toast from '../components/ui/Toast.svelte';
  import { showToast } from '../lib/ui';
  let segment = 'one';
  let sheetOpen = false;
  let confirmOpen = false;
</script>

<svelte:head><title>UI Demo — Dompet Suami</title></svelte:head>
<main class="mx-auto max-w-[920px] p-4 pb-[92px] text-ink">
  <h1 class="text-[20px] leading-[1.2] font-semibold">Komponen UI</h1>
  <SectionHeader title="Dasar" actionLabel="Semua →" />
  <Card><p class="text-[14px]">Card standar</p></Card>
  <div class="mt-4"><StatStrip income={18340000} expense={12230000} net={6110000} periodLabel="OKT" /></div>
  <div class="mt-4 flex gap-2"><Pill>Neutral</Pill><Pill variant="pos">Positif</Pill><Pill variant="neg">Negatif</Pill><Pill variant="ink">+ Tambah</Pill></div>
  <div class="mt-4"><Segmented ariaLabel="Demo segmented" items={[{id:'one',label:'Satu'},{id:'two',label:'Dua'}]} bind:value={segment} /></div>
  <div class="mt-4"><Chips items={[{id:'a',label:'🏠 Rumah'},{id:'b',label:'🛒 Belanja'}]} value="a" /></div>
  <div class="mt-4 grid gap-3"><Field label="Nama" placeholder="Nama" /><Select label="Akun" options={[{id:'bank',label:'Bank',balance:'Rp 1.000'}]} /></div>
  <div class="mt-4 flex flex-wrap gap-2"><Button variant="primary">Simpan</Button><Button variant="ink">Edit</Button><Button variant="soft-danger">Hapus</Button><Button variant="ghost">Batal</Button><Button variant="link-danger">Hapus akun</Button></div>
  <Card dense><ListItem icon="🧾" title="Belanja" subtitle="Hari ini · Tunai" amount="−250 rb" tone="expense" percent={65} /></Card>
  <div class="mt-4 flex gap-3"><button class="h-11 rounded-btn bg-ink px-4 text-on-ink" on:click={() => sheetOpen = true}>Buka sheet demo</button><button class="h-11 rounded-btn bg-chip px-4 text-ink2" on:click={() => showToast('Toast demo.')}>Tampilkan toast demo</button><button class="h-11 rounded-btn bg-chip px-4 text-ink2" on:click={() => confirmOpen = true}>Konfirmasi demo</button></div>
  <Sheet open={sheetOpen} title="Sheet demo" on:close={() => sheetOpen = false}><p class="mt-3 text-[13px]">Isi sheet.</p></Sheet>
  <ConfirmDialog open={confirmOpen} title="Hapus?" description="Tindakan ini tidak bisa dibatalkan." on:close={() => confirmOpen = false} />
  <Toast />
</main>
