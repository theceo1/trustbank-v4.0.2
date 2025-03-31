-- First, clean up any existing duplicate profiles
DO $$ 
BEGIN
  -- Create a temporary table to store the most recent profile IDs
  CREATE TEMP TABLE latest_profiles AS
  SELECT DISTINCT ON (user_id) id
  FROM public.user_profiles
  ORDER BY user_id, created_at DESC;

  -- Delete all profiles except the most recent ones
  DELETE FROM public.user_profiles
  WHERE id NOT IN (SELECT id FROM latest_profiles);

  -- Drop the temporary table
  DROP TABLE latest_profiles;
END $$;

-- Now add the unique constraint if it doesn't exist
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'user_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$; 