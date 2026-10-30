-- Auth: only signed-in users (2 accounts, public signup disabled in dashboard) may touch data.
drop policy if exists "Public read accounts" on accounts;
drop policy if exists "Public insert accounts" on accounts;
drop policy if exists "Public update accounts" on accounts;
drop policy if exists "Public delete accounts" on accounts;
drop policy if exists "Authenticated all accounts" on accounts;
create policy "Authenticated all accounts" on accounts for all to authenticated using (true) with check (true);
drop policy if exists "Public read categories" on categories;
drop policy if exists "Public insert categories" on categories;
drop policy if exists "Public update categories" on categories;
drop policy if exists "Public delete categories" on categories;
drop policy if exists "Authenticated all categories" on categories;
create policy "Authenticated all categories" on categories for all to authenticated using (true) with check (true);
drop policy if exists "Public read transactions" on transactions;
drop policy if exists "Public insert transactions" on transactions;
drop policy if exists "Public update transactions" on transactions;
drop policy if exists "Public delete transactions" on transactions;
drop policy if exists "Authenticated all transactions" on transactions;
create policy "Authenticated all transactions" on transactions for all to authenticated using (true) with check (true);
