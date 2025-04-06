import React from 'react';
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
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: {
    default: 'trustBank - CRYPTO | SIMPLIFIED.',
    template: '%s | '
  },
  description: 'simplifying crypto adoption in emerging markets.',
  keywords: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'trading', 'exchange', 'wallet', 'blockchain', 'trustBank', 'trustbank', 'trust bank tech', 'trust bank crypto', 'trust bank cryptocurrency', 'trust bank exchange'],
  authors: [{ name: 'trustBank' }],
  creator: 'trustBank',
  publisher: 'trustBank',
  robots: {
    index: true,
    follow: true
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#16A34A'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Get the current pathname from headers
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased overflow-x-hidden',
        GeistSans.variable,
        GeistMono.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalErrorBoundary>
            <AuthProvider initialSession={null}>
              <SupabaseProvider>
                <ProfileProvider>
                  <LanguageProvider>
                    {isAdminRoute ? (
                      children
                    ) : (
                      <div className="flex min-h-screen flex-col">
                        <Header />
                        <main className="flex-1">
                          {children}
                        </main>
                        <Footer />
                        <Toaster />
                      </div>
                    )}
                  </LanguageProvider>
                </ProfileProvider>
              </SupabaseProvider>
            </AuthProvider>
          </GlobalErrorBoundary>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
