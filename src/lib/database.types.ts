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
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          source: string
          preferences: Json
          metadata: Json
          subscribed_at: string
          unsubscribed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          source: string
          preferences?: Json
          metadata?: Json
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          source?: string
          preferences?: Json
          metadata?: Json
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      p2p_orders: {
        Row: {
          id: string
          creator_id: string
          type: 'buy' | 'sell'
          currency: 'BTC' | 'ETH' | 'USDT' | 'USDC'
          price: string
          amount: string
          min_order: string
          max_order: string
          payment_methods: string[]
          terms: string
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          type: 'buy' | 'sell'
          currency: 'BTC' | 'ETH' | 'USDT' | 'USDC'
          price: string
          amount: string
          min_order: string
          max_order: string
          payment_methods: string[]
          terms: string
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          type?: 'buy' | 'sell'
          currency?: 'BTC' | 'ETH' | 'USDT' | 'USDC'
          price?: string
          amount?: string
          min_order?: string
          max_order?: string
          payment_methods?: string[]
          terms?: string
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      p2p_trades: {
        Row: {
          id: string
          order_id: string
          trader_id: string
          amount: string
          crypto_amount: string
          status: 'pending' | 'paid' | 'completed' | 'disputed' | 'cancelled'
          payment_proof: string | null
          dispute_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          trader_id: string
          amount: string
          crypto_amount: string
          status?: 'pending' | 'paid' | 'completed' | 'disputed' | 'cancelled'
          payment_proof?: string | null
          dispute_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          trader_id?: string
          amount?: string
          crypto_amount?: string
          status?: 'pending' | 'paid' | 'completed' | 'disputed' | 'cancelled'
          payment_proof?: string | null
          dispute_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          kyc_verified: boolean
          kyc_status: 'pending' | 'verified' | 'rejected'
          completed_trades: number
          completion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          kyc_verified?: boolean
          kyc_status?: 'pending' | 'verified' | 'rejected'
          completed_trades?: number
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          kyc_verified?: boolean
          kyc_status?: 'pending' | 'verified' | 'rejected'
          completed_trades?: number
          completion_rate?: number
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