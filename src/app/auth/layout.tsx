import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - trustBank - CRYPTO | SIMPLIFIED.",
  description: "Authentication pages for trustBank - CRYPTO | SIMPLIFIED.",
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