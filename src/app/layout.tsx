import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css"
import { Metadata } from "next"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/lib/providers/supabase-provider"
import { ProfileProvider } from "@/app/contexts/ProfileContext"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/providers/LanguageProvider"

export const metadata: Metadata = {
  title: {
    default: "trustBank - CRYPTO | SIMPLIFIED",
    template: "%s | trustBank",
  },
  description:
    "A simple and secure cryptocurrency ecosystem for emerging markets.",
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

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
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
            <ProfileProvider>
              <LanguageProvider>
                <Header />
                {children}
                <Footer />
                <Toaster />
              </LanguageProvider>
            </ProfileProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
