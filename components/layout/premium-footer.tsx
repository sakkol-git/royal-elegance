"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Phone, Mail, MapPin, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PremiumFooter() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data }: { data: { user: SupabaseUser | null } } = await supabase.auth.getUser()
        const u = (data as any)?.user ?? null
        setUser(u)
      } catch (e) {
        // ignore
      }
    }
    getUser()

    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })
    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [supabase])

  return (
  <footer className="bg-slate-800 text-slate-200 bottom-0">
      <div className="hidden lg:block border-b border-white/5 py-6">
        <div className="container mx-auto px-4 flex justify-between items-start gap-8">
          <div className="max-w-lg">
            {/* Official logo — replace older plain-text header */}
            <Link href={user ? "/home" : "/"} className="relative z-50 flex flex-col items-start group">
              <span className={`text-white text-xl font-display font-semibold tracking-widest transition-colors duration-300`}>
                ROYAL
                <span className={`ml-1 bg-slate-800 px-2 transition-colors duration-300 text-[#d4af37]`}>
                  ELEGANCE
                </span>
              </span>
              <span className={`text-[9px] sm:text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 text-white/60`}>
                Luxury Hotel & Residences
              </span>
            </Link>
            <p className="text-sm text-slate-400 mt-2">Luxury Hotel & Spa — Experience exceptional stays and curated services. Located in the heart of the city.</p>
            <div className="flex items-center gap-4 mt-4 text-slate-300">
              <a href="https://maps.google.com/?q=Royal+Elegance+Hotel" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#d4af37]">
                <MapPin className="w-4 h-4 text-[#d4af37]" /> <span className="text-sm">123 Luxury Avenue</span>
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-[#d4af37]">
                <Phone className="w-4 h-4 text-[#d4af37]" /> <span className="text-sm">+1 (234) 567-890</span>
              </a>
              <a href="mailto:reservations@hotel.com" className="flex items-center gap-2 hover:text-[#d4af37]">
                <Mail className="w-4 h-4 text-[#d4af37]" /> <span className="text-sm">reservations@hotel.com</span>
              </a>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm text-white font-medium mb-3 uppercase tracking-wider">Explore</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/rooms" className="hover:text-[#d4af37]">Rooms & Suites</Link></li>
                <li><Link href="/services" className="hover:text-[#d4af37]">Experiences</Link></li>
                <li><Link href="/bookings" className="hover:text-[#d4af37]">My Reservations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm text-white font-medium mb-3 uppercase tracking-wider">Support</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/contact" className="hover:text-[#d4af37]">Contact</Link></li>
                <li><Link href="/payment" className="hover:text-[#d4af37]">Payment</Link></li>
                <li><Link href="/profile" className="hover:text-[#d4af37]">Account</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm text-white font-medium mb-3 uppercase tracking-wider">Reservations</h4>
              <div className="space-y-3">
                <Link href="/rooms" className="block">
                  <Button size="sm" className="bg-[#d4af37] text-black hover:bg-white hover:text-black px-4">Reserve a Room</Button>
                </Link>
                <div className="text-sm text-slate-400 mt-2">{user ? (<span>Signed in as <strong>{user.email}</strong></span>) : (<Link href="/auth/login" className="text-[#d4af37] hover:underline">Sign In</Link>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile compact footer */}
      <div className="lg:hidden py-6 border-t border-white/5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#d4af37]" />
            <div className="text-sm">
              <div className="text-white font-medium">
                <span className="font-display tracking-widest text-sm">ROYAL</span>
                <span className="ml-1 bg-slate-800 px-1 text-[#d4af37] ml-2">ELEGANCE</span>
              </div>
              <div className="text-slate-400 text-xs">123 Luxury Avenue</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="tel:+1234567890" className="text-slate-300 hover:text-[#d4af37]"><Phone className="w-5 h-5" /></a>
            <a href="mailto:reservations@hotel.com" className="text-slate-300 hover:text-[#d4af37]"><Mail className="w-5 h-5" /></a>
            <Link href="/rooms" className="text-[#d4af37] flex items-center gap-1"><span className="text-sm">Book</span> <ChevronRight className="w-4 h-4"/></Link>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-slate-500">
        © {new Date().getFullYear()} Royal Elegance Hotel — All rights reserved.
      </div>
    </footer>
  )
}
