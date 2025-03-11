-- Create enum for trade status
CREATE TYPE trade_status AS ENUM ('pending', 'paid', 'completed', 'disputed', 'cancelled');

-- Create p2p_trades table
CREATE TABLE IF NOT EXISTS p2p_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  trader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(24,8) NOT NULL,
  crypto_amount DECIMAL(24,8) NOT NULL,
  status trade_status NOT NULL DEFAULT 'pending',
  payment_proof TEXT,
  dispute_reason TEXT,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_crypto_amount CHECK (crypto_amount > 0)
);

-- Create index on order_id for faster lookups
CREATE INDEX p2p_trades_order_id_idx ON p2p_trades(order_id);

-- Create index on trader_id for faster lookups
CREATE INDEX p2p_trades_trader_id_idx ON p2p_trades(trader_id);

-- Create index on status for faster filtering
CREATE INDEX p2p_trades_status_idx ON p2p_trades(status);

-- Add RLS policies
ALTER TABLE p2p_trades ENABLE ROW LEVEL SECURITY;

-- Policy to allow traders to view their own trades
CREATE POLICY "View own trades" ON p2p_trades
  FOR SELECT
  USING (trader_id = auth.uid());

-- Policy to allow order creators to view trades on their orders
CREATE POLICY "View order trades" ON p2p_trades
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM p2p_orders
      WHERE p2p_orders.id = p2p_trades.order_id
      AND p2p_orders.creator_id = auth.uid()
    )
  );

-- Policy to allow traders to create trades
CREATE POLICY "Create trades" ON p2p_trades
  FOR INSERT
  WITH CHECK (trader_id = auth.uid());

-- Policy to allow traders to update their own trades
CREATE POLICY "Update own trades" ON p2p_trades
  FOR UPDATE
  USING (trader_id = auth.uid());

-- Policy to allow order creators to update trades on their orders
CREATE POLICY "Update order trades" ON p2p_trades
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM p2p_orders
      WHERE p2p_orders.id = p2p_trades.order_id
      AND p2p_orders.creator_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_p2p_trades_updated_at
  BEFORE UPDATE ON p2p_trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add completed_trades and completion_rate columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'completed_trades') THEN
    ALTER TABLE profiles ADD COLUMN completed_trades INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'completion_rate') THEN
    ALTER TABLE profiles ADD COLUMN completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0;
  END IF;
END $$; 