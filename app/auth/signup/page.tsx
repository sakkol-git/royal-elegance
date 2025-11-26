"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Hotel, Check, Sparkles, Globe, Clock, Heart, ArrowRight } from "lucide-react"
import { SignUpForm } from "@/components/auth/signup-form"
import { Separator } from "@/components/ui/separator"

export default function SignUpPage() {
  const router = useRouter()
  
  const benefits = [
    {
      icon: Sparkles,
      title: "Exclusive Deals",
      description: "Access members-only rates."
    },
    {
      icon: Clock,
      title: "Fast Booking",
      description: "One-click reservations."
    },
    {
      icon: Heart,
      title: "Personalized",
      description: "Tailored stay preferences."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Luxury in 150+ countries."
    },
  ]

  const features = [
    "Instant booking confirmation",
    "24/7 customer support",
    "Flexible cancellation",
    "Loyalty rewards program",
  ]

  return (
    <main className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
      
      {/* LEFT SIDE: Visuals & Benefits (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image 
            src="/luxury-hotel-lobby.png" // Ensure this image exists in your public folder
            alt="Luxury Hotel Lobby"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between p-16 h-full w-full max-w-2xl mx-auto">
          {/* Top: Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Hotel className="w-6 h-6 text-[#d4af37]" />
            </div>
            <span className="text-xl font-display font-bold tracking-widest text-white">
              ROYAL<span className="text-[#d4af37]">ELEGANCE</span>
            </span>
          </div>

          {/* Middle: Value Proposition */}
          <div className="space-y-10">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-display font-light leading-tight mb-4"
              >
                Join the <span className="font-semibold text-[#d4af37]">Elite Circle</span> of Travelers
              </motion.h1>
              <p className="text-slate-300 text-lg font-light">
                Create an account to unlock a world of bespoke luxury and exclusive privileges.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (index * 0.1), duration: 0.5 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <benefit.icon className="w-6 h-6 text-[#d4af37] mb-3" />
                  <h3 className="font-medium text-white mb-1">{benefit.title}</h3>
                  <p className="text-sm text-slate-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom: Trust List */}
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-slate-400 font-medium">Membership Includes</p>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-[#d4af37]" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Sign Up Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10 bg-white dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg">
                <Hotel className="w-5 h-5 text-[#d4af37]" />
              </div>
              <span className="text-xl font-display font-bold text-slate-900">
                ROYAL<span className="text-[#d4af37]">ELEGANCE</span>
              </span>
            </Link>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h2>
            <p className="text-slate-500">
              Enter your details below to create your account and start your journey.
            </p>
          </div>

          {/* Mobile-only Value Banner */}
          <div className="lg:hidden p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900">Join 50,000+ Travelers</p>
              <p className="text-xs text-amber-700">Get instant access to exclusive deals and member rates.</p>
            </div>
          </div>

          {/* The Form */}
          <div className="bg-white p-0 lg:p-0">
            <SignUpForm onSwitchToLogin={() => router.push("/auth/login")} />
          </div>

          <Separator className="my-6" />

          <p className="text-center text-xs text-slate-400 px-6">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-slate-900">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-900">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </main>
  )
}