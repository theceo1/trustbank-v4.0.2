import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, isTest } = await request.json();

    if (isTest) {
      // Create a test user
      const testEmail = `test_${Date.now()}@example.com`;
      const testPassword = 'Test123!@#';

      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Sign up the test user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      });

      if (signUpError) {
        console.error('Error creating test user:', signUpError);
        return NextResponse.json(
          { error: 'Failed to create test user' },
          { status: 500 }
        );
      }

      // Sign in to get the session
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (signInError || !session) {
        console.error('Error signing in test user:', signInError);
        return NextResponse.json(
          { error: 'Failed to sign in test user' },
          { status: 500 }
        );
      }

      // Return the access token
      return NextResponse.json({
        access_token: session.access_token,
        user: {
          id: user?.id,
          email: testEmail
        }
      });
    }

    // Regular login flow
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 