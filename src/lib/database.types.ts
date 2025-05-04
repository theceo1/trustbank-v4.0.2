export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_settings: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          language: string | null
          notifications: Json | null
          privacy: Json | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          language?: string | null
          notifications?: Json | null
          privacy?: Json | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          language?: string | null
          notifications?: Json | null
          privacy?: Json | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_access_cache: {
        Row: {
          id: string
          is_admin: boolean | null
          permissions: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_admin?: boolean | null
          permissions?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_admin?: boolean | null
          permissions?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          last_active: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean | null
          last_active?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          last_active?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          role_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          timestamp: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          timestamp?: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          timestamp?: string
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Relationships: []
      }
      backup_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      configurations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          created_at: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          position: string
          resume_url: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          position: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          position?: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_records: {
        Row: {
          created_at: string
          document_number: string
          document_type: string
          id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          document_number: string | null
          document_type: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_response: Json | null
          reference_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: string | null
          tier: string | null
          updated_at: string | null
          user_id: string | null
          verification_data: Json | null
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_response?: Json | null
          reference_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_response?: Json | null
          reference_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      limit_orders: {
        Row: {
          amount: number
          created_at: string | null
          executed_at: string | null
          executed_price: number | null
          from_currency: string
          id: string
          limit_price: number
          status: string
          to_currency: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          executed_at?: string | null
          executed_price?: number | null
          from_currency: string
          id?: string
          limit_price: number
          status?: string
          to_currency: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          executed_at?: string | null
          executed_price?: number | null
          from_currency?: string
          id?: string
          limit_price?: number
          status?: string
          to_currency?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      merchant_qr_codes: {
        Row: {
          created_at: string
          currency: string
          expiry_date: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          label: string
          merchant_id: string | null
          metadata: Json | null
          times_used: number
          usage_limit: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          expiry_date?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          label: string
          merchant_id?: string | null
          metadata?: Json | null
          times_used?: number
          usage_limit?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          expiry_date?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          label?: string
          merchant_id?: string | null
          metadata?: Json | null
          times_used?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_qr_codes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_settlements: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          merchant_id: string | null
          metadata: Json | null
          settled_at: string | null
          status: string
          transaction_ids: string[] | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
          settled_at?: string | null
          status?: string
          transaction_ids?: string[] | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string | null
          metadata?: Json | null
          settled_at?: string | null
          status?: string
          transaction_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_settlements_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          address: Json | null
          auto_settlement: boolean
          business_name: string
          business_type: Database["public"]["Enums"]["merchant_type"]
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          registration_number: string | null
          settlement_schedule: string | null
          settlement_threshold: number | null
          settlement_wallet_id: string
          social_media: Json | null
          tax_id: string | null
          total_transactions: number
          total_volume: number
          updated_at: string
          user_id: string | null
          verification_data: Json | null
          verification_status: Database["public"]["Enums"]["merchant_verification_status"]
          website: string | null
        }
        Insert: {
          address?: Json | null
          auto_settlement?: boolean
          business_name: string
          business_type?: Database["public"]["Enums"]["merchant_type"]
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          registration_number?: string | null
          settlement_schedule?: string | null
          settlement_threshold?: number | null
          settlement_wallet_id: string
          social_media?: Json | null
          tax_id?: string | null
          total_transactions?: number
          total_volume?: number
          updated_at?: string
          user_id?: string | null
          verification_data?: Json | null
          verification_status?: Database["public"]["Enums"]["merchant_verification_status"]
          website?: string | null
        }
        Update: {
          address?: Json | null
          auto_settlement?: boolean
          business_name?: string
          business_type?: Database["public"]["Enums"]["merchant_type"]
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          registration_number?: string | null
          settlement_schedule?: string | null
          settlement_threshold?: number | null
          settlement_wallet_id?: string
          social_media?: Json | null
          tax_id?: string | null
          total_transactions?: number
          total_volume?: number
          updated_at?: string
          user_id?: string | null
          verification_data?: Json | null
          verification_status?: Database["public"]["Enums"]["merchant_verification_status"]
          website?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          metadata: Json | null
          preferences: Json | null
          source: string | null
          subscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          metadata?: Json | null
          preferences?: Json | null
          source?: string | null
          subscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          preferences?: Json | null
          source?: string | null
          subscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_admin_notification: boolean | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_admin_notification?: boolean | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_admin_notification?: boolean | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      p2p_disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          evidence: string | null
          id: string
          initiator_id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          trade_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          initiator_id: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          trade_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          initiator_id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_disputes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "p2p_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_escrows: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          escrow_confirmation_code: string
          escrow_wallet_id: string
          expires_at: string
          id: string
          order_id: string
          payment_confirmed_at: string | null
          payment_window_minutes: number
          price: number
          seller_id: string
          status: Database["public"]["Enums"]["trade_status"]
          total: number
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          escrow_confirmation_code: string
          escrow_wallet_id: string
          expires_at: string
          id?: string
          order_id: string
          payment_confirmed_at?: string | null
          payment_window_minutes?: number
          price: number
          seller_id: string
          status?: Database["public"]["Enums"]["trade_status"]
          total: number
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          escrow_confirmation_code?: string
          escrow_wallet_id?: string
          expires_at?: string
          id?: string
          order_id?: string
          payment_confirmed_at?: string | null
          payment_window_minutes?: number
          price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["trade_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_escrows_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "p2p_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_orders: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          currency: string
          expires_at: string
          id: string
          max_order: number
          min_order: number
          payment_methods: string[]
          price: number
          status: Database["public"]["Enums"]["order_status"]
          terms: string | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          creator_id: string
          currency: string
          expires_at: string
          id?: string
          max_order: number
          min_order: number
          payment_methods: string[]
          price: number
          status?: Database["public"]["Enums"]["order_status"]
          terms?: string | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          currency?: string
          expires_at?: string
          id?: string
          max_order?: number
          min_order?: number
          payment_methods?: string[]
          price?: number
          status?: Database["public"]["Enums"]["order_status"]
          terms?: string | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Relationships: []
      }
      p2p_trades: {
        Row: {
          amount: number
          buyer_id: string
          buyer_quidax_id: string
          completed_at: string | null
          created_at: string
          escrow_id: string
          id: string
          order_id: string
          paid_at: string | null
          payment_proof: string | null
          price: number
          seller_id: string
          seller_quidax_id: string
          status: Database["public"]["Enums"]["trade_status"]
          total: number
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          buyer_quidax_id: string
          completed_at?: string | null
          created_at?: string
          escrow_id: string
          id?: string
          order_id: string
          paid_at?: string | null
          payment_proof?: string | null
          price: number
          seller_id: string
          seller_quidax_id: string
          status?: Database["public"]["Enums"]["trade_status"]
          total: number
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          buyer_quidax_id?: string
          completed_at?: string | null
          created_at?: string
          escrow_id?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_proof?: string | null
          price?: number
          seller_id?: string
          seller_quidax_id?: string
          status?: Database["public"]["Enums"]["trade_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_trades_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "p2p_escrows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "p2p_trades_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "p2p_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_revenue: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          fee_type: Database["public"]["Enums"]["fee_type_enum"]
          id: string
          metadata: Json | null
          swap_id: string | null
          trade_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          description?: string | null
          fee_type: Database["public"]["Enums"]["fee_type_enum"]
          id?: string
          metadata?: Json | null
          swap_id?: string | null
          trade_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          fee_type?: Database["public"]["Enums"]["fee_type_enum"]
          id?: string
          metadata?: Json | null
          swap_id?: string | null
          trade_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_revenue_swap_id_fkey"
            columns: ["swap_id"]
            isOneToOne: false
            referencedRelation: "swap_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_revenue_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_revenue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_revenue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          condition: string
          created_at: string | null
          currency_pair: string
          id: string
          status: string | null
          target_price: number
          triggered_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          condition: string
          created_at?: string | null
          currency_pair: string
          id?: string
          status?: string | null
          target_price: number
          triggered_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          condition?: string
          created_at?: string | null
          currency_pair?: string
          id?: string
          status?: string | null
          target_price?: number
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          key: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          key: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      reconciliation_logs: {
        Row: {
          currency: string
          id: number
          local_balance: number
          quidax_balance: number
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          timestamp: string
        }
        Insert: {
          currency: string
          id?: number
          local_balance: number
          quidax_balance: number
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          timestamp?: string
        }
        Update: {
          currency?: string
          id?: number
          local_balance?: number
          quidax_balance?: number
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      reconciliation_state: {
        Row: {
          id: number
          is_reconciliation_running: boolean | null
          last_run_error: string | null
          last_run_status: string | null
          last_transaction_check: string
          last_wallet_check: string
          updated_at: string
        }
        Insert: {
          id?: number
          is_reconciliation_running?: boolean | null
          last_run_error?: string | null
          last_run_status?: string | null
          last_transaction_check?: string
          last_wallet_check?: string
          updated_at?: string
        }
        Update: {
          id?: number
          is_reconciliation_running?: boolean | null
          last_run_error?: string | null
          last_run_status?: string | null
          last_transaction_check?: string
          last_wallet_check?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string | null
          referrer_id: string | null
          reward_claimed: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          reward_claimed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          reward_claimed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      risk_factors: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          factor_type: string
          factor_value: number
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          factor_type: string
          factor_value: number
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          factor_type?: string
          factor_value?: number
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          last_login: string | null
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          last_login?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          last_login?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stats: {
        Row: {
          created_at: string | null
          id: string
          total_received: number | null
          total_sent: number | null
          total_transactions: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_received?: number | null
          total_sent?: number | null
          total_transactions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          total_received?: number | null
          total_sent?: number | null
          total_transactions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      swap_transactions: {
        Row: {
          created_at: string
          execution_price: number
          from_amount: number
          from_currency: string
          id: string
          quidax_quotation_id: string | null
          quidax_swap_id: string | null
          status: string | null
          to_amount: number
          to_currency: string
          updated_at: string
          usd_equivalent: number | null
          usd_rate: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          execution_price: number
          from_amount: number
          from_currency: string
          id?: string
          quidax_quotation_id?: string | null
          quidax_swap_id?: string | null
          status?: string | null
          to_amount: number
          to_currency: string
          updated_at?: string
          usd_equivalent?: number | null
          usd_rate?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          execution_price?: number
          from_amount?: number
          from_currency?: string
          id?: string
          quidax_quotation_id?: string | null
          quidax_swap_id?: string | null
          status?: string | null
          to_amount?: number
          to_currency?: string
          updated_at?: string
          usd_equivalent?: number | null
          usd_rate?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fees: Json | null
          from_currency: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          quidax_reference: string | null
          rate: number | null
          status: string
          to_currency: string | null
          total: number | null
          type: string
          updated_at: string
          usd_equivalent: number | null
          usd_rate: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          fees?: Json | null
          from_currency?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          quidax_reference?: string | null
          rate?: number | null
          status?: string
          to_currency?: string | null
          total?: number | null
          type: string
          updated_at?: string
          usd_equivalent?: number | null
          usd_rate?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fees?: Json | null
          from_currency?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          quidax_reference?: string | null
          rate?: number | null
          status?: string
          to_currency?: string | null
          total?: number | null
          type?: string
          updated_at?: string
          usd_equivalent?: number | null
          usd_rate?: number | null
          user_id?: string
        }
        Relationships: []
      }
      transaction_limits: {
        Row: {
          created_at: string | null
          currency: string
          daily_limit: number
          id: string
          require_approval_above: number
          single_transaction_limit: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency: string
          daily_limit: number
          id?: string
          require_approval_above: number
          single_transaction_limit: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          daily_limit?: number
          id?: string
          require_approval_above?: number
          single_transaction_limit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          recipient_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          recipient_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          recipient_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          created_at: string | null
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["activity_status"]
          timestamp: string | null
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["activity_status"]
          timestamp?: string | null
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["activity_status"]
          timestamp?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_limits: {
        Row: {
          created_at: string
          deposit_limit: number
          deposit_used: number
          id: string
          trading_limit: number
          trading_used: number
          updated_at: string
          user_id: string
          withdrawal_limit: number
          withdrawal_used: number
        }
        Insert: {
          created_at?: string
          deposit_limit?: number
          deposit_used?: number
          id?: string
          trading_limit?: number
          trading_used?: number
          updated_at?: string
          user_id: string
          withdrawal_limit?: number
          withdrawal_used?: number
        }
        Update: {
          created_at?: string
          deposit_limit?: number
          deposit_used?: number
          id?: string
          trading_limit?: number
          trading_used?: number
          updated_at?: string
          user_id?: string
          withdrawal_limit?: number
          withdrawal_used?: number
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          wallet_order: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          wallet_order?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          wallet_order?: Json | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          active_referrals: number | null
          completed_trades: number | null
          completion_rate: number | null
          created_at: string
          daily_volume_usd: number | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          kyc_level: string | null
          kyc_verified: boolean | null
          last_name: string | null
          monthly_volume_usd: number | null
          pending_earnings: number | null
          phone_number: string | null
          quidax_id: string | null
          quidax_sn: string | null
          referral_code: string | null
          referral_earnings: number | null
          referred_by: string | null
          role: string | null
          total_referrals: number | null
          trading_volume_usd: number | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
          verification_history: Json | null
        }
        Insert: {
          active_referrals?: number | null
          completed_trades?: number | null
          completion_rate?: number | null
          created_at?: string
          daily_volume_usd?: number | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          kyc_level?: string | null
          kyc_verified?: boolean | null
          last_name?: string | null
          monthly_volume_usd?: number | null
          pending_earnings?: number | null
          phone_number?: string | null
          quidax_id?: string | null
          quidax_sn?: string | null
          referral_code?: string | null
          referral_earnings?: number | null
          referred_by?: string | null
          role?: string | null
          total_referrals?: number | null
          trading_volume_usd?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
          verification_history?: Json | null
        }
        Update: {
          active_referrals?: number | null
          completed_trades?: number | null
          completion_rate?: number | null
          created_at?: string
          daily_volume_usd?: number | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          kyc_level?: string | null
          kyc_verified?: boolean | null
          last_name?: string | null
          monthly_volume_usd?: number | null
          pending_earnings?: number | null
          phone_number?: string | null
          quidax_id?: string | null
          quidax_sn?: string | null
          referral_code?: string | null
          referral_earnings?: number | null
          referred_by?: string | null
          role?: string | null
          total_referrals?: number | null
          trading_volume_usd?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          verification_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_referred_by"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["referral_code"]
          },
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string
          created_at: string | null
          device: string
          device_info: Json | null
          expires_at: string
          failed_attempts: number | null
          id: string
          ip: string
          ip_address: string | null
          last_active: string | null
          location: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          browser: string
          created_at?: string | null
          device: string
          device_info?: Json | null
          expires_at: string
          failed_attempts?: number | null
          id?: string
          ip: string
          ip_address?: string | null
          last_active?: string | null
          location?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          browser?: string
          created_at?: string | null
          device?: string
          device_info?: Json | null
          expires_at?: string
          failed_attempts?: number | null
          id?: string
          ip?: string
          ip_address?: string | null
          last_active?: string | null
          location?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          requested_tier: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          verification_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          requested_tier: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          requested_tier?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_type?: string
        }
        Relationships: []
      }
      wallet_limits: {
        Row: {
          created_at: string | null
          currency: string
          daily_limit: number
          id: string
          max_deposit: number
          max_withdrawal: number
          min_deposit: number
          min_withdrawal: number
          monthly_limit: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency: string
          daily_limit?: number
          id?: string
          max_deposit?: number
          max_withdrawal?: number
          min_deposit?: number
          min_withdrawal?: number
          monthly_limit?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          daily_limit?: number
          id?: string
          max_deposit?: number
          max_withdrawal?: number
          min_deposit?: number
          min_withdrawal?: number
          monthly_limit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          currency: string
          id: string
          quidax_wallet_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          currency: string
          id?: string
          quidax_wallet_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          quidax_wallet_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      korapay_transfers: {
        Row: {
          id: string;
          user_id: string;
          reference: string;
          amount: number;
          currency: string;
          bank_code: string;
          account_number: string;
          account_name: string;
          status: string;
          response_data: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['korapay_transfers']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['korapay_transfers']['Row']>;
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          status: string
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          status: string
          details: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          status?: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_risk_score: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      calculate_usd_equivalent: {
        Args: {
          amount: number
          currency: string
          rate?: number
        }
        Returns: number
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_attempts: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      check_trading_limits: {
        Args: {
          user_id: string
          amount: number
          currency: string
        }
        Returns: boolean
      }
      check_transaction_limits: {
        Args: {
          p_currency: string
          p_amount: number
          p_user_id: string
        }
        Returns: {
          requires_approval: boolean
          reason: string
        }[]
      }
      create_schema_if_not_exists: {
        Args: {
          schema_name: string
        }
        Returns: undefined
      }
      create_security_settings_insert_policy: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_transaction: {
        Args: {
          p_type: Database["public"]["Enums"]["transaction_type"]
          p_amount: number
          p_description: string
          p_user_id: string
          p_recipient_id?: string
        }
        Returns: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          recipient_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
      }
      create_user_record: {
        Args: {
          user_id: string
          user_email: string
        }
        Returns: undefined
      }
      create_wallet_management_functions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      drop_and_recreate_wallets_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ensure_user_wallets: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      exec_sql: {
        Args: {
          sql: string
        }
        Returns: undefined
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_or_create_wallet: {
        Args: {
          p_user_id: string
          p_currency: string
        }
        Returns: {
          balance: number
          pending_balance: number
        }[]
      }
      grant_permissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_transaction_approval: {
        Args: {
          p_transaction_id: string
          p_action: string
          p_admin_id: string
        }
        Returns: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          recipient_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
      }
      increment_completed_trades: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      install_extensions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_type: Database["public"]["Enums"]["activity_type"]
          p_description: string
          p_ip_address?: string
          p_status?: Database["public"]["Enums"]["activity_status"]
          p_metadata?: Json
        }
        Returns: string
      }
      sync_kyc_verifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      track_security_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_ip_address: string
          p_user_agent: string
          p_metadata?: Json
        }
        Returns: string
      }
      update_user_profile_admin: {
        Args: {
          p_user_id: string
          p_email: string
          p_quidax_id: string
          p_full_name?: string
        }
        Returns: Json
      }
      update_wallet_balance:
        | {
            Args: {
              p_user_id: string
              p_currency: string
              p_amount: number
            }
            Returns: undefined
          }
        | {
            Args: {
              wallet_id: string
              amount: number
              operation: string
            }
            Returns: undefined
          }
    }
    Enums: {
      activity_status: "success" | "failed" | "pending"
      activity_type:
        | "login"
        | "transaction"
        | "kyc"
        | "profile_update"
        | "password_change"
      alert_severity: "info" | "warning" | "critical"
      alert_type: "large_transaction" | "low_balance" | "high_volume"
      dispute_status: "pending" | "resolved" | "rejected"
      fee_type_enum: "TRADING" | "SWAP" | "TRANSACTION"
      merchant_type: "individual" | "business" | "enterprise"
      merchant_verification_status: "pending" | "verified" | "rejected"
      notification_type: "info" | "success" | "warning" | "error"
      order_status: "active" | "completed" | "cancelled"
      order_type: "buy" | "sell"
      trade_status:
        | "pending_payment"
        | "paid"
        | "completed"
        | "disputed"
        | "cancelled"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "transfer"
        | "buy"
        | "sell"
        | "trade"
        | "referral_bonus"
        | "referral_commission"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
