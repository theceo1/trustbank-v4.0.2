-- Function to ensure user exists in public.users
CREATE OR REPLACE FUNCTION public.ensure_public_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure user profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- First ensure user exists in public.users
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  
  -- Then create the profile
  INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    kyc_level,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ),
    'basic',
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS ensure_public_user_exists ON auth.users;

-- Create trigger to ensure public user exists
CREATE TRIGGER ensure_public_user_exists
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_public_user();

-- Create trigger to automatically create profile when user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- Function to sync existing users
CREATE OR REPLACE FUNCTION public.sync_missing_profiles()
RETURNS TABLE (
  users_synced integer,
  profiles_created integer
) AS $$
DECLARE
  _users_synced integer := 0;
  _profiles_created integer := 0;
BEGIN
  -- First, ensure all auth users exist in public.users
  INSERT INTO public.users (id, email, created_at, updated_at)
  SELECT 
    au.id,
    au.email,
    au.created_at,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.users pu ON pu.id = au.id
  WHERE pu.id IS NULL;
  
  -- Then create profiles for users who don't have them
  INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    kyc_level,
    role,
    created_at,
    updated_at
  )
  SELECT
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'last_name',
    CONCAT(
      COALESCE(au.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(au.raw_user_meta_data->>'last_name', '')
    ),
    'basic',
    'user',
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  WHERE up.id IS NULL;

  GET DIAGNOSTICS _profiles_created = ROW_COUNT;
  _users_synced := (SELECT COUNT(*) FROM auth.users);

  RETURN QUERY SELECT _users_synced, _profiles_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the sync function
SELECT * FROM public.sync_missing_profiles(); 