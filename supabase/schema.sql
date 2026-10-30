-- Dompet Suami - Database Schema (Supabase / PostgreSQL)
-- Jalankan di SQL Editor di dashboard Supabase (Project Settings → SQL Editor).

-- Enable UUID extension (untuk keperluan lain di masa depan jika diperlukan)
create extension if not exists "pgcrypto";

-- Tabel akun (Bank, Tunai, E-Wallet, dst.)
create table accounts (
  id text primary key,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'ewallet')),
  icon text,
  created_at timestamptz default now()
);

-- Tabel kategori (Gaji, Makanan, Transport, dst.)
create table categories (
  id text primary key,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  created_at timestamptz default now()
);

-- Tabel transaksi (pemasukan, pengeluaran, transfer)
create table transactions (
  id text primary key,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  description text default '',
  source text not null,
  category_id text,
  destination text,
  transfer_id text,
  timestamp timestamptz not null default now(),
  created_at timestamptz default now()
);

-- Upgrade existing databases that were created before category support.
alter table transactions add column if not exists category_id text;

-- Index untuk query cepat
create index idx_transactions_timestamp on transactions(timestamp);
create index idx_transactions_source on transactions(source);
create index idx_transactions_transfer_id on transactions(transfer_id);

-- Row Level Security: hanya pengguna yang sudah login (Supabase Auth) yang boleh akses.
alter table accounts enable row level security;
create policy "Authenticated all accounts" on accounts for all to authenticated using (true) with check (true);

alter table categories enable row level security;
create policy "Authenticated all categories" on categories for all to authenticated using (true) with check (true);

alter table transactions enable row level security;
create policy "Authenticated all transactions" on transactions for all to authenticated using (true) with check (true);

-- Catatan: Jika ingin menambahkan autentikasi (per-user data), tambahkan kolom user_id uuid
-- ke setiap tabel dan ganti kebijakan RLS dengan auth.uid() = user_id.
