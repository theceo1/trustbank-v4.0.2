import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - TrustBank",
  description: "Authentication pages for TrustBank",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  )
} 