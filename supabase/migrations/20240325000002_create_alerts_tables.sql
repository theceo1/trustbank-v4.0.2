-- Create alert types enum
CREATE TYPE alert_type AS ENUM (
    'large_transaction',
    'low_balance',
    'high_volume'
);

-- Create alert severity enum
CREATE TYPE alert_severity AS ENUM (
    'info',
    'warning',
    'critical'
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create system_settings table for alert thresholds
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default alert thresholds
INSERT INTO system_settings (key, value, description)
VALUES (
    'alert_thresholds',
    '{
        "large_transaction_threshold": 10000,
        "balance_threshold": 5000,
        "daily_volume_threshold": 100000
    }'::jsonb,
    'Thresholds for various system alerts'
) ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at(); 