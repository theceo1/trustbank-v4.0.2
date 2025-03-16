create table if not exists public.swap_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  from_currency text not null,
  to_currency text not null,
  from_amount decimal not null,
  to_amount decimal not null,
  execution_price decimal not null,
  status text not null default 'pending',
  quidax_swap_id text,
  quidax_quotation_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.swap_transactions enable row level security;

create policy "Users can view their own swap transactions"
  on public.swap_transactions for select
  using (auth.uid() = user_id);

create policy "Service role can insert swap transactions"
  on public.swap_transactions for insert
  to service_role
  with check (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_swap_transactions_updated_at
  before update on public.swap_transactions
  for each row
  execute procedure public.handle_updated_at();
