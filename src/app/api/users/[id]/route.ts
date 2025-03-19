import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { quidaxService } from '@/lib/quidax';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Check Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
    
    if (tokenError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's Quidax ID from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.quidax_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get user details from Quidax
    try {
      const quidaxUser = await quidaxService.getSubAccount(params.id);
      return NextResponse.json({
        status: 'success',
        data: quidaxUser
      });
    } catch (error: any) {
      console.error('Error fetching Quidax user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch user details' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in user details route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 