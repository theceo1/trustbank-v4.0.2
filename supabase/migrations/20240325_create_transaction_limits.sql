-- Create transaction_limits table
CREATE TABLE IF NOT EXISTS transaction_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency VARCHAR(10) NOT NULL,
    daily_limit DECIMAL(20, 8) NOT NULL,
    single_transaction_limit DECIMAL(20, 8) NOT NULL,
    require_approval_above DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(currency)
);

-- Create index on currency
CREATE INDEX idx_transaction_limits_currency ON transaction_limits(currency);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transaction_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_transaction_limits_updated_at
    BEFORE UPDATE ON transaction_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_limits_updated_at();

-- Create function to check transaction limits
CREATE OR REPLACE FUNCTION check_transaction_limits(
    p_currency VARCHAR,
    p_amount DECIMAL,
    p_user_id UUID
) RETURNS TABLE (
    requires_approval BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    v_daily_total DECIMAL;
    v_limit transaction_limits%ROWTYPE;
BEGIN
    -- Get limits for the currency
    SELECT * INTO v_limit
    FROM transaction_limits
    WHERE currency = p_currency;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'No limits configured for currency';
        RETURN;
    END IF;

    -- Get daily total for user
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
    FROM transactions
    WHERE user_id = p_user_id
    AND currency = p_currency
    AND created_at >= DATE_TRUNC('day', NOW())
    AND status != 'rejected';

    -- Check if amount exceeds single transaction limit
    IF p_amount > v_limit.single_transaction_limit THEN
        RETURN QUERY SELECT TRUE, 'Amount exceeds single transaction limit';
        RETURN;
    END IF;

    -- Check if amount would exceed daily limit
    IF (v_daily_total + p_amount) > v_limit.daily_limit THEN
        RETURN QUERY SELECT TRUE, 'Amount would exceed daily limit';
        RETURN;
    END IF;

    -- Check if amount requires approval
    IF p_amount > v_limit.require_approval_above THEN
        RETURN QUERY SELECT TRUE, 'Amount requires approval';
        RETURN;
    END IF;

    RETURN QUERY SELECT FALSE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql; 