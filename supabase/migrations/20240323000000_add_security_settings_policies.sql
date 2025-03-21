-- Add insert policy for security settings
CREATE POLICY "Users can insert own security settings"
  ON public.security_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to create insert policy
CREATE OR REPLACE FUNCTION create_security_settings_insert_policy()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_settings' 
    AND policyname = 'Users can insert own security settings'
  ) THEN
    CREATE POLICY "Users can insert own security settings"
      ON public.security_settings
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql; 