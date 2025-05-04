-- Create korapay_transfers table
CREATE TABLE IF NOT EXISTS korapay_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  status TEXT NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS korapay_transfers_user_id_idx ON korapay_transfers(user_id);
CREATE INDEX IF NOT EXISTS korapay_transfers_reference_idx ON korapay_transfers(reference);

-- Add RLS policies
ALTER TABLE korapay_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transfers"
  ON korapay_transfers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transfers"
  ON korapay_transfers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_korapay_transfers_updated_at
  BEFORE UPDATE ON korapay_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 