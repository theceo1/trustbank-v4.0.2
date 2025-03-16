-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create transactions table
create table transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    type text not null check (type in ('deposit', 'withdrawal')),
    amount numeric not null check (amount > 0),
    currency text not null,
    status text not null check (status in ('pending', 'completed', 'failed')),
    reference text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create swap_transactions table
create table swap_transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    from_currency text not null,
    to_currency text not null,
    from_amount numeric not null check (from_amount > 0),
    to_amount numeric not null check (to_amount > 0),
    execution_price numeric not null check (execution_price > 0),
    status text not null check (status in ('pending', 'completed', 'failed')),
    reference text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create indexes
create index idx_transactions_user_id on transactions(user_id);
create index idx_transactions_created_at on transactions(created_at desc);
create index idx_transactions_status on transactions(status);
create index idx_transactions_type on transactions(type);

create index idx_swap_transactions_user_id on swap_transactions(user_id);
create index idx_swap_transactions_created_at on swap_transactions(created_at desc);
create index idx_swap_transactions_status on swap_transactions(status);
create index idx_swap_transactions_from_currency on swap_transactions(from_currency);
create index idx_swap_transactions_to_currency on swap_transactions(to_currency);

-- Enable Row Level Security
alter table transactions enable row level security;
alter table swap_transactions enable row level security;

-- Create policies for transactions table
create policy "Users can view their own transactions"
    on transactions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
    on transactions for insert
    with check (auth.uid() = user_id);

create policy "Users cannot update transactions"
    on transactions for update
    using (false);

create policy "Users cannot delete transactions"
    on transactions for delete
    using (false);

-- Create policies for swap_transactions table
create policy "Users can view their own swap transactions"
    on swap_transactions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own swap transactions"
    on swap_transactions for insert
    with check (auth.uid() = user_id);

create policy "Users cannot update swap transactions"
    on swap_transactions for update
    using (false);

create policy "Users cannot delete swap transactions"
    on swap_transactions for delete
    using (false);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_transactions_updated_at
    before update on transactions
    for each row
    execute function update_updated_at_column();

create trigger update_swap_transactions_updated_at
    before update on swap_transactions
    for each row
    execute function update_updated_at_column(); 