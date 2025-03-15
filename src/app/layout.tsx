import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css"
import { Metadata } from "next"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/lib/providers/supabase-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/providers/LanguageProvider"

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
      name: "trustBank",
      url: "https://trustbank.tech",
    },
  ],
  creator: "trustBank",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        GeistSans.variable,
        GeistMono.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
