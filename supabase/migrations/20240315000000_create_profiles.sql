-- Create user_profiles table if not exists
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  kyc_status TEXT DEFAULT 'unverified',
  kyc_level INTEGER DEFAULT 0,
  completed_trades INTEGER DEFAULT 0,
  completion_rate DECIMAL DEFAULT 100,
  quidax_id TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  verification_history JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create RLS policies for user_profiles if they don't exist
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON user_profiles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON user_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create function to increment completed trades
CREATE OR REPLACE FUNCTION increment_completed_trades(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    completed_trades = completed_trades + 1,
    updated_at = NOW()
  WHERE user_profiles.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing p2p_trades table if it exists (due to foreign key dependency)
DROP TABLE IF EXISTS p2p_trades;

-- Drop existing p2p_orders table if it exists
DROP TABLE IF EXISTS p2p_orders;

-- Create p2p_orders table
CREATE TABLE IF NOT EXISTS p2p_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  currency TEXT NOT NULL,
  amount TEXT NOT NULL,
  price TEXT NOT NULL,
  min_order TEXT NOT NULL,
  max_order TEXT NOT NULL,
  payment_methods JSONB NOT NULL,
  terms TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for p2p_orders if they don't exist
ALTER TABLE p2p_orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'p2p_orders' 
    AND policyname = 'Public orders are viewable by everyone'
  ) THEN
    CREATE POLICY "Public orders are viewable by everyone"
      ON p2p_orders FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'p2p_orders' 
    AND policyname = 'Users can insert their own orders'
  ) THEN
    CREATE POLICY "Users can insert their own orders"
      ON p2p_orders FOR INSERT
      WITH CHECK (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'p2p_orders' 
    AND policyname = 'Users can update own orders'
  ) THEN
    CREATE POLICY "Users can update own orders"
      ON p2p_orders FOR UPDATE
      USING (auth.uid() = creator_id);
  END IF;
END $$;

-- Create p2p_trades table
CREATE TABLE IF NOT EXISTS p2p_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES p2p_orders(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  seller_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  trader_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  amount TEXT NOT NULL,
  crypto_amount TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_proof TEXT,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  buyer_quidax_id TEXT,
  seller_quidax_id TEXT,
  quidax_swap_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for p2p_trades if they don't exist
ALTER TABLE p2p_trades ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'p2p_trades' 
    AND policyname = 'Users can view trades they are involved in'
  ) THEN
    CREATE POLICY "Users can view trades they are involved in"
      ON p2p_trades FOR SELECT
      USING (auth.uid() IN (buyer_id, seller_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'p2p_trades' 
    AND policyname = 'Users can insert trades'
  ) THEN
    CREATE POLICY "Users can insert trades"
      ON p2p_trades FOR INSERT
      WITH CHECK (auth.uid() = trader_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'p2p_trades' 
    AND policyname = 'Users can update trades they are involved in'
  ) THEN
    CREATE POLICY "Users can update trades they are involved in"
      ON p2p_trades FOR UPDATE
      USING (auth.uid() IN (buyer_id, seller_id));
  END IF;
END $$; 