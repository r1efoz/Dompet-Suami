-- Multi-user: tiap baris milik satu pengguna (user_id); RLS membatasi akses ke pemilik.
-- Data lama (belum punya user_id) diberikan ke pengguna tertua di auth.users. Ganti bila perlu:
--   update <tabel> set user_id = '<uuid>' ...;

alter table accounts add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
update accounts set user_id = (select id from auth.users order by created_at limit 1) where user_id is null;
alter table accounts alter column user_id set not null;
create index if not exists idx_accounts_user on accounts(user_id);
drop policy if exists "Authenticated all accounts" on accounts;
drop policy if exists "Own rows accounts" on accounts;
create policy "Own rows accounts" on accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table categories add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
update categories set user_id = (select id from auth.users order by created_at limit 1) where user_id is null;
alter table categories alter column user_id set not null;
create index if not exists idx_categories_user on categories(user_id);
drop policy if exists "Authenticated all categories" on categories;
drop policy if exists "Own rows categories" on categories;
create policy "Own rows categories" on categories for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table transactions add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
update transactions set user_id = (select id from auth.users order by created_at limit 1) where user_id is null;
alter table transactions alter column user_id set not null;
create index if not exists idx_transactions_user on transactions(user_id);
drop policy if exists "Authenticated all transactions" on transactions;
drop policy if exists "Own rows transactions" on transactions;
create policy "Own rows transactions" on transactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
