-- Add role column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support'));

-- Update existing policies to use the new role column
DROP POLICY IF EXISTS "Admins can view all security settings" ON public.security_settings;
DROP POLICY IF EXISTS "Admins can update all security settings" ON public.security_settings;

CREATE POLICY "Admins can view all security settings" ON public.security_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all security settings" ON public.security_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  ); 