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
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Tabel kategori (Gaji, Makanan, Transport, dst.)
create table categories (
  id text primary key,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
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
  created_at timestamptz default now(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade
);

-- Upgrade existing databases that were created before category support.
alter table transactions add column if not exists category_id text;

-- Index untuk query cepat
create index idx_transactions_timestamp on transactions(timestamp);
create index idx_transactions_source on transactions(source);
create index idx_transactions_transfer_id on transactions(transfer_id);

-- Row Level Security: tiap pengguna hanya melihat/mengubah barisnya sendiri (user_id = auth.uid()).
alter table accounts enable row level security;
create policy "Own rows accounts" on accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table categories enable row level security;
create policy "Own rows categories" on categories for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table transactions enable row level security;
create policy "Own rows transactions" on transactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Catatan: Jika ingin menambahkan autentikasi (per-user data), tambahkan kolom user_id uuid
-- ke setiap tabel dan ganti kebijakan RLS dengan auth.uid() = user_id.
-- The Queen: satu pengguna boleh membagikan akses BACA ke satu email (istri).
create table if not exists shares (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  owner_email text not null default (auth.jwt() ->> 'email'),
  spouse_email text not null check (position('@' in spouse_email) > 1),
  created_at timestamptz default now()
);
alter table shares enable row level security;

drop policy if exists "Owner manages share" on shares;
create policy "Owner manages share" on shares for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Spouse sees share" on shares;
create policy "Spouse sees share" on shares for select to authenticated
  using (lower(spouse_email) = lower(auth.jwt() ->> 'email'));

-- Tambahan baca untuk istri (kebijakan "Own rows ..." tetap berlaku untuk tulis).
drop policy if exists "Spouse reads accounts" on accounts;
create policy "Spouse reads accounts" on accounts for select to authenticated
  using (exists (select 1 from shares s where s.owner_id = accounts.user_id and lower(s.spouse_email) = lower(auth.jwt() ->> 'email')));
drop policy if exists "Spouse reads categories" on categories;
create policy "Spouse reads categories" on categories for select to authenticated
  using (exists (select 1 from shares s where s.owner_id = categories.user_id and lower(s.spouse_email) = lower(auth.jwt() ->> 'email')));
drop policy if exists "Spouse reads transactions" on transactions;
create policy "Spouse reads transactions" on transactions for select to authenticated
  using (exists (select 1 from shares s where s.owner_id = transactions.user_id and lower(s.spouse_email) = lower(auth.jwt() ->> 'email')));
