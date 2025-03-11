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
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          kyc_level: 'basic' | 'intermediate' | 'advanced'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          kyc_level?: 'basic' | 'intermediate' | 'advanced'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          kyc_level?: 'basic' | 'intermediate' | 'advanced'
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          currency: string
          balance: number
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          currency: string
          balance?: number
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          currency?: string
          balance?: number
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          type: 'deposit' | 'withdrawal' | 'transfer'
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_id: string
          type: 'deposit' | 'withdrawal' | 'transfer'
          amount: number
          currency: string
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_id?: string
          type?: 'deposit' | 'withdrawal' | 'transfer'
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      kyc_records: {
        Row: {
          id: string
          user_id: string
          document_type: 'nin' | 'bvn' | 'passport' | 'drivers_license'
          document_number: string
          status: 'pending' | 'verified' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_type: 'nin' | 'bvn' | 'passport' | 'drivers_license'
          document_number: string
          status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: 'nin' | 'bvn' | 'passport' | 'drivers_license'
          document_number?: string
          status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      security_settings: {
        Row: {
          id: string
          user_id: string
          two_factor_enabled: boolean
          two_factor_secret: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 