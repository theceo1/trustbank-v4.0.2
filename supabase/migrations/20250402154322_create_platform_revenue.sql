-- Create enum for fee types
CREATE TYPE fee_type AS ENUM ('TRADING', 'SWAP', 'TRANSACTION');

-- Create platform_revenue table
CREATE TABLE platform_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(20, 8) NOT NULL,
    fee_type fee_type NOT NULL,
    transaction_id UUID,
    trade_id UUID,
    swap_id UUID,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX platform_revenue_fee_type_idx ON platform_revenue(fee_type);
CREATE INDEX platform_revenue_created_at_idx ON platform_revenue(created_at);
CREATE INDEX platform_revenue_user_id_idx ON platform_revenue(user_id);

-- Add foreign key constraints
ALTER TABLE platform_revenue
    ADD CONSTRAINT fk_transaction
    FOREIGN KEY (transaction_id)
    REFERENCES transactions(id)
    ON DELETE SET NULL;

ALTER TABLE platform_revenue
    ADD CONSTRAINT fk_trade
    FOREIGN KEY (trade_id)
    REFERENCES trades(id)
    ON DELETE SET NULL;

ALTER TABLE platform_revenue
    ADD CONSTRAINT fk_swap
    FOREIGN KEY (swap_id)
    REFERENCES swap_transactions(id)
    ON DELETE SET NULL;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON platform_revenue
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
