import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the last 12 months of data
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11);

    // Fetch user profiles with their creation dates
    const { data: userStats, error: statsError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'user');

    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch user statistics' }, { status: 500 });
    }

    // Fetch verification requests
    const { data: verificationRequests, error: verificationError } = await supabase
      .from('verification_requests')
      .select('*');

    if (verificationError) {
      console.error('Error fetching verification requests:', verificationError);
      return NextResponse.json({ error: 'Failed to fetch verification data' }, { status: 500 });
    }

    // Calculate user statistics
    const totalUsers = userStats.length;
    const basicUsers = userStats.filter(user => user.kyc_level === 'basic').length;
    const intermediateUsers = userStats.filter(user => user.kyc_level === 'intermediate').length;
    const advancedUsers = userStats.filter(user => user.kyc_level === 'advanced').length;

    // Calculate verification statistics
    const verificationStats = {
      total: verificationRequests.length,
      pending: verificationRequests.filter(req => req.status === 'pending').length,
      approved: verificationRequests.filter(req => req.status === 'approved').length,
      rejected: verificationRequests.filter(req => req.status === 'rejected').length,
      by_type: {
        email: verificationRequests.filter(req => req.verification_type === 'email').length,
        phone: verificationRequests.filter(req => req.verification_type === 'phone').length,
        basic_info: verificationRequests.filter(req => req.verification_type === 'basic_info').length,
        selfie: verificationRequests.filter(req => req.verification_type === 'selfie').length,
        nin: verificationRequests.filter(req => req.verification_type === 'nin').length,
        bvn: verificationRequests.filter(req => req.verification_type === 'bvn').length,
        government_id: verificationRequests.filter(req => req.verification_type === 'government_id').length,
        passport: verificationRequests.filter(req => req.verification_type === 'passport').length,
        livecheck: verificationRequests.filter(req => req.verification_type === 'livecheck').length
      }
    };

    // Calculate monthly new users
    const monthlyNewUsers = Array(12).fill(0);
    const monthlyActiveUsers = Array(12).fill(0);
    const monthlyVerifications = Array(12).fill(0);

    userStats.forEach(user => {
      if (user.created_at) {
        const createdAt = new Date(user.created_at);
        const monthIndex = createdAt.getMonth();
        monthlyNewUsers[monthIndex]++;
      }
    });

    verificationRequests.forEach(req => {
      if (req.created_at) {
        const createdAt = new Date(req.created_at);
        const monthIndex = createdAt.getMonth();
        monthlyVerifications[monthIndex]++;
      }
    });

    // Return the analytics data
    return NextResponse.json({
      total_users: totalUsers,
      kyc_stats: {
        basic: basicUsers,
        intermediate: intermediateUsers,
        advanced: advancedUsers
      },
      verification_stats: verificationStats,
      monthly_stats: {
        new_users: monthlyNewUsers,
        active_users: monthlyActiveUsers,
        verifications: monthlyVerifications
      }
    });

  } catch (error: any) {
    console.error('Analytics users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
} 