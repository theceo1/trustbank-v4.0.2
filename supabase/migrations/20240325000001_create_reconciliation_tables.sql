-- Create reconciliation_logs table
CREATE TABLE IF NOT EXISTS reconciliation_logs (
    id BIGSERIAL PRIMARY KEY,
    currency TEXT NOT NULL,
    quidax_balance DECIMAL(24,8) NOT NULL,
    local_balance DECIMAL(24,8) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Create reconciliation_state table
CREATE TABLE IF NOT EXISTS reconciliation_state (
    id BIGSERIAL PRIMARY KEY,
    last_wallet_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_transaction_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_reconciliation_running BOOLEAN DEFAULT FALSE,
    last_run_status TEXT,
    last_run_error TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial reconciliation state
INSERT INTO reconciliation_state (id, last_wallet_check, last_transaction_check)
VALUES (1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for reconciliation_state
CREATE TRIGGER update_reconciliation_state_updated_at
    BEFORE UPDATE ON reconciliation_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 