-- Function to create user record with RLS bypass
CREATE OR REPLACE FUNCTION create_user_record(user_id UUID, user_email TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (user_id, user_email, NOW(), NOW());

  INSERT INTO public.user_profiles (user_id, created_at, updated_at)
  VALUES (user_id, NOW(), NOW());

  INSERT INTO public.security_settings (user_id, created_at, updated_at)
  VALUES (user_id, NOW(), NOW());

  -- Create default wallets
  INSERT INTO public.wallets (user_id, currency)
  VALUES
    (user_id, 'NGN'),
    (user_id, 'BTC'),
    (user_id, 'ETH'),
    (user_id, 'USDT'),
    (user_id, 'USDC');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 