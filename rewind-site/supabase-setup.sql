-- ============================================================
--  REWIND LUXURY PLACE — Supabase Database Setup
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the profiles table
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text default 'user',
  created_at  timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. Policies: users can only read/write their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. (Optional but recommended) Auto-create profile on sign-up
--    This means you don't need to manually insert from JS — it happens automatically.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Admin requests table (users can request admin access)
create table if not exists public.admin_requests (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  status      text default 'pending',
  requested_at timestamptz default now()
);

-- 6. Posts table (admins can create posts)
create table if not exists public.posts (
  id          uuid default gen_random_uuid() primary key,
  author_id   uuid references public.profiles(id) on delete set null,
  title       text,
  body        text,
  image_url   text,
  created_at  timestamptz default now()
);

-- 7. Events / flyers table (for public event cards and flyer posts)
create table if not exists public.events (
  id          uuid default gen_random_uuid() primary key,
  organizer_id uuid references auth.users(id) on delete set null,
  title       text not null,
  description text,
  location    text,
  start_time  timestamptz,
  image_url   text,
  kind        text default 'event',
  is_published boolean default true,
  created_at  timestamptz default now()
);

alter table public.events enable row level security;

create policy "Public can read published events"
  on public.events for select
  using (is_published = true);

create policy "Organizers can insert their own events"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy "Organizers can update their own events"
  on public.events for update
  using (auth.uid() = organizer_id);

create policy "Organizers can delete their own events"
  on public.events for delete
  using (auth.uid() = organizer_id);

-- 8. Storage bucket tip:
--    Create a public bucket named event-images in Supabase Storage and allow authenticated uploads.
