import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all profiles for the user, ordered by creation date
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // If there's only one profile or no profiles, no cleanup needed
    if (!profiles || profiles.length <= 1) {
      return NextResponse.json({ message: 'No cleanup needed' });
    }

    // Keep the most recent profile and delete the rest
    const [mostRecent, ...duplicates] = profiles;
    
    // Delete duplicate profiles
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .in('id', duplicates.map(d => d.id));

    if (deleteError) {
      console.error('Error deleting duplicate profiles:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete duplicate profiles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully cleaned up duplicate profiles',
      deletedCount: duplicates.length
    });

  } catch (error) {
    console.error('Error in profile cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 