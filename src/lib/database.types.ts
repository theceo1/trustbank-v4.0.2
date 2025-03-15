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
          created_at: string
          email: string
          source: string
          preferences: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          source: string
          preferences?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          source?: string
          preferences?: Json
          metadata?: Json
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