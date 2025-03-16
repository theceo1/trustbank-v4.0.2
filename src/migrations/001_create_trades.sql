-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell', 'swap')),
  market VARCHAR(20) NOT NULL,
  amount DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  fee DECIMAL(24,8) NOT NULL,
  from_currency VARCHAR(10),
  to_currency VARCHAR(10),
  from_amount DECIMAL(24,8),
  to_amount DECIMAL(24,8),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'initiated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT trades_amount_check CHECK (amount > 0),
  CONSTRAINT trades_price_check CHECK (price > 0),
  CONSTRAINT trades_fee_check CHECK (fee >= 0)
);

-- Create index on user_id and created_at for faster fee tier calculations
CREATE INDEX IF NOT EXISTS trades_user_volume_idx ON trades (user_id, created_at);

-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
DROP POLICY IF EXISTS "Users can insert their own trades" ON trades;

-- Create policies
CREATE POLICY "Users can view their own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;

-- Create trigger for updated_at
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 