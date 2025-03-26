-- Drop existing objects if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS create_transaction CASCADE;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP TABLE IF EXISTS transactions;

-- Create transaction types enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer', 'buy', 'sell', 'trade', 'referral_bonus', 'referral_commission');
    END IF;
END $$;

-- Create transaction status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
    END IF;
END $$;

-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type transaction_type NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_id UUID REFERENCES auth.users(id),
    status transaction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_recipient_id ON transactions(recipient_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create stored procedure for handling transactions
CREATE OR REPLACE FUNCTION create_transaction(
    p_type transaction_type,
    p_amount DECIMAL,
    p_description TEXT,
    p_user_id UUID,
    p_recipient_id UUID DEFAULT NULL
) RETURNS transactions AS $$
DECLARE
    v_transaction transactions;
    v_user_balance DECIMAL;
    v_recipient_balance DECIMAL;
BEGIN
    -- Check if amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Get user's current balance
    SELECT balance INTO v_user_balance
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- Check if user has sufficient balance for withdrawal or transfer
    IF (p_type IN ('withdrawal', 'transfer') AND v_user_balance < p_amount) THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- For transfers, verify recipient exists and is different from sender
    IF p_type = 'transfer' THEN
        IF p_recipient_id IS NULL THEN
            RAISE EXCEPTION 'Recipient ID is required for transfers';
        END IF;

        IF p_user_id = p_recipient_id THEN
            RAISE EXCEPTION 'Cannot transfer to self';
        END IF;

        SELECT balance INTO v_recipient_balance
        FROM user_profiles
        WHERE user_id = p_recipient_id;

        IF v_recipient_balance IS NULL THEN
            RAISE EXCEPTION 'Recipient not found';
        END IF;
    END IF;

    -- Start transaction
    BEGIN
        -- Create transaction record
        INSERT INTO transactions (
            type,
            amount,
            description,
            user_id,
            recipient_id,
            status
        ) VALUES (
            p_type,
            p_amount,
            p_description,
            p_user_id,
            p_recipient_id,
            'completed'
        ) RETURNING * INTO v_transaction;

        -- Update balances based on transaction type
        CASE p_type
            WHEN 'deposit' THEN
                UPDATE user_profiles
                SET balance = balance + p_amount
                WHERE user_id = p_user_id;
            
            WHEN 'withdrawal' THEN
                UPDATE user_profiles
                SET balance = balance - p_amount
                WHERE user_id = p_user_id;
            
            WHEN 'transfer' THEN
                -- Deduct from sender
                UPDATE user_profiles
                SET balance = balance - p_amount
                WHERE user_id = p_user_id;
                
                -- Add to recipient
                UPDATE user_profiles
                SET balance = balance + p_amount
                WHERE user_id = p_recipient_id;
        END CASE;

        RETURN v_transaction;
    EXCEPTION
        WHEN OTHERS THEN
            -- If anything fails, the transaction will be rolled back
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Ensure RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id); 