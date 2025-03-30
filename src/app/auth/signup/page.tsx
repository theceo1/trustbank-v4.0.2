// src/app/auth/signup/page.tsx
"use client"

import { Suspense } from 'react'
import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}