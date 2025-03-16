-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users" ON configurations
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow write access only to admin users
CREATE POLICY "Allow write access only to admin users" ON configurations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Insert default configurations
INSERT INTO configurations (key, value, description) VALUES
    ('kyc_tiers', jsonb_build_object(
        'TIER_1', jsonb_build_object(
            'name', 'Basic',
            'requirements', ARRAY['email', 'phone'],
            'daily_limit', 500000,
            'monthly_limit', 5000000,
            'withdrawal_limit', 1000000
        ),
        'TIER_2', jsonb_build_object(
            'name', 'Intermediate',
            'requirements', ARRAY['email', 'phone', 'bvn'],
            'daily_limit', 5000000,
            'monthly_limit', 50000000,
            'withdrawal_limit', 10000000
        ),
        'TIER_3', jsonb_build_object(
            'name', 'Advanced',
            'requirements', ARRAY['email', 'phone', 'bvn', 'id_verification'],
            'daily_limit', 50000000,
            'monthly_limit', 500000000,
            'withdrawal_limit', 100000000
        )
    ), 'KYC tier configurations including requirements and limits'),
    ('fee_tiers', jsonb_build_object(
        'base_fee', 0.03,
        'volume_tiers', jsonb_build_array(
            jsonb_build_object(
                'min_volume', 0,
                'max_volume', 10000000,
                'fee_percentage', 0.03
            ),
            jsonb_build_object(
                'min_volume', 10000000,
                'max_volume', 50000000,
                'fee_percentage', 0.025
            ),
            jsonb_build_object(
                'min_volume', 50000000,
                'max_volume', 100000000,
                'fee_percentage', 0.02
            ),
            jsonb_build_object(
                'min_volume', 100000000,
                'max_volume', 500000000,
                'fee_percentage', 0.015
            ),
            jsonb_build_object(
                'min_volume', 500000000,
                'max_volume', null,
                'fee_percentage', 0.01
            )
        ),
        'network_fees', jsonb_build_object(
            'BTC', 0.0005,
            'ETH', 0.005,
            'USDT', 1
        )
    ), 'Trading fee configurations including volume-based tiers and network fees'),
    ('dojah_config', jsonb_build_object(
        'app_id', '',
        'api_key', '',
        'test_mode', true,
        'webhook_url', '',
        'webhook_secret', ''
    ), 'Dojah API configuration for KYC verification');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configurations_updated_at
    BEFORE UPDATE ON configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 