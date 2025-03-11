import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export const runtime = 'edge';

export async function getServerSupabase() {
  return createServerComponentClient<Database>({
    cookies
  });
} 