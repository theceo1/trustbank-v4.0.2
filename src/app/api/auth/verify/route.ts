import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Risk thresholds for different actions
const RISK_THRESHOLDS = {
  HIGH_VALUE_TRANSACTION: 80,
  UNUSUAL_LOGIN: 60,
  GEOGRAPHIC_CHANGE: 70,
  TRADING_PATTERN_CHANGE: 65
};

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action_type, metadata } = body;

    // Get user's current profile and risk score
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_tier, risk_score, verification_history')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get KYC configurations
    const { data: configs } = await supabase
      .from('configurations')
      .select('value')
      .eq('key', 'kyc_tiers')
      .single();

    const kycConfig = configs?.value;
    
    // Calculate new risk factors based on the action
    let newRiskFactors = [];
    
    switch (action_type) {
      case 'high_value_transaction':
        if (metadata.amount > kycConfig[profile.kyc_tier].daily_limit * 0.8) {
          newRiskFactors.push({
            factor_type: 'transaction_volume',
            factor_value: 30,
            description: 'Large transaction near tier limit',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          });
        }
        break;

      case 'login_attempt':
        if (metadata.location !== metadata.usual_location) {
          newRiskFactors.push({
            factor_type: 'geographic_risk',
            factor_value: 20,
            description: 'Login from new location',
            expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
          });
        }
        break;

      case 'trading_pattern':
        if (metadata.volume_change > 200) { // 200% increase
          newRiskFactors.push({
            factor_type: 'trading_pattern',
            factor_value: 25,
            description: 'Unusual trading volume increase',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
          });
        }
        break;
    }

    // Insert new risk factors
    if (newRiskFactors.length > 0) {
      const { error: riskError } = await supabase
        .from('risk_factors')
        .insert(newRiskFactors.map(factor => ({
          user_id: user.id,
          ...factor
        })));

      if (riskError) throw riskError;
    }

    // Get updated risk score (calculated by trigger)
    const { data: updatedProfile } = await supabase
      .from('user_profiles')
      .select('risk_score, kyc_tier')
      .eq('user_id', user.id)
      .single();

    // Determine if additional verification is needed
    const needsVerification = 
      (action_type === 'high_value_transaction' && profile.risk_score >= RISK_THRESHOLDS.HIGH_VALUE_TRANSACTION) ||
      (action_type === 'login_attempt' && profile.risk_score >= RISK_THRESHOLDS.UNUSUAL_LOGIN) ||
      (action_type === 'trading_pattern' && profile.risk_score >= RISK_THRESHOLDS.TRADING_PATTERN_CHANGE);

    if (needsVerification) {
      // Determine next required verification based on current tier
      const currentTierIndex = Object.keys(kycConfig).indexOf(profile.kyc_tier);
      const nextTier = Object.keys(kycConfig)[currentTierIndex + 1];
      
      if (nextTier) {
        const nextRequirements = kycConfig[nextTier].requirements;
        
        // Create verification request
        const { data: verificationRequest } = await supabase
          .from('verification_requests')
          .insert({
            user_id: user.id,
            requested_tier: nextTier,
            verification_type: nextRequirements[0],
            metadata: {
              trigger: action_type,
              risk_score: updatedProfile?.risk_score
            }
          })
          .select()
          .single();

        return NextResponse.json({
          status: 'verification_required',
          data: {
            verification_request: verificationRequest,
            current_risk_score: updatedProfile?.risk_score,
            required_verification: nextRequirements[0]
          }
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        risk_score: updatedProfile?.risk_score,
        kyc_tier: updatedProfile?.kyc_tier,
        verification_required: false
      }
    });
  } catch (error) {
    console.error('Error in verification endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 