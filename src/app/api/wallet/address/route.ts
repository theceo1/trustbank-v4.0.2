import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { quidaxService } from '@/lib/quidax';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const network = searchParams.get('network') || undefined;

    if (!currency) {
      return NextResponse.json({ message: 'Currency is required' }, { status: 400 });
    }

    // Create a new supabase client
    const supabase = createRouteHandlerClient({ 
      cookies
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Check Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
    
    if (tokenError || !user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get user profile to get Quidax ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (!userProfile?.quidax_id) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    try {
      // Try to get existing address first
      const address = await quidaxService.getWalletAddress(userProfile.quidax_id, currency);
      return NextResponse.json({ 
        status: 'success',
        data: { address } 
      });
    } catch (error) {
      // If no address exists, create a new one
      const newAddress = await quidaxService.createWalletAddress(
        userProfile.quidax_id, 
        currency, 
        network
      );
      return NextResponse.json({ 
        status: 'success',
        data: { address: newAddress } 
      });
    }
  } catch (error: any) {
    console.error('Error handling wallet address request:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to get wallet address'
    }, { 
      status: 500 
    });
  }
} 