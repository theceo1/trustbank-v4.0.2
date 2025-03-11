import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.DOJAH_WEBHOOK_SECRET;
    const signature = request.headers.get('x-dojah-signature');

    if (!signature || signature !== webhookSecret) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Handle verification status update
    if (payload.verification_status) {
      const { reference_id, verification_status, data } = payload;

      // Find the KYC record by reference_id
      const { data: kycRecords, error: findError } = await supabase
        .from('kyc_records')
        .select('*')
        .eq('reference_id', reference_id)
        .single();

      if (findError || !kycRecords) {
        throw new Error('KYC record not found');
      }

      // Update KYC record status
      const status = verification_status === 'Completed' ? 'verified' : 
                    verification_status === 'Failed' ? 'rejected' : 'pending';

      const { error: updateError } = await supabase
        .from('kyc_records')
        .update({
          status,
          verification_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kycRecords.id);

      if (updateError) {
        throw updateError;
      }

      // If verification is completed successfully, update user profile KYC level
      if (status === 'verified') {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            kyc_level: kycRecords.document_type === 'nin' ? 'basic' :
                      kycRecords.document_type === 'bvn' ? 'intermediate' : 'advanced',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', kycRecords.user_id);

        if (profileError) {
          throw profileError;
        }
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
} 