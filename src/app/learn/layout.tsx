import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trading Academy",
  description: "Learn the fundamentals of cryptocurrency trading and investment strategies.",
}

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 