-- Allocation categories: money handed over to manage, kept out of spending analysis.
alter table categories add column if not exists allocation boolean not null default false;
