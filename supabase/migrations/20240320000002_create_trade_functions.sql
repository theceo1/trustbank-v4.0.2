-- Function to increment completed trades and update completion rate
CREATE OR REPLACE FUNCTION increment_completed_trades(user_id UUID)
RETURNS void AS $$
DECLARE
    total_trades INT;
    completed INT;
BEGIN
    -- Get total trades
    SELECT COUNT(*) INTO total_trades
    FROM p2p_trades
    WHERE trader_id = user_id OR 
          creator_id IN (SELECT id FROM p2p_orders WHERE creator_id = user_id);

    -- Get completed trades
    SELECT COUNT(*) INTO completed
    FROM p2p_trades
    WHERE status = 'completed' AND (
        trader_id = user_id OR 
        creator_id IN (SELECT id FROM p2p_orders WHERE creator_id = user_id)
    );

    -- Update profile statistics
    UPDATE profiles
    SET 
        completed_trades = completed,
        completion_rate = CASE 
            WHEN total_trades > 0 THEN (completed::FLOAT / total_trades::FLOAT) * 100
            ELSE 0
        END
    WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update order status
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If all trades for an order are completed, mark the order as completed
    IF NEW.status = 'completed' THEN
        UPDATE p2p_orders
        SET status = 'completed'
        WHERE id = NEW.order_id
        AND NOT EXISTS (
            SELECT 1 FROM p2p_trades
            WHERE order_id = NEW.order_id
            AND status != 'completed'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating order status when trade status changes
CREATE TRIGGER update_order_status_trigger
AFTER UPDATE OF status ON p2p_trades
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_order_status(); 