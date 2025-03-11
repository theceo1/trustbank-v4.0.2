import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

export default async function MarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore 
    })
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      redirect('/auth/login')
    }

    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  } catch (error) {
    console.error('Error in market layout:', error)
    redirect('/auth/login')
  }
} 