import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export const getSupabaseClient = async () => {
  const supabase = createClientComponentClient<Database>();
  return supabase;
};