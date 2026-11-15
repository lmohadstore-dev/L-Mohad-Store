-- L’Mohad Store — configuration initiale / mise à niveau
-- Exécuter tout ce fichier dans Supabase > SQL Editor > New query > Run.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  description text not null default '',
  images text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  stock integer not null default 0 check (stock >= 0),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Migration des installations précédentes : ajoute les champs manquants sans effacer les données.
alter table public.products add column if not exists images text[] not null default '{}';
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists sizes text[] not null default '{}';
alter table public.products add column if not exists colors text[] not null default '{}';
alter table public.products alter column description set default '';

-- Seuls les comptes ajoutés explicitement ici sont administrateurs.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.admin_users enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.admin_users to authenticated;

-- Retirer les anciennes politiques trop permissives du projet initial.
drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read products" on public.products;
drop policy if exists "admin write categories" on public.categories;
drop policy if exists "admin write products" on public.products;
drop policy if exists "public can read categories" on public.categories;
drop policy if exists "public can read products" on public.products;
drop policy if exists "store admins manage categories" on public.categories;
drop policy if exists "store admins manage products" on public.products;
drop policy if exists "admins can read own membership" on public.admin_users;

create policy "public can read categories" on public.categories
  for select to anon, authenticated using (true);
create policy "public can read products" on public.products
  for select to anon, authenticated using (true);
create policy "admins can read own membership" on public.admin_users
  for select to authenticated using (user_id = auth.uid());
create policy "store admins manage categories" on public.categories
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
create policy "store admins manage products" on public.products
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Bucket public pour afficher les photos, écriture réservée aux administrateurs.
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;
drop policy if exists "public read images" on storage.objects;
drop policy if exists "admin upload images" on storage.objects;
drop policy if exists "admin delete images" on storage.objects;
drop policy if exists "store admins upload product images" on storage.objects;
drop policy if exists "store admins delete product images" on storage.objects;
create policy "public read images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'products');
create policy "store admins upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'products' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
create policy "store admins delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'products' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Active les événements Realtime pour les changements de produits et catégories.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories') then
    alter publication supabase_realtime add table public.categories;
  end if;
end $$;

insert into public.categories (name)
values ('الرجال'), ('النساء'), ('الاطفال'), ('جميع المنتجات')
on conflict (name) do nothing;

-- Après avoir créé le compte du propriétaire dans Authentication > Users,
-- exécuter cette requête en remplaçant l’adresse par son email exact :
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'OWNER_EMAIL_HERE'
-- on conflict (user_id) do nothing;
