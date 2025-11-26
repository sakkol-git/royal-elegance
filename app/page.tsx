"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { PremiumHeroSection } from "@/components/landing/premium-hero-section"
import SEO from "@/components/ui/SEO"
import Loading from "@/components/ui/loading"

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Prevent multiple auth checks
    if (authChecked) return

    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Get user role from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          const role = profile?.role || 'user'

          // Redirect based on role
          if (role === 'admin') {
            router.replace('/admin')
          } else if (role === 'staff') {
            router.replace('/staff')
          } else {
            router.replace('/home')
          }
          return
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [router, authChecked])

  if (loading) {
    return <Loading message="Loading..." size="lg" />
  }

  return (
      <>
        <SEO
          title="Royal Elegance Luxury Hotel"
          description="A historic landmark hotel offering unparalleled luxury and service since 1929. Book your stay and experience true elegance."
          ogTitle="Royal Elegance Luxury Hotel"
          ogDescription="Unparalleled luxury and service since 1929."
          ogImage="/logo.png"
        />
        <div className="min-h-screen">
          <PremiumNavbar />
          <PremiumHeroSection />

        </div>
      </>
  )
}
