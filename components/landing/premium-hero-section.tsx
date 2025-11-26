"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Award, Sparkles, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function PremiumHeroSection() {
  const introSection = useScrollAnimation({ threshold: 0.1 })
  const statsSection = useScrollAnimation({ threshold: 0.1 })
  const roomsSection = useScrollAnimation({ threshold: 0.1 })
  const diningSection = useScrollAnimation({ threshold: 0.15 })
  const experiencesSection = useScrollAnimation({ threshold: 0.1 })
  const finalCtaSection = useScrollAnimation({ threshold: 0.15 })

  return (
    <>
      {/* 
        HERO SECTION 
        Best Practice: Use `min-h-[100dvh]` instead of `h-screen` to handle 
        mobile browser address bars correctly on iOS/Android.
      */}
      <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden supports-[min-height:100dvh]:min-h-[100dvh]">
        {/* Background - Note: bg-fixed is often disabled on mobile OS for performance. 
            Consider media queries to disable it on touch devices if scroll feels jittery. */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/luxury-hotel-lobby.png')] bg-cover bg-center bg-no-repeat bg-fixed" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-950/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Animated Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Floating Accents - Hidden on small mobile to save GPU resources */}
        <div className="hidden sm:block absolute top-20 left-10 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse" />
        <div className="hidden sm:block absolute bottom-20 right-10 w-80 h-80 bg-[#d4af37]/3 rounded-full blur-3xl animate-pulse animation-delay-1000" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center h-full py-20">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-6 py-2 sm:px-8 sm:py-3 rounded-full glass mb-6 sm:mb-8 animate-fade-in-scale border border-white/20 backdrop-blur-md bg-white/5">
            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse" />
            <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#d4af37]" />
            <span className="text-[10px] sm:text-xs text-white tracking-[0.2em] uppercase font-light whitespace-nowrap">Est. 1929 • Heritage</span>
            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse" />
          </div>

          {/* 
            Main Heading 
            Best Practice: Fluid typography using breakpoints.
            `text-balance` ensures the two lines are roughly equal width (prevents orphans).
          */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-light mb-6 sm:mb-8 text-white leading-[1.1] tracking-tight animate-fade-in-up drop-shadow-2xl text-balance">
            YOUR HISTORIC SANCTUARY
            <br />
            <span className="font-semibold text-transparent bg-gradient-to-r from-white via-white to-[#d4af37] bg-clip-text">
              OF TIMELESS ELEGANCE
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-white/85 mb-8 sm:mb-12 max-w-xl md:max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200 font-light drop-shadow-lg px-4">
            Where centuries of heritage embrace contemporary refinement. 
            Discover an unparalleled sanctuary of sophistication.
          </p>

          {/* Accent Line */}
          <div className="flex items-center justify-center gap-4 mb-8 sm:mb-10 animate-fade-in-up animation-delay-300">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#d4af37]" />
            <span className="text-[#d4af37] text-[10px] sm:text-xs tracking-[0.15em] uppercase">Experience Excellence</span>
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>

          {/* CTA Buttons 
             Best Practice: `w-full sm:w-auto` allows buttons to stretch on phones 
             but sit side-by-side on tablets/desktops.
          */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto justify-center items-center animate-fade-in-up animation-delay-400 px-4 sm:px-0">
            <Link href="/rooms" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group text-sm px-8 sm:px-10 py-6 sm:py-8 rounded-sm bg-white text-slate-900 hover:bg-[#d4af37] border-2 border-white hover:border-[#d4af37] transition-all duration-300 shadow-lg">
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                RESERVE YOUR STAY
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/services" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto group text-sm px-8 sm:px-10 py-6 sm:py-8 rounded-sm bg-transparent text-white border-2 border-white/60 hover:bg-white hover:text-slate-900 hover:border-[#d4af37] transition-all duration-300 shadow-lg"
              >
                <Award className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                DISCOVER EXPERIENCES
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Info Bar - Stack on mobile, Grid on desktop */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white py-8 border-y border-[#d4af37]/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 divide-y md:divide-y-0 divide-white/10">
            <div className="flex items-center justify-center gap-4 group p-2 md:p-4 rounded-lg">
              <div className="p-3 rounded-full bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 transition-colors shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37]" />
              </div>
              <div className="text-left">
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-light">Location</div>
                <div className="text-sm font-light">Downtown Historic District</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 group p-2 md:p-4 pt-6 md:pt-4 rounded-lg">
              <div className="p-3 rounded-full bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 transition-colors shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37]" />
              </div>
              <div className="text-left">
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-light">Check-in / Out</div>
                <div className="text-sm font-light">3:00 PM / 12:00 PM</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 group p-2 md:p-4 pt-6 md:pt-4 rounded-lg">
              <div className="p-3 rounded-full bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 transition-colors shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37]" />
              </div>
              <div className="text-left">
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-light">Reservations</div>
                <div className="text-sm font-light">+1 (234) 567-890</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section - Responsive Padding */}
      <section 
        ref={introSection.ref}
        className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden"
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`flex justify-center mb-8 sm:mb-10 ${introSection.isVisible ? 'scroll-fade-in' : ''}`}>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            </div>

            <span className={`text-xs uppercase tracking-[0.2em] text-[#d4af37] font-light mb-4 sm:mb-6 block ${introSection.isVisible ? 'scroll-fade-in scroll-stagger-1' : ''}`}>Our Heritage</span>
            
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-light mb-8 sm:mb-12 text-slate-900 leading-tight text-balance ${introSection.isVisible ? 'scroll-fade-in-up scroll-stagger-2' : ''}`}>
              Where <span className="text-[#d4af37] font-semibold">Timeless Heritage</span> Meets <span className="font-semibold">Modern Luxury</span>
            </h2>
            
            <div className="space-y-6 text-slate-600 font-light text-base sm:text-lg leading-relaxed">
              <p className={`${introSection.isVisible ? 'scroll-fade-in-up scroll-stagger-3' : ''}`}>
                Since 1929, our hotel has stood as an enduring beacon of refined elegance. 
                Meticulously restored to honour colonial grandeur while embracing contemporary comfort.
              </p>
              <p className={`hidden sm:block ${introSection.isVisible ? 'scroll-fade-in-up scroll-stagger-4' : ''}`}>
                Every detail—from our exquisitely appointed rooms to our award-winning culinary experiences—
                is designed to create moments of sublime tranquility.
              </p>
            </div>

            <div className={`flex justify-center mt-8 sm:mt-10 ${introSection.isVisible ? 'scroll-fade-in' : ''}`}>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Responsive Grid */}
      <section 
        ref={statsSection.ref}
        className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden"
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <span className={`text-xs uppercase tracking-[0.2em] text-[#d4af37] font-light ${statsSection.isVisible ? 'scroll-fade-in' : ''}`}>Excellence by Numbers</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "95", label: "Years", suffix: "+" },
              { value: "175", label: "Rooms", suffix: "" },
              { value: "4.9", label: "Rating", suffix: "/5" },
              { value: "24/7", label: "Service", suffix: "" },
            ].map((stat, index) => (
              <div
                key={index}
                className={`text-center group relative ${statsSection.isVisible ? 'scroll-scale-up' : ''}`}
                style={{ animationDelay: statsSection.isVisible ? `${index * 0.15}s` : undefined }}
              >
                <div className="py-4 md:py-8">
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-light text-[#d4af37] mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                    <span className="text-2xl sm:text-3xl md:text-4xl text-white/70 ml-1">{stat.suffix}</span>
                  </div>
                  <div className="text-[10px] sm:text-sm uppercase tracking-wider text-slate-400 font-light">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section - Responsive Card Grid */}
      <section 
        ref={roomsSection.ref}
        className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className={`text-xs uppercase tracking-[0.2em] text-[#d4af37] font-light mb-4 block ${roomsSection.isVisible ? 'scroll-fade-in' : ''}`}>Accommodations</span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-light mb-6 text-slate-900 leading-tight ${roomsSection.isVisible ? 'scroll-fade-in-up scroll-stagger-1' : ''}`}>
              Your Stay in <span className="font-semibold">Supreme Comfort</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 mb-12">
            {[
              { name: "Deluxe Room", size: "35 sqm", guests: "2", image: "/room-deluxe.jpg" },
              { name: "Executive Suite", size: "65 sqm", guests: "4", image: "/room-suite.jpg" },
              { name: "Presidential Suite", size: "120 sqm", guests: "6", image: "/room-presidential.jpg" },
            ].map((room, index) => (
              <div
                key={index}
                className={`group glass-card overflow-hidden border border-white/50 hover:border-[#d4af37] transition-all duration-500 shadow-lg hover:shadow-2xl ${roomsSection.isVisible ? 'scroll-fade-in-up' : ''}`}
                style={{ animationDelay: roomsSection.isVisible ? `${index * 0.15}s` : undefined }}
              >
                {/* 
                   Best Practice: aspect-ratio on images prevents CLS (Content Layout Shift)
                */}
                <div className="relative aspect-[4/3] bg-slate-200 overflow-hidden">
                   {/* Fallback color/placeholder needed for real production if image fails */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/95 z-10" />
                  
                  {/* Info Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                    <h3 className="text-2xl sm:text-3xl font-display font-light text-white mb-2 group-hover:text-[#d4af37] transition-colors duration-300">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-4 text-white/80 text-xs sm:text-sm font-light">
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-[#d4af37] rounded-full" />
                        {room.guests} Guests
                      </span>
                      <span className="text-[#d4af37]">•</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-[#d4af37] rounded-full" />
                        {room.size}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white/95 backdrop-blur-sm">
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3 font-light leading-relaxed">
                    Exquisitely appointed with premium amenities, air-conditioning, elegant fixtures, and authentic colonial charm.
                  </p>
                  <Button variant="link" className="p-0 text-[#d4af37] hover:text-slate-900 group-hover:gap-3 transition-all font-light text-sm">
                    Explore Details
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/rooms" className="block sm:inline-block">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-sm px-12 py-6 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-[#d4af37] transition-all duration-300">
                VIEW ALL ROOMS & SUITES
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dining Section - Stack on Mobile, Side-by-Side on Desktop */}
      <section 
        ref={diningSection.ref}
        className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden"
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="text-center md:text-left">
              <span className={`text-xs uppercase tracking-[0.2em] text-[#d4af37] font-light mb-4 block ${diningSection.isVisible ? 'scroll-fade-in' : ''}`}>Culinary Excellence</span>
              <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-light mb-6 ${diningSection.isVisible ? 'scroll-fade-in-left' : ''}`}>
                Royal Flavours <span className="font-semibold text-transparent bg-gradient-to-r from-[#d4af37] to-white bg-clip-text">Crafted with Heritage</span>
              </h2>
              <p className={`text-base text-slate-300 mb-8 leading-relaxed font-light ${diningSection.isVisible ? 'scroll-fade-in-up scroll-stagger-1' : ''}`}>
                Experience elevated culinary artistry in our signature restaurants. From intimate fine dining to grand celebratory occasions.
              </p>
              <Link href="/services" className="block sm:inline-block">
                <Button size="lg" className={`w-full sm:w-auto rounded-sm border-white text-white hover:bg-white hover:text-slate-900 hover:border-[#d4af37] transition-all duration-300 px-8 py-6 border-2 ${diningSection.isVisible ? 'scroll-fade-in-up scroll-stagger-2' : ''}`}>
                  EXPLORE DINING EXPERIENCES
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            {/* Image/Banner Container */}
            <div className={`relative h-64 sm:h-80 md:h-96 w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-sm overflow-hidden glass-banner border border-white/10 group ${diningSection.isVisible ? 'scroll-fade-in-right' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4">
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-[#d4af37]/50 mx-auto mb-4" />
                  <p className="text-white/60 text-sm font-light">Culinary Artistry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        ref={finalCtaSection.ref}
        className="py-24 md:py-32 lg:py-40 bg-gradient-to-br from-black via-slate-950 to-black text-white text-center relative overflow-hidden"
      >
        <div className={`relative z-10 container mx-auto px-4 sm:px-6 ${finalCtaSection.isVisible ? 'scroll-fade-in-up' : ''}`}>
          <Sparkles className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-6 sm:mb-8 text-[#d4af37] animate-pulse ${finalCtaSection.isVisible ? 'scroll-fade-in' : ''}`} />
          
          <h2 className={`text-3xl sm:text-5xl lg:text-7xl font-display font-light mb-6 sm:mb-8 leading-tight ${finalCtaSection.isVisible ? 'scroll-fade-in-up scroll-stagger-1' : ''}`}>
            Begin Your <span className="font-semibold text-transparent bg-gradient-to-r from-[#d4af37] to-white bg-clip-text">Extraordinary Journey</span>
          </h2>
          
          <p className={`text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto font-light leading-relaxed ${finalCtaSection.isVisible ? 'scroll-fade-in-up scroll-stagger-2' : ''}`}>
            Reserve your stay today and discover why discerning guests return to us again and again.
          </p>

          <Link href="/rooms" className="block sm:inline-block">
            <Button size="lg" className={`w-full sm:w-auto rounded-sm px-10 py-6 text-base bg-white text-slate-900 hover:bg-[#d4af37] hover:text-black transition-all duration-300 shadow-lg ${finalCtaSection.isVisible ? 'scroll-fade-in-up scroll-stagger-4' : ''}`}>
              <Calendar className="w-4 h-4 mr-2" />
              BOOK YOUR STAY
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}