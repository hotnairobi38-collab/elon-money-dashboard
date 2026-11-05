create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  proxy jsonb not null,
  price numeric(12,2) not null check (price > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own or admin read orders" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.place_order(_proxy jsonb, _price numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare oid uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if _price is null or _price <= 0 or _price > 1000 then raise exception 'Invalid price'; end if;
  update public.profiles set balance = balance - _price where id = auth.uid() and balance >= _price;
  if not found then raise exception 'Insufficient balance — please top up first'; end if;
  insert into public.orders (user_id, proxy, price) values (auth.uid(), _proxy, _price) returning id into oid;
  return oid;
end $$;

create or replace function public.review_order(_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into o from public.orders where id = _id and status = 'pending' for update;
  if not found then raise exception 'Order not pending'; end if;
  update public.orders set status = case when _approve then 'approved' else 'rejected' end where id = _id;
  if not _approve then update public.profiles set balance = balance + o.price where id = o.user_id; end if;
end $$;
revoke execute on function public.place_order(jsonb,numeric) from anon;
revoke execute on function public.review_order(uuid,boolean) from anon;