"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, Suspense, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Hotel, Star, Shield, Users, TrendingUp, Quote, CheckCircle2 } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // 1. Handle Toast Notifications
  useEffect(() => {
    const verified = searchParams.get('verified')
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (verified === 'true') {
      toast({
        title: "Email Verified",
        description: "Your account has been successfully verified.",
        action: <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
      })
    } else if (error) {
      const errorMap: Record<string, string> = {
        timeout: "Authentication timed out. Please try again.",
        auth_failed: message ? decodeURIComponent(message) : "Authentication failed",
        no_auth_code: "Invalid verification link.",
        exchange_failed: "Failed to complete authentication.",
        session_failed: "Failed to establish session.",
        no_session: "Authentication succeeded but session failed."
      }

      toast({
        title: "Access Denied",
        description: errorMap[error] || (message ? decodeURIComponent(message) : "An unknown error occurred."),
        variant: "destructive"
      })
    }
  }, [searchParams, toast])

  // 2. Data for Visual Side
  const testimonials = [
    {
      quote: "The booking experience was seamless. Best hotel platform I've used!",
      author: "Sarah Johnson",
      role: "Verified Guest",
      rating: 5
    },
    {
      quote: "Exceptional service and easy-to-use interface. Highly recommended!",
      author: "Michael Chen",
      role: "Business Traveler",
      rating: 5
    },
  ]

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const stats = [
    { icon: Users, label: "Guests", value: "50K+" },
    { icon: Star, label: "Rating", value: "4.9" },
    { icon: TrendingUp, label: "Growth", value: "200%" },
  ]

  return (
    <main className="min-h-screen w-full flex bg-gradient-to-br from-background via-accent/5 to-background">
      
      {/* LEFT SIDE: Form Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] space-y-8"
        >
          {/* Mobile Logo (Official) */}
          <div className="flex justify-center lg:justify-start">
            {/* Logo links to home for unauthenticated pages to avoid referencing undefined `user` */}
            <Link href="/" className="relative z-50 flex flex-col items-start group">
              <span className={`text-xl sm:text-2xl font-display font-bold tracking-widest transition-colors duration-300 text-slate-900`}>
                ROYAL
                <span className={`ml-1 bg-slate-800 px-2 transition-colors duration-300 text-[#d4af37]`}>
                  ELEGANCE
                </span>
              </span>
              <span className={`text-[9px] sm:text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 text-slate-500`}>
                Luxury Hotel & Residences
              </span>
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-slate-500">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Login Form Component */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <LoginForm
              redirectTo={searchParams.get('next') || '/home'}
              onForgotPassword={() => router.push("/auth/reset-password")}
              onSwitchToSignUp={() => router.push(`/auth/signup?next=${encodeURIComponent(searchParams.get('next') || '/home')}`)}
            />
          </div>

          {/* Footer / Trust Badges */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 text-xs text-slate-400">
               <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Secure Connection</span>
               <span className="w-1 h-1 rounded-full bg-slate-300" />
               <span className="flex items-center gap-1.5"><Star className="w-3 h-3" /> Official Site</span>
            </div>
            
            <p className="px-8 text-center text-xs text-slate-400">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Visual Experience (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
           {/* Replace src with your actual image path */}
           <Image 
             src="https://images.pexels.com/photos/8192323/pexels-photo-8192323.jpeg?_gl=1*fftdfp*_ga*MTY4NjM2ODA2MC4xNzY0MjIyNjU0*_ga_8JE65Q40S6*czE3NjQyMjI2NTMkbzEkZzEkdDE3NjQyMjI3MjMkajU5JGwwJGgw" 
             alt="Luxury Hotel Lobby"
             fill
             className="object-cover opacity-60"
             priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-slate-800/50 to-transparent" />
      </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-end p-16 w-full h-full text-white space-y-12">
          
          {/* Testimonial Slider */}
          <div className="space-y-6 max-w-lg">
            <Quote className="w-10 h-10 text-[#d4af37] opacity-80" />
            <div className="h-32 relative">
              <AnimatePresence>
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <p className="text-2xl font-light leading-relaxed mb-4">
                    "{testimonials[currentTestimonial].quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-lg">{testimonials[currentTestimonial].author}</p>
                    <div className="flex items-center gap-2 text-[#d4af37] text-sm">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                      <span className="text-slate-400 ml-2">• {testimonials[currentTestimonial].role}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium uppercase tracking-wider">
                  <stat.icon className="w-4 h-4 text-[#d4af37]" />
                  {stat.label}
                </div>
                <div className="text-3xl font-bold font-display">{stat.value}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-slate-200 rounded-lg mb-4" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}