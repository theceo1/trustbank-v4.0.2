import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types'

// Client-side Supabase instance
export const supabase = createClientComponentClient<Database>();

// Server-side Supabase instance
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type Json =
  | string
  | number
  | boolean
  | null
 