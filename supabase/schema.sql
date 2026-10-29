-- Dompet Suami - Database Schema (Supabase / PostgreSQL)
-- Jalankan di SQL Editor di dashboard Supabase (Project Settings → SQL Editor).

-- Enable UUID extension (untuk keperluan lain di masa depan jika diperlukan)
create extension if not exists "pgcrypto";

-- Tabel akun (Bank, Tunai, E-Wallet, dst.)
create table accounts (
  id text primary key,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'ewallet')),
  created_at timestamptz default now()
);

-- Tabel kategori (Gaji, Makanan, Transport, dst.)
create table categories (
  id text primary key,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz default now()
);

-- Tabel transaksi (pemasukan, pengeluaran, transfer)
create table transactions (
  id text primary key,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  description text default '',
  source text not null,
  destination text,
  transfer_id text,
  timestamp timestamptz not null default now(),
  created_at timestamptz default now()
);

-- Index untuk query cepat
create index idx_transactions_timestamp on transactions(timestamp);
create index idx_transactions_source on transactions(source);
create index idx_transactions_transfer_id on transactions(transfer_id);

-- Row Level Security (RLS) — diaktifkan, semua publik boleh akses (single-user, tanpa auth)
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "Public read accounts" on accounts for select using (true);
create policy "Public insert accounts" on accounts for insert with check (true);
create policy "Public update accounts" on accounts for update using (true);
create policy "Public delete accounts" on accounts for delete using (true);

create policy "Public read categories" on categories for select using (true);
create policy "Public insert categories" on categories for insert with check (true);
create policy "Public update categories" on categories for update using (true);
create policy "Public delete categories" on categories for delete using (true);

create policy "Public read transactions" on transactions for select using (true);
create policy "Public insert transactions" on transactions for insert with check (true);
create policy "Public update transactions" on transactions for update using (true);
create policy "Public delete transactions" on transactions for delete using (true);

-- Catatan: Jika ingin menambahkan autentikasi (per-user data), tambahkan kolom user_id uuid
-- ke setiap tabel dan ganti kebijakan RLS dengan auth.uid() = user_id.
