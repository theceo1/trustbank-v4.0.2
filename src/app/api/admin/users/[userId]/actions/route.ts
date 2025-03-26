import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';

export async function POST(
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

    // Check if user has permission to manage users
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single();

    if (adminError || !adminData?.admin_roles?.permissions?.includes(Permission.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, reason } = body;

    if (!['suspend', 'verify', 'unsuspend'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get user's current status
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('status, verification_level')
      .eq('user_id', params.userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile based on action
    const updates: any = {};
    let activityType = '';
    let activityDescription = '';

    switch (action) {
      case 'suspend':
        updates.status = 'suspended';
        activityType = 'account_suspended';
        activityDescription = `Account suspended. Reason: ${reason}`;
        break;
      case 'unsuspend':
        updates.status = 'active';
        activityType = 'account_unsuspended';
        activityDescription = `Account suspension lifted. Reason: ${reason}`;
        break;
      case 'verify':
        updates.verification_level = 'verified';
        updates.status = 'active';
        activityType = 'account_verified';
        activityDescription = 'Account manually verified by admin';
        break;
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', params.userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.rpc('log_user_activity', {
      p_user_id: params.userId,
      p_type: activityType,
      p_description: activityDescription,
      p_metadata: {
        admin_id: session.user.id,
        reason: reason
      }
    });

    return NextResponse.json({
      message: 'Action completed successfully',
      updates
    });
  } catch (error) {
    console.error('Error in user actions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 