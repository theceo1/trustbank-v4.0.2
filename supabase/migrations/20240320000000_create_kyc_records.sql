-- Create KYC tiers enum
CREATE TYPE kyc_tier AS ENUM ('basic', 'intermediate', 'advanced');

-- Create KYC status enum
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');

-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('Ongoing', 'Completed', 'Pending', 'Failed');

-- Create KYC records table
CREATE TABLE kyc_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier kyc_tier NOT NULL DEFAULT 'basic',
  status kyc_status NOT NULL DEFAULT 'pending',
  verification_status verification_status NOT NULL DEFAULT 'Pending',
  verification_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  -- Add unique constraint to prevent multiple records per user
  CONSTRAINT unique_user_kyc UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_kyc_records_user_id ON kyc_records(user_id);

-- Create RLS policies
ALTER TABLE kyc_records ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own KYC records
CREATE POLICY "Users can view own KYC records"
  ON kyc_records FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create their own KYC records
CREATE POLICY "Users can create own KYC records"
  ON kyc_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own KYC records
CREATE POLICY "Users can update own KYC records"
  ON kyc_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kyc_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_kyc_records_updated_at
  BEFORE UPDATE ON kyc_records
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_records_updated_at(); 