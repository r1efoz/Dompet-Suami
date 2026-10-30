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
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and owner_email = (auth.jwt() ->> 'email'));
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
