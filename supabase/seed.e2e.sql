-- Seed deterministik untuk scripts/e2e.mjs. Dijalankan otomatis di awal e2e.
-- Muat manual: PGPASSWORD=postgres psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -f supabase/seed.e2e.sql
truncate accounts, categories, transactions;

insert into accounts (id, name, type) values
  ('bank', 'Bank', 'bank'),
  ('cash', 'Tunai', 'cash'),
  ('ewallet', 'E-Wallet', 'ewallet');

insert into categories (id, name, type) values
  ('salary', 'Gaji', 'income'),
  ('freelance', 'Freelance', 'income'),
  ('food', 'Makanan', 'expense'),
  ('transport', 'Transport', 'expense'),
  ('utilities', 'Listrik/Air', 'expense'),
  ('entertainment', 'Hiburan', 'expense');
