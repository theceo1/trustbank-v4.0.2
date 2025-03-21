-- Create users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_profiles table
create table if not exists public.user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  first_name text,
  last_name text,
  phone_number text,
  kyc_level text default 'basic' check (kyc_level in ('basic', 'intermediate', 'advanced')),
  quidax_user_id text,
  quidax_sn text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create wallets table
create table if not exists public.wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  currency text not null,
  balance numeric(28, 8) default 0 not null check (balance >= 0),
  address text,
  quidax_wallet_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, currency)
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  wallet_id uuid references public.wallets on delete cascade not null,
  type text not null check (type in ('deposit', 'withdrawal', 'transfer', 'swap')),
  amount numeric(28, 8) not null,
  currency text not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  quidax_transaction_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create swap_transactions table
create table if not exists public.swap_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  from_currency text not null,
  to_currency text not null,
  from_amount numeric(28, 8) not null,
  to_amount numeric(28, 8) not null,
  execution_price numeric(28, 8) not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  quidax_swap_id text,
  quidax_quotation_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create kyc_records table
create table if not exists public.kyc_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  document_type text not null check (document_type in ('nin', 'bvn', 'passport', 'drivers_license')),
  document_number text not null,
  status text default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create security_settings table
create table if not exists public.security_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  two_factor_enabled boolean default false not null,
  two_factor_secret text,
  backup_codes text[] default '{}',
  last_login timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Create RLS policies
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.kyc_records enable row level security;
alter table public.security_settings enable row level security;

-- Users policies
create policy "Users can view own record" on public.users
  for select using (auth.uid() = id);

-- User profiles policies
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = user_id);
create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = user_id);

-- Wallets policies
create policy "Users can view own wallets" on public.wallets
  for select using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = user_id);

-- KYC records policies
create policy "Users can view own KYC records" on public.kyc_records
  for select using (auth.uid() = user_id);

-- Security settings policies
create policy "Users can view own security settings" on public.security_settings
  for select using (auth.uid() = user_id);
create policy "Users can update own security settings" on public.security_settings
  for update using (auth.uid() = user_id);
create policy "Admins can view all security settings" on public.security_settings
  for select using (
    exists (
      select 1 from user_profiles
      where user_profiles.user_id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );
create policy "Admins can update all security settings" on public.security_settings
  for update using (
    exists (
      select 1 from user_profiles
      where user_profiles.user_id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );

-- Create functions and triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.user_profiles (user_id)
  values (new.id);

  insert into public.security_settings (user_id)
  values (new.id);

  -- Create default wallets
  insert into public.wallets (user_id, currency)
  values
    (new.id, 'NGN'),
    (new.id, 'BTC'),
    (new.id, 'ETH'),
    (new.id, 'USDT'),
    (new.id, 'USDC');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 