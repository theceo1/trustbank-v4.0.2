-- Drop existing profiles table if it exists
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Rename quidax_user_id to quidax_id in user_profiles if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'quidax_user_id'
  ) THEN
    ALTER TABLE user_profiles 
    RENAME COLUMN quidax_user_id TO quidax_id;
  END IF;
END $$;

-- Add missing columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_earnings DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS completed_trades INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate DECIMAL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS verification_history JSONB DEFAULT '{}'::jsonb;

-- Update email from users table
UPDATE user_profiles up
SET email = u.email
FROM users u
WHERE up.user_id = u.id
AND up.email IS NULL;

-- Update full_name from first_name and last_name
UPDATE user_profiles
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL
AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Add unique constraint on referral_code if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_referral_code_key'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_email_key'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Create index on quidax_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_profiles' 
    AND indexname = 'idx_user_profiles_quidax_id'
  ) THEN
    CREATE INDEX idx_user_profiles_quidax_id ON user_profiles(quidax_id);
  END IF;
END $$;

-- Update RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON user_profiles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON user_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$; 