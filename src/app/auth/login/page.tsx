"use client"

import { Suspense } from 'react'
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
} 