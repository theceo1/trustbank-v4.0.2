import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  permissions: Permission[];
}

interface AdminUser {
  admin_roles: AdminRole;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view user activities
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminUser | null, error: any };

    if (adminError || !adminData?.admin_roles?.permissions?.includes(Permission.VIEW_USERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user activities
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select(`
        id,
        type,
        description,
        timestamp,
        ip_address,
        status,
        metadata
      `)
      .eq('user_id', params.userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (activitiesError) {
      console.error('Error fetching user activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch user activities' },
        { status: 500 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp,
      ipAddress: activity.ip_address,
      status: activity.status,
      ...activity.metadata
    }));

    return NextResponse.json({
      activities: transformedActivities
    });
  } catch (error) {
    console.error('Error in user activity endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 