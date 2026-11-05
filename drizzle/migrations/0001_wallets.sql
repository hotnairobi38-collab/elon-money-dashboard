create table public.wallets (
  currency text primary key,
  address text not null default '',
  min_usd numeric(12,2) not null default 10,
  confirmations int not null default 2
);
grant select, update on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "signed-in can read" on public.wallets for select to authenticated using (true);
create policy "admin can update" on public.wallets for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
insert into public.wallets (currency) values ('BTC'), ('USDT (TRC20)'), ('LTC');