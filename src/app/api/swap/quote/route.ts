import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function POST(request: Request) {
  try {
    // Check Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Get user from token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
    
    if (tokenError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { from_currency, to_currency, from_amount } = body;

    // Validate required parameters
    if (!from_currency || !to_currency || !from_amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user's Quidax ID from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.quidax_id) {
      // Create Quidax sub-account if not exists
      const quidaxResponse = await fetch(`${QUIDAX_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          first_name: user.user_metadata?.first_name || 'Test',
          last_name: user.user_metadata?.last_name || 'User'
        })
      });

      if (!quidaxResponse.ok) {
        console.error('Failed to create Quidax sub-account:', await quidaxResponse.text());
        return NextResponse.json(
          { error: 'Failed to create trading account' },
          { status: 500 }
        );
      }

      const quidaxData = await quidaxResponse.json();
      const quidaxId = quidaxData.data.sn;

      // Update user profile with Quidax ID
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          quidax_id: quidaxId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Failed to update profile with Quidax ID:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Get swap quotation from Quidax
    const quotationResponse = await fetch(
      `${QUIDAX_API_URL}/users/${profile?.quidax_id || 'me'}/swap_quotation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_currency: from_currency.toLowerCase(),
          to_currency: to_currency.toLowerCase(),
          from_amount: from_amount
        })
      }
    );

    if (!quotationResponse.ok) {
      console.error('Failed to get Quidax quotation:', await quotationResponse.text());
      return NextResponse.json(
        { error: 'Failed to get quote' },
        { status: 500 }
      );
    }

    const quotationData = await quotationResponse.json();

    // Record the quote in our database
    const { error: quoteError } = await supabase
      .from('swap_transactions')
      .insert({
        user_id: user.id,
        from_currency: from_currency.toLowerCase(),
        to_currency: to_currency.toLowerCase(),
        from_amount: from_amount,
        to_amount: quotationData.data.to_amount,
        execution_price: quotationData.data.quoted_price,
        status: 'pending',
        quidax_quotation_id: quotationData.data.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (quoteError) {
      console.error('Failed to record quote:', quoteError);
      return NextResponse.json(
        { error: 'Failed to record quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        id: quotationData.data.id,
        rate: parseFloat(quotationData.data.quoted_price),
        fee: quotationData.data.fee || 0,
        network_fee: quotationData.data.network_fee || 0,
        total: parseFloat(from_amount),
        quote_amount: quotationData.data.to_amount,
        expires_at: quotationData.data.expires_at
      }
    });
  } catch (error) {
    console.error('Error in swap quote endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 