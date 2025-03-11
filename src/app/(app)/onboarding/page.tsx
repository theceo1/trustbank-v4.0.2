import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OnboardingPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  const { data: { user }, error: supabaseError } = await supabase.auth.getUser()

  if (supabaseError || !user) {
    redirect('/auth/login')
  }

  // Check if user already has a profile with Quidax ID
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (userProfile?.quidax_id) {
    redirect('/profile/wallet')
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-2 text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Complete Your Registration</h1>
          <p className="text-sm text-muted-foreground">
            Please provide the following information to set up your trading account.
          </p>
        </div>
        <OnboardingForm user={user} />
      </div>
    </div>
  )
} 