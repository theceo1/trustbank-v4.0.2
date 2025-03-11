-- Create enum for order status
CREATE TYPE order_status AS ENUM ('active', 'completed', 'cancelled');

-- Create enum for order type
CREATE TYPE order_type AS ENUM ('buy', 'sell');

-- Create enum for supported currencies
CREATE TYPE supported_currency AS ENUM ('BTC', 'ETH', 'USDT', 'USDC');

-- Create p2p_orders table
CREATE TABLE IF NOT EXISTS p2p_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type order_type NOT NULL,
  currency supported_currency NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  amount DECIMAL(24,8) NOT NULL,
  min_order DECIMAL(24,8) NOT NULL,
  max_order DECIMAL(24,8) NOT NULL,
  payment_methods TEXT[] NOT NULL,
  terms TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT min_order_less_than_max CHECK (min_order <= max_order),
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_min_order CHECK (min_order > 0),
  CONSTRAINT positive_max_order CHECK (max_order > 0)
);

-- Create index on currency and type for faster filtering
CREATE INDEX p2p_orders_currency_type_idx ON p2p_orders(currency, type);

-- Create index on status for faster filtering
CREATE INDEX p2p_orders_status_idx ON p2p_orders(status);

-- Add RLS policies
ALTER TABLE p2p_orders ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view active orders
CREATE POLICY "View active orders" ON p2p_orders
  FOR SELECT
  USING (status = 'active');

-- Policy to allow creators to view their own orders regardless of status
CREATE POLICY "View own orders" ON p2p_orders
  FOR SELECT
  USING (creator_id = auth.uid());

-- Policy to allow creators to create orders
CREATE POLICY "Create orders" ON p2p_orders
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Policy to allow creators to update their own orders
CREATE POLICY "Update own orders" ON p2p_orders
  FOR UPDATE
  USING (creator_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_p2p_orders_updated_at
  BEFORE UPDATE ON p2p_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 