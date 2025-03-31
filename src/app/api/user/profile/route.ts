import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile - order by created_at to get the latest one
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Clean up duplicate profiles if they exist
    const { data: duplicates, error: duplicatesError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .neq('id', profile.id);

    if (duplicatesError) {
      console.error('Error checking for duplicates:', duplicatesError);
    } else if (duplicates && duplicates.length > 0) {
      // Delete duplicate profiles
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .in('id', duplicates.map(d => d.id));

      if (deleteError) {
        console.error('Error deleting duplicate profiles:', deleteError);
      }
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 