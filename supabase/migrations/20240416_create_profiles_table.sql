-- Create a public profiles table for user lookup
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Allow users to select their own profile
create policy "Users can select their own profile" on public.profiles
  for select using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id); 