create table public.site_settings (id text primary key default 'official_domain' check(id = 'official_domain'), official_domain text not null check(length(official_domain) between 8 and 253 and official_domain ~ '^https?://[^[:space:]]+$'));
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public domain read" on public.site_settings for select to anon, authenticated using(true);
create policy "admin domain insert" on public.site_settings for insert to authenticated with check(public.has_role(auth.uid(),'admin'));
create policy "admin domain update" on public.site_settings for update to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create table public.checkouts (id uuid primary key, user_id uuid not null, total numeric(12,2) not null, created_at timestamptz not null default now());
grant select on public.checkouts to authenticated;
grant all on public.checkouts to service_role;
alter table public.checkouts enable row level security;
create policy "own checkouts" on public.checkouts for select to authenticated using(user_id = auth.uid());
alter table public.orders add column checkout_id uuid references public.checkouts(id);
create or replace function public.checkout_cart(_items jsonb, _request_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare item jsonb; total_price numeric := 0; item_price numeric; sample_id integer; prices text := '001001100110000001011110010000100100111101010000000011011000101010011000000011001100111001100000001100101010000011101011001101000100001000001100110001011001101011010010111010001000010001001101011011000000001000111100100110101011001100000100001000001010000000001011101000110010011100001000010000111101001110010100000010110100100110000000110000000001100000000011000010000110000000100001000100100001010100110';
begin
 if auth.uid() is null then raise exception 'Not signed in'; end if;
 if _request_id is null then raise exception 'Missing checkout ID'; end if;
 perform 1 from public.profiles where id = auth.uid() for update;
 if exists(select 1 from public.checkouts where id = _request_id and user_id = auth.uid()) then return _request_id; end if;
 if jsonb_typeof(_items) <> 'array' or _items is null or jsonb_array_length(_items) < 1 or jsonb_array_length(_items) > length(prices) then raise exception 'Invalid cart'; end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(_items)) <> jsonb_array_length(_items) then raise exception 'Duplicate proxy in cart'; end if;
 for item in select value from jsonb_array_elements(_items) loop
  if coalesce(item->>'id','') !~ '^(0|[1-9][0-9]{0,2})$' then raise exception 'Invalid sample proxy'; end if;
  sample_id := (item->>'id')::integer;
  if sample_id >= length(prices) then raise exception 'Unknown sample proxy'; end if;
  item_price := case when substring(prices from sample_id+1 for 1) = '1' then 2.03 else 2.70 end;
  total_price := total_price + item_price;
 end loop;
 update public.profiles set balance = balance - total_price where id = auth.uid() and balance >= total_price;
 if not found then raise exception 'Insufficient balance — please top up first'; end if;
 insert into public.checkouts(id,user_id,total) values(_request_id,auth.uid(),total_price);
 for item in select value from jsonb_array_elements(_items) loop
  item_price := case when substring(prices from (item->>'id')::integer+1 for 1) = '1' then 2.03 else 2.70 end;
  insert into public.orders(user_id,proxy,price,checkout_id) values(auth.uid(),item || jsonb_build_object('price',item_price),item_price,_request_id);
 end loop;
 return _request_id;
end $$;
revoke all on function public.checkout_cart(jsonb,uuid) from public,anon;
grant execute on function public.checkout_cart(jsonb,uuid) to authenticated;
revoke execute on function public.place_order(jsonb,numeric) from public,anon,authenticated;
comment on function public.place_order(jsonb,numeric) is 'DEPRECATED: replaced by atomic checkout_cart with server-enforced sample prices';