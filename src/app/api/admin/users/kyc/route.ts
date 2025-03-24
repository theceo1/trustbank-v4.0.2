import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const status = request.nextUrl.searchParams.get('status') || 'pending';

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view KYC submissions
    const hasAccess = await hasPermission(session.user.id, Permission.APPROVE_KYC);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch KYC submissions with user profiles
    const { data: submissions, error: submissionsError } = await supabase
      .from('kyc_submissions')
      .select(`
        *,
        user_profiles (
          id,
          user_id,
          full_name,
          email
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching KYC submissions:', submissionsError);
      return NextResponse.json({ error: 'Failed to fetch KYC submissions' }, { status: 500 });
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error in KYC submissions route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to approve KYC
    const hasAccess = await hasPermission(session.user.id, Permission.APPROVE_KYC);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const { submissionId, action, reason } = await request.json();
    if (!submissionId || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Start a transaction
    const { data: submission, error: submissionError } = await supabase
      .from('kyc_submissions')
      .update({
        status: action,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reason || null,
      })
      .eq('id', submissionId)
      .eq('status', 'pending')
      .select('user_profile_id')
      .single();

    if (submissionError) {
      console.error('Error updating KYC submission:', submissionError);
      return NextResponse.json({ error: 'Failed to update KYC submission' }, { status: 500 });
    }

    if (action === 'approved') {
      // Update user profile verification status
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: session.user.id,
        })
        .eq('id', submission.user_profile_id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
      }

      // Update user role to verified_user
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: 'verified_user',
          updated_at: new Date().toISOString(),
          updated_by: session.user.id,
        })
        .eq('user_profile_id', submission.user_profile_id);

      if (roleError) {
        console.error('Error updating user role:', roleError);
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in KYC action route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}