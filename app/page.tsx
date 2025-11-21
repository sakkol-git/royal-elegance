"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { PremiumHeroSection } from "@/components/landing/premium-hero-section"
import SEO from "@/components/ui/SEO"

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
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

          {/* Premium Footer */}
          <footer className="bg-slate-900 text-white py-16">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-8 mb-12">
                <div>
                  <h3 className="text-xl font-display font-semibold mb-4">ROYAL ELEGANCE</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    A historic landmark hotel offering unparalleled luxury and service since 1929.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm uppercase tracking-wider mb-4 text-slate-400">Quick Links</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/rooms" className="hover:text-primary transition-colors">Rooms & Suites</a></li>
                    <li><a href="/services" className="hover:text-primary transition-colors">Experiences</a></li>
                    <li><a href="/bookings" className="hover:text-primary transition-colors">Reservations</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm uppercase tracking-wider mb-4 text-slate-400">Contact</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>123 Luxury Avenue</li>
                    <li>Historic District</li>
                    <li>+1 (234) 567-890</li>
                    <li>reservations@hotel.com</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm uppercase tracking-wider mb-4 text-slate-400">Follow Us</h4>
                  <div className="flex gap-4">
                    <a href="#" className="text-slate-400 hover:text-primary transition-colors">Instagram</a>
                    <a href="#" className="text-slate-400 hover:text-primary transition-colors">Facebook</a>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-400">
                <p>&copy; 2025 Royal Elegance Luxury Hotel. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </>
  )
}
