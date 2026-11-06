create type public.user_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]+$'),
  display_name text not null,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

create table public.notes (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.profiles(id) on delete cascade,
  note_type text not null check (note_type in (
    'Mesajlara Bakma',
    'Toplantılara Aktif Katılım',
    'Yer Alınan Alt Dallar veya Ek İşleri Eksiksiz ve Düzgün Tamamlama',
    'Yer Aldığı Bölüme Katkı Sağlama',
    'Grup ve Toplantılarda Ciddiyet'
  )),
  score integer check (score between 0 and 100),
  comment text not null default '',
  updated_at timestamptz not null default now(),
  unique (member_id, note_type)
);

grant usage on schema public to authenticated, service_role;
grant select on public.profiles to authenticated, service_role;
grant insert, update on public.profiles to service_role;
grant select, insert, update, delete on public.notes to authenticated, service_role;
grant usage, select on all sequences in schema public to service_role;

alter table public.profiles enable row level security;
alter table public.notes enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
) $$;

create policy "Users read own or admins read all profiles"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Users read own or admins read all notes"
on public.notes for select to authenticated
using (member_id = auth.uid() or public.is_admin());

create policy "Admins insert notes"
on public.notes for insert to authenticated
with check (public.is_admin());

create policy "Admins update notes"
on public.notes for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete notes"
on public.notes for delete to authenticated
using (public.is_admin());
