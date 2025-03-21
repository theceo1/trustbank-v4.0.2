-- Drop existing tables if they exist (with CASCADE)
DROP TABLE IF EXISTS public.p2p_disputes CASCADE;
DROP TABLE IF EXISTS public.p2p_trades CASCADE;
DROP TABLE IF EXISTS public.p2p_escrows CASCADE;
DROP TABLE IF EXISTS public.p2p_orders CASCADE;
DROP TABLE IF EXISTS public.kyc_records CASCADE;
DROP TABLE IF EXISTS public.security_settings CASCADE;
DROP TABLE IF EXISTS public.swap_transactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.configurations CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS dispute_status;
DROP TYPE IF EXISTS trade_status;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS order_type;

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  first_name text,
  last_name text,
  phone_number text,
  kyc_level text default 'basic' check (kyc_level in ('basic', 'intermediate', 'advanced')),
  quidax_id text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
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
CREATE TABLE IF NOT EXISTS public.transactions (
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
CREATE TABLE IF NOT EXISTS public.swap_transactions (
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
CREATE TABLE IF NOT EXISTS public.kyc_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  document_type text not null check (document_type in ('nin', 'bvn', 'passport', 'drivers_license')),
  document_number text not null,
  status text default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create security_settings table
CREATE TABLE IF NOT EXISTS public.security_settings (
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

-- Create enum for order type
CREATE TYPE order_type AS ENUM ('buy', 'sell');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('active', 'completed', 'cancelled');

-- Create enum for trade status
CREATE TYPE trade_status AS ENUM ('pending_payment', 'paid', 'completed', 'disputed', 'cancelled');

-- Create enum for dispute status
CREATE TYPE dispute_status AS ENUM ('pending', 'resolved', 'rejected');

-- Create p2p_orders table
CREATE TABLE IF NOT EXISTS p2p_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type order_type NOT NULL,
  currency TEXT NOT NULL,
  amount DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  min_order DECIMAL(24,8) NOT NULL,
  max_order DECIMAL(24,8) NOT NULL,
  payment_methods TEXT[] NOT NULL,
  terms TEXT,
  status order_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT valid_order_limits CHECK (min_order <= max_order AND max_order <= amount)
);

-- Create p2p_escrows table
CREATE TABLE IF NOT EXISTS p2p_escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  total DECIMAL(24,8) NOT NULL,
  status trade_status NOT NULL DEFAULT 'pending_payment',
  escrow_wallet_id TEXT NOT NULL,
  escrow_confirmation_code TEXT NOT NULL,
  payment_window_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_confirmed_at TIMESTAMPTZ,
  CONSTRAINT positive_escrow_amount CHECK (amount > 0),
  CONSTRAINT positive_escrow_price CHECK (price > 0),
  CONSTRAINT positive_escrow_total CHECK (total > 0)
);

-- Create p2p_trades table
CREATE TABLE IF NOT EXISTS p2p_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID NOT NULL REFERENCES p2p_escrows(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  total DECIMAL(24,8) NOT NULL,
  status trade_status NOT NULL DEFAULT 'pending_payment',
  payment_proof TEXT,
  buyer_quidax_id TEXT NOT NULL,
  seller_quidax_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT positive_trade_amount CHECK (amount > 0),
  CONSTRAINT positive_trade_price CHECK (price > 0),
  CONSTRAINT positive_trade_total CHECK (total > 0)
);

-- Create p2p_disputes table
CREATE TABLE IF NOT EXISTS p2p_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES p2p_trades(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence TEXT,
  admin_notes TEXT,
  resolution TEXT,
  status dispute_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create configurations table
CREATE TABLE IF NOT EXISTS public.configurations (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique,
  value jsonb not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  position text not null,
  status text default 'pending' check (status in ('pending', 'reviewing', 'accepted', 'rejected')),
  resume_url text,
  cover_letter text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
CREATE INDEX p2p_orders_creator_id_idx ON p2p_orders(creator_id);
CREATE INDEX p2p_orders_currency_idx ON p2p_orders(currency);
CREATE INDEX p2p_orders_status_idx ON p2p_orders(status);
CREATE INDEX p2p_escrows_order_id_idx ON p2p_escrows(order_id);
CREATE INDEX p2p_escrows_buyer_id_idx ON p2p_escrows(buyer_id);
CREATE INDEX p2p_escrows_seller_id_idx ON p2p_escrows(seller_id);
CREATE INDEX p2p_trades_order_id_idx ON p2p_trades(order_id);
CREATE INDEX p2p_trades_buyer_id_idx ON p2p_trades(buyer_id);
CREATE INDEX p2p_trades_seller_id_idx ON p2p_trades(seller_id);
CREATE INDEX p2p_disputes_trade_id_idx ON p2p_disputes(trade_id);
CREATE INDEX p2p_disputes_initiator_id_idx ON p2p_disputes(initiator_id);
CREATE INDEX p2p_disputes_status_idx ON p2p_disputes(status);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_disputes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallets policies
CREATE POLICY "Users can view own wallets" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- KYC records policies
CREATE POLICY "Users can view own KYC records" ON public.kyc_records
  FOR SELECT USING (auth.uid() = user_id);

-- Security settings policies
CREATE POLICY "Users can view own security settings" ON public.security_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own security settings" ON public.security_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all security settings" ON public.security_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
CREATE POLICY "Admins can update all security settings" ON public.security_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS policies for p2p_orders
CREATE POLICY "View all active orders" ON p2p_orders
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "View own orders" ON p2p_orders
  FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Create orders" ON p2p_orders
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Update own orders" ON p2p_orders
  FOR UPDATE
  USING (creator_id = auth.uid());

-- RLS policies for p2p_escrows
CREATE POLICY "View own escrows" ON p2p_escrows
  FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Create escrows" ON p2p_escrows
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Update own escrows" ON p2p_escrows
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS policies for p2p_trades
CREATE POLICY "View own trades" ON p2p_trades
  FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Create trades" ON p2p_trades
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Update own trades" ON p2p_trades
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS policies for p2p_disputes
CREATE POLICY "View own disputes" ON p2p_disputes
  FOR SELECT
  USING (
    initiator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM p2p_trades t
      WHERE t.id = trade_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "Create disputes" ON p2p_disputes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM p2p_trades t
      WHERE t.id = trade_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admin update disputes" ON p2p_disputes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin view all disputes" ON p2p_disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);

  INSERT INTO public.security_settings (user_id)
  VALUES (NEW.id);

  -- Create default wallets
  INSERT INTO public.wallets (user_id, currency)
  VALUES
    (NEW.id, 'NGN'),
    (NEW.id, 'BTC'),
    (NEW.id, 'ETH'),
    (NEW.id, 'USDT'),
    (NEW.id, 'USDC');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Recreate dependent policies after all tables are created
CREATE POLICY "Allow admins to do everything" ON public.job_applications
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow write access only to admin users" ON public.configurations
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add read policy for configurations
CREATE POLICY "Allow read access to all users" ON public.configurations
  FOR SELECT
  USING (true);

-- Add policies for job applications
CREATE POLICY "Users can view own applications" ON public.job_applications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own applications" ON public.job_applications
  FOR UPDATE
  USING (user_id = auth.uid()); 