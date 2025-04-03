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
      admin_roles: {
        Row: {
          id: string
          name: string
          permissions: Json[]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          permissions: Json[]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          permissions?: Json[]
          created_at?: string | null
          updated_at?: string | null
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role_id: string
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      admin_profiles: {
        Row: {
          id: string
          user_id: string | null
          email: string
          role: string
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          role: string
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          role?: string
          is_active?: boolean | null
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