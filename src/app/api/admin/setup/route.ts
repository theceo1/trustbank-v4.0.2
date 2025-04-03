import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('Starting admin setup process...');

    // Create a service role client for admin operations
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Service client created');

    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    console.log('Session cookie:', sessionCookie ? 'Found' : 'Not found');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session cookie found' }, { status: 401 });
    }

    // Try to decode the session JWT
    try {
      const parts = sessionCookie.split('.');
      if (parts.length < 2) {
        return NextResponse.json({ error: 'Invalid session token format' }, { status: 401 });
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('Decoded session payload:', payload);

      if (!payload.sub) {
        return NextResponse.json({ error: 'Invalid session token - no user ID' }, { status: 401 });
      }

      // Verify the user exists
      const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(payload.sub);
      
      if (userError || !userData.user) {
        console.error('Error verifying user:', userError);
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 });
      }

      console.log('User verified:', userData.user.email);
      const userId = payload.sub;

      // First check if admin role exists
      console.log('Checking for existing admin role...');
      let { data: existingRole, error: roleCheckError } = await serviceClient
        .from('admin_roles')
        .select('id')
        .eq('name', 'admin')
        .single();

      if (roleCheckError) {
        console.error('Error checking admin role:', roleCheckError);
      }

      console.log('Existing role:', existingRole);

      let roleId;

      if (!existingRole) {
        console.log('Creating new admin role...');
        // Create admin role if it doesn't exist
        const { data: newRole, error: roleError } = await serviceClient
          .from('admin_roles')
          .insert([
            {
              name: 'admin',
              permissions: ['all']
            }
          ])
          .select('id')
          .single();

        if (roleError) {
          console.error('Error creating admin role:', roleError);
          return NextResponse.json({ error: roleError.message }, { status: 500 });
        }

        console.log('New role created:', newRole);
        roleId = newRole.id;
      } else {
        roleId = existingRole.id;
      }

      console.log('Using role ID:', roleId);

      // Upsert the admin user entry
      console.log('Upserting admin user...');
      const { data: adminData, error: adminError } = await serviceClient
        .from('admin_users')
        .upsert([
          {
            user_id: userId,
            role_id: roleId,
            is_active: true
          }
        ], {
          onConflict: 'user_id'
        })
        .select();

      console.log('Admin user upsert result:', { data: adminData, error: adminError });

      if (adminError) {
        console.error('Error upserting admin user:', adminError);
        return NextResponse.json({ error: adminError.message }, { status: 500 });
      }

      // Update user's role in user_roles table
      console.log('Updating user_roles...');
      const { data: userRoleData, error: userRoleError } = await serviceClient
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'admin',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select();

      console.log('User role update result:', { data: userRoleData, error: userRoleError });

      if (userRoleError) {
        console.error('Error updating user_roles:', userRoleError);
        return NextResponse.json({ error: userRoleError.message }, { status: 500 });
      }

      // Update user's profile with admin role
      console.log('Updating user profile...');
      const { data: profileData, error: profileError } = await serviceClient
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      console.log('Profile update result:', { data: profileData, error: profileError });

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      // Update user's metadata in auth.users
      console.log('Updating user metadata...');
      const { data: metadataData, error: metadataError } = await serviceClient.auth.admin.updateUserById(
        userId,
        {
          app_metadata: {
            role: 'admin',
            is_admin: true,
            permissions: ['all']
          },
          user_metadata: {
            role: 'admin',
            is_admin: true
          }
        }
      );

      console.log('Metadata update result:', { data: metadataData, error: metadataError });

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        return NextResponse.json({ error: metadataError.message }, { status: 500 });
      }

      // Invalidate user's session to force a refresh of their role
      console.log('Invalidating user session...');
      const { error: signOutError } = await serviceClient.auth.admin.signOut(userId);

      if (signOutError) {
        console.error('Error signing out user:', signOutError);
        // Don't return error here as the role updates were successful
      }

      console.log('Admin setup completed successfully');

      return NextResponse.json({
        success: true,
        message: 'Admin role and user created/updated successfully. Please log out and log back in to apply changes.'
      });
    } catch (decodeError) {
      console.error('Error decoding session token:', decodeError);
      return NextResponse.json({ error: 'Invalid session token format' }, { status: 401 });
    }
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 