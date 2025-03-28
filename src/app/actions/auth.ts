'use server'

import { createQuidaxServer } from '@/lib/quidax'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createUserAccount(data: {
  email: string
  firstName: string
  lastName: string
  password: string
}) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const quidax = createQuidaxServer(process.env.QUIDAX_SECRET_KEY || '')

    // 1. Create Supabase user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    })

    if (authError) throw authError

    // 2. Create Quidax sub-account
    const quidaxUser = await quidax.createSubAccount(
      data.email,
      data.firstName,
      data.lastName
    )

    // 3. Update user profile with Quidax ID
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          quidax_id: quidaxUser.id,
          quidax_sn: quidaxUser.sn,
        })
        .eq('user_id', authData.user.id)

      if (profileError) throw profileError
    }

    return { success: true }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to create account' 
    }
  }
} 