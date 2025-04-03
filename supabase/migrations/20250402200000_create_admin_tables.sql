-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Add indexes for better query performance
CREATE INDEX admin_users_user_id_idx ON admin_users(user_id);
CREATE INDEX admin_users_role_id_idx ON admin_users(role_id);
CREATE INDEX admin_roles_name_idx ON admin_roles(name);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_roles
CREATE POLICY "Admin roles viewable by authenticated users"
    ON admin_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin roles insertable by super admins only"
    ON admin_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND ar.name = 'super_admin'
            AND au.is_active = true
        )
    );

CREATE POLICY "Admin roles updatable by super admins only"
    ON admin_roles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND ar.name = 'super_admin'
            AND au.is_active = true
        )
    );

-- Create policies for admin_users
CREATE POLICY "Admin users viewable by authenticated users"
    ON admin_users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin users insertable by super admins only"
    ON admin_users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND ar.name = 'super_admin'
            AND au.is_active = true
        )
    );

CREATE POLICY "Admin users updatable by super admins only"
    ON admin_users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid()
            AND ar.name = 'super_admin'
            AND au.is_active = true
        )
    );

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin role if it doesn't exist
INSERT INTO admin_roles (name, permissions)
VALUES (
    'super_admin',
    '[
        "view_users",
        "manage_users",
        "view_transactions",
        "approve_transaction",
        "view_wallet",
        "manage_wallet",
        "approve_kyc",
        "view_admin_dashboard",
        "manage_settings",
        "view_logs",
        "manage_revenue",
        "view_analytics"
    ]'::jsonb
)
ON CONFLICT (name) DO NOTHING; 