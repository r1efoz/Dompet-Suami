-- Seed deterministik untuk scripts/e2e.mjs. Dijalankan otomatis di awal e2e.
-- Butuh variabel psql: -v uid=<uuid pengguna e2e> -v other=<uuid pengguna lain>
-- Muat manual: PGPASSWORD=postgres psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -v uid=... -v other=... -f supabase/seed.e2e.sql
truncate accounts, categories, transactions;

insert into accounts (id, name, type, user_id) values
  ('bank', 'Bank', 'bank', :'uid'),
  ('cash', 'Tunai', 'cash', :'uid'),
  ('ewallet', 'E-Wallet', 'ewallet', :'uid'),
  ('other-acc', 'Akun Orang Lain', 'bank', :'other');

insert into categories (id, name, type, user_id) values
  ('salary', 'Gaji', 'income', :'uid'),
  ('freelance', 'Freelance', 'income', :'uid'),
  ('food', 'Makanan', 'expense', :'uid'),
  ('transport', 'Transport', 'expense', :'uid'),
  ('utilities', 'Listrik/Air', 'expense', :'uid'),
  ('entertainment', 'Hiburan', 'expense', :'uid');
