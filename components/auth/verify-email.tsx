"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Mail, CheckCircle2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface VerifyEmailProps {
  email?: string
}

export function VerifyEmail({ email }: VerifyEmailProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verified, setVerified] = useState(false)
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(async ({ data }: { data: { user: SupabaseUser | null } }) => {
      const u = (data as any)?.user ?? null
      setUser(u)
      if (u?.email_confirmed_at) {
        setVerified(true)
      } else if (!u && email) {
        // Not signed in yet; start polling for post-verification session
        startPolling()
      }
    })

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
      if (session?.user?.email_confirmed_at) {
        setVerified(true)
        stopPolling()
      }
    })

    const subscription = (data as any)?.subscription ?? data

    return () => {
      subscription?.unsubscribe?.()
      stopPolling()
    }
  }, [])

  const startPolling = () => {
    if (pollRef.current) return
    setPolling(true)
    const supabase = createClient()
    pollRef.current = setInterval(async () => {
      const { data }: { data: { user: SupabaseUser | null } } = await supabase.auth.getUser()
      const u = (data as any)?.user ?? null
      if (u?.email_confirmed_at) {
        setUser(u)
        setVerified(true)
        stopPolling()
      }
    }, 3000) // poll every 3s
    // Safety timeout 2 minutes
    setTimeout(() => stopPolling(), 120000)
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setPolling(false)
  }

  const userEmail = email || user?.email || "your email"

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)

    try {
      const supabase = createClient()
      
      // Resend verification email via signup with same email
      const userEmailToUse = user?.email || email || ""
      
      if (!userEmailToUse) {
        throw new Error("No email found")
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmailToUse,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox (and spam) for the verification link.",
      })

      // Set cooldown to prevent spam
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error?.message || "Could not resend verification email.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleContinue = () => {
    router.push("/home")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {verified ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <Mail className="w-8 h-8 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-display">{verified ? "Email Verified" : "Verify Your Email"}</CardTitle>
          <CardDescription>
            {verified ? (
              <span>Your email <strong>{userEmail}</strong> has been verified. Redirecting...</span>
            ) : (
              <span>We've sent a verification link to <strong>{userEmail}</strong></span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!verified && (
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Check your inbox</p>
                <p>Click the verification link in the email we sent you.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Check spam folder</p>
                <p>If you don't see the email, check your spam or junk folder.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Link expires in 24 hours</p>
                <p>Make sure to verify your email within 24 hours.</p>
              </div>
            </div>
          </div>
          )}

          <div className="space-y-3">
            {!verified && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0 || !email}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}

            <Button type="button" variant={verified ? "default" : "ghost"} className="w-full" onClick={handleContinue}>
              {verified ? "Go to Dashboard" : "Continue to Dashboard"}
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            <p>
              Need help?{" "}
              <a href="/support" className="text-primary hover:underline">
                Contact Support
              </a>
            </p>
            {polling && !verified && <p className="mt-2">Waiting for verification... (auto refresh)</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

