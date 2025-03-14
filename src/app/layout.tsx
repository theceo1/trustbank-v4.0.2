import { Inter } from "next/font/google"
import "./globals.css"
import { Metadata } from "next"
import { ThemeProvider } from "@/components/ThemeProvider"
import SupabaseProvider from "@/lib/providers/supabase-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Toaster } from "sonner"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/providers/LanguageProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "trustBank - CRYPTO | SIMPLIFIED",
    template: "%s | trustBank",
  },
  description:
    "A secure and user-friendly cryptocurrency exchange platform for global emerging markets.",
  keywords: [
    "cryptocurrency",
    "exchange",
    "bitcoin",
    "ethereum",
    "trading",
    "crypto",
    "blockchain",
  ],
  authors: [
    {
      name: "TrustBank",
      url: "https://trustbank.tech",
    },
  ],
  creator: "TrustBank",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: async () => cookieStore 
  })
  
  const { data: { session } } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseProvider>
            <AuthProvider initialSession={user}>
              <LanguageProvider>
                <Header />
                {children}
                <Footer />
                <Toaster />
              </LanguageProvider>
            </AuthProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
