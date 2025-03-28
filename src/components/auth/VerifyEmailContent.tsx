'use client'

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

function VerifyEmailForm() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!params) {
          throw new Error("No search parameters found")
        }

        const token = params.get("token")
        const type = params.get("type")

        if (!token || !type) {
          throw new Error("Missing verification parameters")
        }

        const supabase = createClientComponentClient()
        
        if (type === "signup") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "signup",
          })
          if (error) throw error
        } else if (type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "recovery",
          })
          if (error) throw error
        }

        setIsSuccess(true)
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified.",
        })
      } catch (error) {
        console.error("Error verifying email:", error)
        setIsSuccess(false)
        toast({
          title: "Verification failed",
          description: error instanceof Error ? error.message : "Failed to verify email. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [params, toast])

  const handleContinue = () => {
    router.push(isSuccess ? "/auth/login" : "/auth/signup")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Mail className="h-6 w-6 text-green-600" />
            Email Verification
          </CardTitle>
          <CardDescription>
            {isVerifying
              ? "Please wait while we verify your email..."
              : isSuccess
              ? "Your email has been successfully verified"
              : "Email verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            {isVerifying ? (
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            ) : isSuccess ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
            
            <p className="text-center text-sm text-muted-foreground">
              {isVerifying
                ? "Verifying your email address..."
                : isSuccess
                ? "You can now log in to your account"
                : "Please try the verification process again"}
            </p>
          </div>

          {!isVerifying && (
            <Button
              onClick={handleContinue}
              className="w-full bg-green-600 hover:bg-green-500 text-white"
            >
              {isSuccess ? "Continue to Login" : "Back to Sign Up"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function VerifyEmailContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  )
} 