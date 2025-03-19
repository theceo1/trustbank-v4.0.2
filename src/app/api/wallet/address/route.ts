import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { QuidaxServerService } from '@/lib/quidax';

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const network = searchParams.get('network');

    if (!currency || !network) {
      return NextResponse.json(
        { error: 'Currency and network are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with proper cookie handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Quidax ID from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.quidax_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Initialize Quidax service
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;
    if (!quidaxSecretKey) {
      throw new Error('QUIDAX_SECRET_KEY is not configured');
    }
    
    const quidaxService = new QuidaxServerService(quidaxSecretKey);

    try {
      // First try to get existing addresses
      const response = await quidaxService.request(
        `/users/${profile.quidax_id}/wallets/${currency}/addresses?network=${network}`
      );

      // If we have addresses, return the first one
      if (response?.data?.length > 0) {
        return NextResponse.json({
          status: 'success',
          data: response.data[0]
        });
      }

      // If no addresses found, create a new one
      const newAddress = await quidaxService.request(
        `/users/${profile.quidax_id}/wallets/${currency}/addresses`,
        {
          method: 'POST',
          body: JSON.stringify({ network })
        }
      );

      return NextResponse.json({
        status: 'success',
        data: newAddress.data
      });
    } catch (error: any) {
      // If address already exists, try to fetch it again
      if (error.message?.includes('Address already generated')) {
        try {
          // Retry fetching addresses
          const existingAddresses = await quidaxService.request(
            `/users/${profile.quidax_id}/wallets/${currency}/addresses?network=${network}`
          );

          if (existingAddresses?.data?.length > 0) {
            return NextResponse.json({
              status: 'success',
              data: existingAddresses.data[0]
            });
          }
        } catch (fetchError) {
          console.error('Error fetching existing address:', fetchError);
        }
      }

      // If we get here, something went wrong
      console.error('Error handling wallet address:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to handle wallet address request' },
        { status: error.message?.includes('Address already generated') ? 409 : 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in wallet address route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 
 