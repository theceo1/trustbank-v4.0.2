-- Update user_profiles table with new KYC fields
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS kyc_tier VARCHAR(10) DEFAULT 'TIER_1',
  ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verification_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS failed_verification_attempts INTEGER DEFAULT 0,
  ADD CONSTRAINT kyc_tier_check CHECK (kyc_tier IN ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4', 'TIER_5'));

-- Create table for risk factors
CREATE TABLE IF NOT EXISTS risk_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  factor_type VARCHAR(50) NOT NULL,
  factor_value INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT valid_factor_type CHECK (
    factor_type IN (
      'login_attempts',
      'transaction_volume',
      'geographic_risk',
      'verification_failure',
      'trading_pattern',
      'account_age',
      'device_change',
      'ip_change'
    )
  )
);

-- Create table for verification requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  requested_tier VARCHAR(10) NOT NULL,
  verification_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_verification_type CHECK (
    verification_type IN (
      'email',
      'phone',
      'nin',
      'bvn',
      'livecheck',
      'government_id',
      'passport',
      'selfie'
    )
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'approved', 'rejected', 'expired')
  )
);

-- Create function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base score from risk factors
  SELECT COALESCE(SUM(factor_value), 0) INTO score
  FROM risk_factors
  WHERE risk_factors.user_id = calculate_risk_score.user_id
  AND (expires_at IS NULL OR expires_at > NOW());

  -- Adjust for verification history
  SELECT score + CASE 
    WHEN failed_verification_attempts > 3 THEN 30
    WHEN failed_verification_attempts > 0 THEN 10
    ELSE 0
  END INTO score
  FROM user_profiles
  WHERE user_profiles.user_id = calculate_risk_score.user_id;

  -- Cap the score between 0 and 100
  RETURN GREATEST(LEAST(score, 100), 0);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update risk score
CREATE OR REPLACE FUNCTION update_risk_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET risk_score = calculate_risk_score(NEW.user_id)
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER risk_factor_update
  AFTER INSERT OR UPDATE ON risk_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_score();

-- Update configurations table with new KYC settings
INSERT INTO configurations (key, value, description)
VALUES (
  'kyc_tiers',
  '{
    "TIER_1": {
      "name": "Basic",
      "risk_threshold": 20,
      "daily_limit": 100000,
      "monthly_limit": 1000000,
      "withdrawal_limit": 200000,
      "requirements": ["email", "phone", "basic_info"]
    },
    "TIER_2": {
      "name": "Starter",
      "risk_threshold": 40,
      "daily_limit": 500000,
      "monthly_limit": 5000000,
      "withdrawal_limit": 1000000,
      "requirements": ["nin", "selfie"]
    },
    "TIER_3": {
      "name": "Intermediate",
      "risk_threshold": 60,
      "daily_limit": 2000000,
      "monthly_limit": 20000000,
      "withdrawal_limit": 5000000,
      "requirements": ["bvn"]
    },
    "TIER_4": {
      "name": "Advanced",
      "risk_threshold": 80,
      "daily_limit": 10000000,
      "monthly_limit": 100000000,
      "withdrawal_limit": 20000000,
      "requirements": ["livecheck"]
    },
    "TIER_5": {
      "name": "Premium",
      "risk_threshold": 100,
      "daily_limit": 50000000,
      "monthly_limit": 500000000,
      "withdrawal_limit": 100000000,
      "requirements": ["government_id", "passport"]
    }
  }'::jsonb,
  'KYC tier configurations including requirements, limits, and risk thresholds'
) ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description; 