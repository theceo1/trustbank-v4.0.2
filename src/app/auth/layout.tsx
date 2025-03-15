import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - trustBank",
  description: "Authentication pages for trustBank",
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