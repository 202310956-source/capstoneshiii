-- =============================================
-- Transacease Supabase Schema
-- Safe to run multiple times (idempotent)
-- Run this in the Supabase SQL Editor
-- =============================================

-- ── USERS ────────────────────────────────────
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  role text default 'staff' check (role in ('admin', 'staff'))
);
alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Service role full access to users" on public.users;

create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Service role full access to users" on public.users using (true) with check (true);

-- ── PRODUCTS ─────────────────────────────────
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text default 'Uncategorized',
  price numeric default 0,
  stock integer default 0,
  reorder_level integer default 0,
  sku text default '',
  image text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.products enable row level security;

drop policy if exists "Authenticated users can read products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

create policy "Authenticated users can read products" on public.products for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert products" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update products" on public.products for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete products" on public.products for delete using (auth.role() = 'authenticated');

-- ── INGREDIENTS ──────────────────────────────
create table if not exists public.ingredients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  quantity numeric default 0,
  unit text default 'pcs',
  low_stock_threshold numeric default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.ingredients enable row level security;

drop policy if exists "Authenticated users can read ingredients" on public.ingredients;
drop policy if exists "Authenticated users can insert ingredients" on public.ingredients;
drop policy if exists "Authenticated users can update ingredients" on public.ingredients;
drop policy if exists "Authenticated users can delete ingredients" on public.ingredients;

create policy "Authenticated users can read ingredients" on public.ingredients for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert ingredients" on public.ingredients for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update ingredients" on public.ingredients for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete ingredients" on public.ingredients for delete using (auth.role() = 'authenticated');

-- ── PRODUCT–INGREDIENT LINKING ────────────────
create table if not exists public.product_ingredients (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  required_quantity numeric not null default 1
);
alter table public.product_ingredients enable row level security;

drop policy if exists "Authenticated users can read product_ingredients" on public.product_ingredients;
drop policy if exists "Authenticated users can insert product_ingredients" on public.product_ingredients;
drop policy if exists "Authenticated users can update product_ingredients" on public.product_ingredients;
drop policy if exists "Authenticated users can delete product_ingredients" on public.product_ingredients;

create policy "Authenticated users can read product_ingredients" on public.product_ingredients for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert product_ingredients" on public.product_ingredients for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update product_ingredients" on public.product_ingredients for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete product_ingredients" on public.product_ingredients for delete using (auth.role() = 'authenticated');

-- ── TRANSACTIONS ──────────────────────────────
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  subtotal numeric default 0,
  discount_amount numeric default 0,
  discount_type text default 'none',
  promo_value numeric default 0,
  total_amount numeric default 0,
  status text default 'Completed',
  cashier_uid text,
  cashier_email text,
  source text default 'pos',
  queue_number integer,
  created_at timestamptz default now()
);
alter table public.transactions enable row level security;

drop policy if exists "Authenticated users can read transactions" on public.transactions;
drop policy if exists "Anyone can insert transactions" on public.transactions;

create policy "Authenticated users can read transactions" on public.transactions for select using (auth.role() = 'authenticated');
create policy "Anyone can insert transactions" on public.transactions for insert with check (true);

-- ── TRANSACTION ITEMS ─────────────────────────
create table if not exists public.transaction_items (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade,
  product_id uuid,
  name text,
  category text,
  price numeric,
  quantity integer
);
alter table public.transaction_items enable row level security;

drop policy if exists "Authenticated users can read transaction_items" on public.transaction_items;
drop policy if exists "Anyone can insert transaction_items" on public.transaction_items;

create policy "Authenticated users can read transaction_items" on public.transaction_items for select using (auth.role() = 'authenticated');
create policy "Anyone can insert transaction_items" on public.transaction_items for insert with check (true);

-- ── REALTIME (safe to re-run) ─────────────────
do $$ begin alter publication supabase_realtime add table public.products; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.ingredients; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.product_ingredients; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.transactions; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.transaction_items; exception when others then null; end $$;
