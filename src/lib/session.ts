import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function getSession() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    console.log('Available cookies:', cookieStore.getAll().map(c => c.name));

    // Try to get session from cookie first
    const sessionCookie = cookieStore.get('sb-session');
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        console.log('Found session in cookie:', { 
          userId: sessionData?.user?.id,
          email: sessionData?.user?.email
        });
        return { data: { session: sessionData }, error: null };
      } catch (e) {
        console.error('Error parsing session cookie:', e);
      }
    }

    // Fallback to Supabase getSession
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session check:', {
      hasSession: !!session,
      error,
      userId: session?.user?.id,
      email: session?.user?.email
    });

    return { data: { session }, error };
  } catch (error) {
    console.error('Error in getSession:', error);
    return { data: { session: null }, error };
  }
} 