"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, Phone, Mail, User, Calendar, MapPin, ChevronRight, Home, Bed, Gift } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function PremiumNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const pathname = usePathname()
  const supabase = createClient()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle user session
  useEffect(() => {
    const getUser = async () => {
      const { data }: { data: { user: SupabaseUser | null } } = await supabase.auth.getUser()
      const u = (data as any)?.user ?? null
      setUser(u)
    }
    getUser()

    const { data } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        setUser(session?.user ?? null)
      }
    )

    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [supabase])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  // Close on Escape and focus management when opening mobile menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      window.addEventListener('keydown', onKey)
      // focus the first menu item for keyboard users
      setTimeout(() => firstLinkRef.current?.focus(), 50)
    }
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen])

  const navLinks = [
    { href: user ? "/home" : "/", label: "Home", Icon: Home },
    { href: "/rooms", label: "Rooms & Suites", Icon: Bed },
    { href: "/services", label: "Experiences", Icon: Gift },
    { href: "/bookings", label: "My Reservations", Icon: Calendar },
  ]

  return (
    <>
      {/* 
        TOP BAR 
        Hidden on mobile, visible on lg screens and up for a cleaner mobile look.
        Used Slate-950 for deeper contrast.
      */}
  <div className="hidden lg:block bg-slate-800 text-slate-300 py-2.5 px-4 text-[11px] uppercase tracking-wider font-medium border-b border-white/5 relative z-[60]">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-8">
            <a href="https://maps.google.com/?q=Royal+Elegance+Hotel" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#d4af37] transition-colors duration-300">
              <MapPin className="w-3 h-3 text-[#d4af37]" />
              <span>123 Luxury Avenue, Downtown</span>
            </a>
            <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-[#d4af37] transition-colors duration-300">
              <Phone className="w-3 h-3 text-[#d4af37]" />
              <span>+1 (234) 567-890</span>
            </a>
            <a href="mailto:reservations@hotel.com" className="flex items-center gap-2 hover:text-[#d4af37] transition-colors duration-300">
              <Mail className="w-3 h-3 text-[#d4af37]" />
              <span>reservations@hotel.com</span>
            </a>
          </div>
          <div className="flex gap-6 items-center">
            {user ? (
              <>
                <Link href="/profile" className="hover:text-[#d4af37] transition-colors flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>My Account</span>
                </Link>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = "/"
                  }} 
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (<div className="flex flex-row gap-2">
              <Link href="/auth/login" className="hover:text-[#d4af37] transition-colors">
                Sign In 
              </Link>
              |
              <Link href="/auth/signup" className="hover:text-[#d4af37] transition-colors">
                Register
              </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        MAIN NAVBAR 
        Using `h-[var]` to prevent layout shifts.
        Added a subtle gradient border at the bottom when scrolled.
      */}
      <nav
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b ${
          scrolled
            ? "top-0 bg-slate-900/80 backdrop-blur-md border-white/10 shadow-lg py-2"
            : "top-0 lg:top-[38px] bg-transparent border-transparent py-4 lg:py-6"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            
            {/* Logo Section */}
            <Link href={user ? "/home" : "/"} className="relative z-50 flex flex-col items-start group">
              <span className={`text-xl sm:text-2xl font-display font-bold tracking-widest transition-colors duration-300 text-white
              }`}>
                ROYAL
                <span className={`ml-1 bg-slate-800 px-2 transition-colors duration-300 text-[#d4af37]`}>
                  ELEGANCE
                </span>
              </span>
              <span className={`text-[9px] sm:text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 text-white/60
              }`}>
                Luxury Hotel & Residences
              </span>
            </Link>

            {/* Desktop Navigation - Centered */}
            <div className="hidden lg:flex items-center gap-8 xl:gap-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[16px] font-medium tracking-[0.15em] uppercase transition-all duration-300 relative py-2 group ${
                    pathname === link.href
                      ? (scrolled ? "text-[#d4af37]" : "text-black")
                      : (scrolled ? "text-white/90 hover:text-white" : "text-white/90 hover:text-white")
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300 ${
                    pathname === link.href
                      ? (scrolled ? "w-full bg-[#d4af37]" : "w-full bg-black")
                      : "w-0 bg-[#d4af37] group-hover:w-full"
                  }`} />
                </Link>
              ))}
            </div>

            {/* Right Actions (Desktop) */}
            <div className="hidden lg:flex items-center gap-6">
                <Link href="/rooms">
                  <Button
                    size="sm"
                    className="bg-[#d4af37] text-black hover:bg-white hover:text-black border border-radius-0 border-transparent hover:border-white/20 transition-all duration-300 font-medium tracking-wide px-6"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative z-50 p-2 text-white hover:text-[#d4af37] transition-colors focus:outline-none"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <div className="space-y-1.5">
                  <span className="block w-6 h-0.5 bg-current"></span>
                  <span className="block w-6 h-0.5 bg-current"></span>
                  <span className="block w-4 h-0.5 bg-current ml-auto"></span>
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 
        MOBILE MENU OVERLAY 
        Full screen takeover with premium dark styling.
      */}
      <div
        className={`fixed inset-0 z-40 lg:hidden bg-slate-800/95 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div className="flex flex-col h-full pt-24 px-4 pb-6" onClick={(e) => e.stopPropagation()} ref={menuRef}>
          {/* Mobile Links (full-width buttons) */}
          <div className="flex flex-col gap-3 items-stretch justify-start flex-1">
            {navLinks.map((link, index) => {
              const Icon = (link as any).Icon as any
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  tabIndex={0}
                  ref={index === 0 ? firstLinkRef : undefined}
                  className={`w-full flex items-center gap-3 text-left text-lg font-medium transition-all duration-150 py-4 px-4 rounded-md ${
                    pathname === link.href ? 'bg-white/5 text-[#d4af37]' : 'text-white hover:bg-white/5 hover:text-[#d4af37]'
                  }`}
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  {Icon && <Icon className="w-5 h-5 text-white/90" />}
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile Footer Actions */}
          <div className="space-y-4 mt-auto max-w-sm mx-auto w-full">
            <Link href="/rooms" className="block w-full">
              <Button className="w-full bg-[#d4af37] text-black hover:bg-white hover:text-black h-14 text-sm tracking-widest uppercase shadow-lg">
                Reserve Your Stay
              </Button>
            </Link>

            <div className="flex flex-col gap-3 items-center mt-2">
              {user ? (
                <>
                  <Link href="/profile" className="w-full text-center py-3 rounded-md bg-white/5 text-white hover:text-[#d4af37] transition-colors">My Account</Link>
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/" }} className="w-full py-3 rounded-md bg-transparent border border-white/5 text-white hover:text-[#d4af37] transition-colors">Sign Out</button>
                </>
              ) : (
                <Link href="/auth/login" className="w-full text-center py-3 rounded-md bg-transparent border border-white/5 text-white hover:bg-white/5 hover:text-[#d4af37] transition-colors">Sign In / Register</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}