-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  is_sso_user
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'superadmin@trustbank.tech',
  crypt('trustbank123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "System Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  false
)
ON CONFLICT (email) WHERE is_sso_user = false
DO UPDATE SET 
    encrypted_password = crypt('trustbank123', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now(),
    raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
    raw_user_meta_data = '{"name": "System Admin"}'
RETURNING id;

-- Create admin role if it doesn't exist
INSERT INTO public.admin_roles (name, permissions)
VALUES (
  'super_admin',
  to_jsonb(ARRAY[
    'view_users', 'manage_users', 'view_transactions', 'create_transaction',
    'approve_transaction', 'view_wallet', 'manage_wallet', 'withdraw',
    'submit_kyc', 'approve_kyc', 'view_admin_dashboard', 'manage_settings',
    'view_logs'
  ])
)
ON CONFLICT (name)
DO UPDATE SET permissions = EXCLUDED.permissions
RETURNING id;

-- Link user to admin role
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'superadmin@trustbank.tech'
), role_data AS (
  SELECT id FROM admin_roles WHERE name = 'super_admin'
)
INSERT INTO public.admin_users (user_id, role_id)
SELECT user_data.id, role_data.id
FROM user_data, role_data
ON CONFLICT (user_id)
DO UPDATE SET role_id = EXCLUDED.role_id;