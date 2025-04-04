import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  name: string;
  permissions: Permission[];
}

interface AdminData {
  admin_roles: AdminRole;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role from admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          name,
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminData | null, error: any };

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();

    // Check if user has admin or super_admin role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    // Get request body
    const body = await req.json();
    const { email, slack } = body;

    if (typeof email !== 'boolean' || typeof slack !== 'boolean') {
      return NextResponse.json({ error: 'Invalid notification settings' }, { status: 400 });
    }

    // Save notification settings to the database
    const { error: updateError } = await supabase
      .from('admin_settings')
      .upsert({
        user_id: session.user.id,
        email_notifications: email,
        slack_notifications: slack,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating notification settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to save notification settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Notification settings saved successfully',
    });

  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to save notification settings' },
      { status: 500 }
    );
  }
}