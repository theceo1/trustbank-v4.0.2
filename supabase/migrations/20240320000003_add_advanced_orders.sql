-- Add new columns for advanced orders
ALTER TABLE p2p_orders
ADD COLUMN IF NOT EXISTS order_type text CHECK (order_type IN ('market', 'limit', 'stop_loss')) DEFAULT 'market',
ADD COLUMN IF NOT EXISTS trigger_price decimal,
ADD COLUMN IF NOT EXISTS expiry text CHECK (expiry IN ('1h', '24h', '3d', '7d', 'gtc')),
ADD COLUMN IF NOT EXISTS post_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Create a function to automatically set expires_at based on expiry
CREATE OR REPLACE FUNCTION set_order_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry = '1h' THEN
    NEW.expires_at := NOW() + INTERVAL '1 hour';
  ELSIF NEW.expiry = '24h' THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  ELSIF NEW.expiry = '3d' THEN
    NEW.expires_at := NOW() + INTERVAL '3 days';
  ELSIF NEW.expiry = '7d' THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  ELSIF NEW.expiry = 'gtc' THEN
    NEW.expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set expires_at when an order is created or updated
DROP TRIGGER IF EXISTS set_order_expiry_trigger ON p2p_orders;
CREATE TRIGGER set_order_expiry_trigger
  BEFORE INSERT OR UPDATE OF expiry
  ON p2p_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_expiry();

-- Create an index for efficient querying of active orders
CREATE INDEX IF NOT EXISTS idx_p2p_orders_active
ON p2p_orders (status, expires_at)
WHERE status = 'open';

-- Create a function to automatically cancel expired orders
CREATE OR REPLACE FUNCTION cancel_expired_orders()
RETURNS void AS $$
BEGIN
  UPDATE p2p_orders
  SET status = 'expired'
  WHERE status = 'open'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run every minute and cancel expired orders
SELECT cron.schedule(
  'cancel-expired-orders',
  '* * * * *',
  $$SELECT cancel_expired_orders()$$
); 