-- Create function to handle transaction approvals
CREATE OR REPLACE FUNCTION handle_transaction_approval(
    p_transaction_id UUID,
    p_action TEXT,
    p_admin_id UUID
) RETURNS transactions AS $$
DECLARE
    v_transaction transactions;
    v_user_profile user_profiles;
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction
    FROM transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    IF v_transaction.status != 'pending' THEN
        RAISE EXCEPTION 'Only pending transactions can be approved or rejected';
    END IF;

    -- Get user profile for Quidax ID
    SELECT * INTO v_user_profile
    FROM user_profiles
    WHERE user_id = v_transaction.user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Update transaction status based on action
    IF p_action = 'approve' THEN
        -- Call Quidax API to process the transaction
        -- Note: This would typically be handled by a webhook or background job
        -- For now, we'll just update the status
        UPDATE transactions
        SET 
            status = 'completed',
            updated_at = NOW(),
            metadata = jsonb_set(
                metadata,
                '{approval_details}',
                jsonb_build_object(
                    'approved_by', p_admin_id,
                    'approved_at', NOW()
                )::jsonb
            )
        WHERE id = p_transaction_id
        RETURNING * INTO v_transaction;

    ELSIF p_action = 'reject' THEN
        UPDATE transactions
        SET 
            status = 'rejected',
            updated_at = NOW(),
            metadata = jsonb_set(
                metadata,
                '{rejection_details}',
                jsonb_build_object(
                    'rejected_by', p_admin_id,
                    'rejected_at', NOW()
                )::jsonb
            )
        WHERE id = p_transaction_id
        RETURNING * INTO v_transaction;
    ELSE
        RAISE EXCEPTION 'Invalid action: %', p_action;
    END IF;

    -- Insert activity log
    INSERT INTO user_activities (
        user_id,
        type,
        description,
        metadata
    ) VALUES (
        v_transaction.user_id,
        'transaction_' || p_action,
        CASE 
            WHEN p_action = 'approve' THEN 'Transaction approved'
            ELSE 'Transaction rejected'
        END,
        jsonb_build_object(
            'transaction_id', p_transaction_id,
            'amount', v_transaction.amount,
            'currency', v_transaction.currency,
            'admin_id', p_admin_id
        )
    );

    RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 