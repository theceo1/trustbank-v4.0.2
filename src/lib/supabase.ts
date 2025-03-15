import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          quidax_id: string | null
          kyc_verified: boolean
          created_at: string
          updated_at: string
          two_factor_enabled: boolean
          total_referrals: number
          active_referrals: number
          referral_earnings: number
          pending_earnings: number
          referral_code: string
          tier1_verified: boolean
          tier2_verified: boolean
          tier3_verified: boolean
          tier1_submitted_at: string | null
          tier2_submitted_at: string | null
          tier3_submitted_at: string | null
          tier1_verified_at: string | null
          tier2_verified_at: string | null
          tier3_verified_at: string | null
          tier1_reference_id: string | null
          tier2_reference_id: string | null
          tier3_reference_id: string | null
          tier1_data: Json | null
          tier2_data: Json | null
          tier3_data: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          quidax_id?: string | null
          kyc_verified?: boolean
          created_at?: string
          updated_at?: string
          two_factor_enabled?: boolean
          total_referrals?: number
          active_referrals?: number
          referral_earnings?: number
          pending_earnings?: number
          referral_code?: string
          tier1_verified?: boolean
          tier2_verified?: boolean
          tier3_verified?: boolean
          tier1_submitted_at?: string | null
          tier2_submitted_at?: string | null
          tier3_submitted_at?: string | null
          tier1_verified_at?: string | null
          tier2_verified_at?: string | null
          tier3_verified_at?: string | null
          tier1_reference_id?: string | null
          tier2_reference_id?: string | null
          tier3_reference_id?: string | null
          tier1_data?: Json | null
          tier2_data?: Json | null
          tier3_data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          quidax_id?: string | null
          kyc_verified?: boolean
          created_at?: string
          updated_at?: string
          two_factor_enabled?: boolean
          total_referrals?: number
          active_referrals?: number
          referral_earnings?: number
          pending_earnings?: number
          referral_code?: string
          tier1_verified?: boolean
          tier2_verified?: boolean
          tier3_verified?: boolean
          tier1_submitted_at?: string | null
          tier2_submitted_at?: string | null
          tier3_submitted_at?: string | null
          tier1_verified_at?: string | null
          tier2_verified_at?: string | null
          tier3_verified_at?: string | null
          tier1_reference_id?: string | null
          tier2_reference_id?: string | null
          tier3_reference_id?: string | null
          tier1_data?: Json | null
          tier2_data?: Json | null
          tier3_data?: Json | null
        }
      }
    }
  }
}

// Client-side Supabase instance with proper cookie handling
export const supabase = createClientComponentClient<Database>({
  options: {
    global: {
      headers: {
        'x-my-custom-header': 'trustBank'
      }
    }
  }
});

// Server-side Supabase instance
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
); 