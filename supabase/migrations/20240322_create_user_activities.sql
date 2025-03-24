-- Create enum for activity types
CREATE TYPE activity_type AS ENUM (
  'login',
  'transaction',
  'kyc',
  'profile_update',
  'password_change'
);

-- Create enum for activity status
CREATE TYPE activity_status AS ENUM (
  'success',
  'failed',
  'pending'
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ip_address TEXT,
  status activity_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(type);
CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp);
CREATE INDEX idx_user_activities_status ON user_activities(status);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_user_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_activities_updated_at
  BEFORE UPDATE ON user_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activities_updated_at();

-- Set up RLS (Row Level Security)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities"
  ON user_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      INNER JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
      AND ar.permissions ? 'view_users'
    )
  );

CREATE POLICY "System can insert activities"
  ON user_activities FOR INSERT
  WITH CHECK (true);

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_type activity_type,
  p_description TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_status activity_status DEFAULT 'success',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activities (
    user_id,
    type,
    description,
    ip_address,
    status,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_description,
    p_ip_address,
    p_status,
    p_metadata
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 