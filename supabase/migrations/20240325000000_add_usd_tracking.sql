-- Add USD equivalent columns to trades and swap_transactions
ALTER TABLE trades
ADD COLUMN usd_equivalent DECIMAL(20,8),
ADD COLUMN usd_rate DECIMAL(20,8);

ALTER TABLE swap_transactions
ADD COLUMN usd_equivalent DECIMAL(20,8),
ADD COLUMN usd_rate DECIMAL(20,8);

-- Add USD volume tracking to user_profiles
ALTER TABLE user_profiles
ADD COLUMN trading_volume_usd DECIMAL(20,8) DEFAULT 0,
ADD COLUMN monthly_volume_usd DECIMAL(20,8) DEFAULT 0,
ADD COLUMN daily_volume_usd DECIMAL(20,8) DEFAULT 0;

-- Create function to calculate USD equivalent
CREATE OR REPLACE FUNCTION calculate_usd_equivalent(
  amount DECIMAL,
  currency TEXT,
  rate DECIMAL DEFAULT NULL
)
RETURNS DECIMAL AS $$
BEGIN
  -- If currency is already USD, return amount
  IF currency = 'USD' OR currency = 'USDT' OR currency = 'USDC' THEN
    RETURN amount;
  END IF;

  -- If rate is provided, use it
  IF rate IS NOT NULL THEN
    RETURN amount * rate;
  END IF;

  -- Default to 0 if no rate available
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user's USD trading volume
CREATE OR REPLACE FUNCTION update_user_trading_volume()
RETURNS trigger AS $$
BEGIN
  -- Update total trading volume
  UPDATE user_profiles
  SET trading_volume_usd = (
    SELECT COALESCE(SUM(usd_equivalent), 0)
    FROM trades
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '30 days'
  )
  WHERE user_id = NEW.user_id;

  -- Update monthly trading volume
  UPDATE user_profiles
  SET monthly_volume_usd = (
    SELECT COALESCE(SUM(usd_equivalent), 0)
    FROM trades
    WHERE user_id = NEW.user_id
    AND created_at > DATE_TRUNC('month', NOW())
  )
  WHERE user_id = NEW.user_id;

  -- Update daily trading volume
  UPDATE user_profiles
  SET daily_volume_usd = (
    SELECT COALESCE(SUM(usd_equivalent), 0)
    FROM trades
    WHERE user_id = NEW.user_id
    AND created_at > DATE_TRUNC('day', NOW())
  )
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update trading volume after trade
CREATE TRIGGER update_trading_volume_after_trade
  AFTER INSERT OR UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_user_trading_volume();

-- Create index on USD equivalent for faster calculations
CREATE INDEX idx_trades_usd_equivalent ON trades(user_id, usd_equivalent, created_at);

-- Create function to check trading limits
CREATE OR REPLACE FUNCTION check_trading_limits(
  user_id UUID,
  amount DECIMAL,
  currency TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  daily_limit DECIMAL;
  monthly_limit DECIMAL;
  current_daily_volume DECIMAL;
  current_monthly_volume DECIMAL;
  kyc_level TEXT;
  usd_amount DECIMAL;
BEGIN
  -- Get user's KYC level
  SELECT kyc_level INTO kyc_level
  FROM user_profiles
  WHERE user_id = user_id;

  -- Convert amount to USD
  SELECT calculate_usd_equivalent(amount, currency) INTO usd_amount;

  -- Set limits based on KYC level
  CASE kyc_level
    WHEN 'basic' THEN
      daily_limit := 100;
      monthly_limit := 1000;
    WHEN 'starter' THEN
      daily_limit := 500;
      monthly_limit := 5000;
    WHEN 'intermediate' THEN
      daily_limit := 2000;
      monthly_limit := 20000;
    WHEN 'advanced' THEN
      daily_limit := 10000;
      monthly_limit := 100000;
    WHEN 'premium' THEN
      daily_limit := 50000;
      monthly_limit := 500000;
    ELSE
      daily_limit := 100;
      monthly_limit := 1000;
  END CASE;

  -- Get current volumes
  SELECT daily_volume_usd, monthly_volume_usd 
  INTO current_daily_volume, current_monthly_volume
  FROM user_profiles
  WHERE user_id = user_id;

  -- Check if limits would be exceeded
  RETURN (current_daily_volume + usd_amount <= daily_limit) 
    AND (current_monthly_volume + usd_amount <= monthly_limit);
END;
$$ LANGUAGE plpgsql; 