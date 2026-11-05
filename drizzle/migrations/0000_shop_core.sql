create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "own profile or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(12,2) not null,
  currency text not null,
  tx_hash text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert on public.deposits to authenticated;
grant all on public.deposits to service_role;
alter table public.deposits enable row level security;
create policy "view own or admin" on public.deposits for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "create own pending" on public.deposits for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and amount > 0);

create or replace function public.review_deposit(_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public
as $$
declare d public.deposits;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  select * into d from public.deposits where id = _id and status = 'pending' for update;
  if not found then raise exception 'Deposit not pending'; end if;
  update public.deposits set status = case when _approve then 'approved' else 'rejected' end where id = _id;
  if _approve then update public.profiles set balance = balance + d.amount where id = d.user_id; end if;
end $$;
grant execute on function public.review_deposit(uuid, boolean) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare n int;
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  select count(*) into n from public.profiles;
  insert into public.user_roles (user_id, role) values (new.id, case when n = 1 then 'admin'::app_role else 'user'::app_role end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();