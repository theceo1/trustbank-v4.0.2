'use client'

import { Suspense } from 'react'
import { VerifyEmailContent } from '@/components/auth/VerifyEmailContent'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
} 