"use client"

import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Award, Sparkles, MapPin, Clock, Star, Utensils, Flower2, Palmtree, Quote } from "lucide-react"
import Link from "next/link"
import { motion, useScroll, useTransform, Variants } from "framer-motion"

// --- LUXURY ANIMATION CONSTANTS ---
const luxuryEase: [number, number, number, number] = [0.25, 0.4, 0.25, 1]
const VIDEO_SRC_MP4 = '/Hero-Secion-Cinematic-Video.mp4'

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 1.2, ease: luxuryEase }
  }
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
}

export function PremiumHeroSection() {
  const targetRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  })
  
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const opacityHero = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div className="flex flex-col w-full bg-slate-50 overflow-hidden selection:bg-[#d4af37]/30">
      
      {/* 
        =============================================
        1. HERO SECTION
        =============================================
      */}
      <section ref={targetRef} className="relative h-[100dvh] min-h-[800px] w-full flex items-center justify-center overflow-hidden bg-black">
        
        {/* VIDEO BACKGROUND LAYER */}
        <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/30 z-10" /> 
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/30 z-10" />

          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=3270&auto=format&fit=crop"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          >
            <source src={VIDEO_SRC_MP4} type="video/mp4" />
          </video>
        </motion.div>

        {/* HERO CONTENT */}
        <motion.div 
          style={{ opacity: opacityHero }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          // ADDED: max-w constraints and 2xl scaling
          className="relative z-20 container mx-auto px-6 text-center pt-20 max-w-[1920px]"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#d4af37]/30 bg-black/40 backdrop-blur-md mb-8 ring-1 ring-[#d4af37]/20">
            <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-[10px] md:text-xs 2xl:text-sm text-[#d4af37] tracking-[0.25em] uppercase font-light">
              The Illustrate of Khmer Culture
            </span>
            <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
          </motion.div>

          {/* Heading - ADDED: 2xl:text-[10rem] for ultrawide impact */}
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-9xl 2xl:text-[10rem] font-display font-light text-white mb-8 leading-[1.1] tracking-tight drop-shadow-2xl">
            The Spirit of Luxury <br className="hidden md:block"/>
            <span className="text-transparent bg-gradient-to-r from-[#d4af37] via-[#f3e5b5] to-[#d4af37] bg-clip-text font-serif italic pr-4">
              Kingdom Of Cambodia
            </span>
          </motion.h1>

          {/* Subheading - ADDED: max-w constraint to prevent line stretching */}
          <motion.p variants={fadeInUp} className="max-w-2xl 2xl:max-w-4xl mx-auto text-lg md:text-xl 2xl:text-2xl text-white/90 font-light leading-relaxed mb-12 text-balance shadow-black drop-shadow-md">
            Experience the warmth of Cambodian hospitality in a sanctuary designed for royalty. 
            An oasis of serenity in the heart of the Kingdom.
          </motion.p>

          {/* Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/rooms">
              <Button size="lg" className="w-full sm:w-auto min-w-[200px] 2xl:min-w-[240px] h-14 2xl:h-16 2xl:text-sm bg-white text-slate-900 hover:bg-[#d4af37] hover:text-white rounded-none tracking-widest text-xs uppercase font-medium transition-all duration-500 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                Reserve Suite
              </Button>
            </Link>
            <Link href="/dining">
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px] 2xl:min-w-[240px] h-14 2xl:h-16 2xl:text-sm border-white/40 text-white hover:bg-white hover:text-slate-900 rounded-none tracking-widest text-xs uppercase font-medium transition-all duration-500 backdrop-blur-sm">
                Explore The Hotel
              </Button>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           transition={{ delay: 2, duration: 1 }}
           className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#d4af37] to-transparent animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37]/80">Scroll</span>
        </motion.div>
      </section>

      {/* 
        =============================================
        2. FLOATING INFO BAR
        =============================================
      */}
      <div className="relative z-30 -mt-24 px-4 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: luxuryEase }}
          // ADDED: max-w-screen-xl to stop the bar from stretching 3000px wide
          className="container mx-auto max-w-screen-xl 2xl:max-w-screen-2xl"
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border-t border-[#d4af37]/30 p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-2xl">
            <InfoItem icon={MapPin} title="Location" value="Siem Reap / Phnom Penh" />
            <InfoItem icon={Clock} title="Check-in" value="3:00 PM onwards" delay={0.1} />
            <InfoItem icon={Award} title="Concierge" value="24/7 Private Butler" delay={0.2} />
          </div>
        </motion.div>
      </div>

      {/* 
        =============================================
        3. INTRO SECTION
        =============================================
      */}
      <section className="py-20 md:py-32 bg-white relative">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          // ADDED: 2xl scaling
          className="container mx-auto px-6 max-w-4xl 2xl:max-w-6xl text-center relative z-10"
        >
          <motion.div variants={fadeInUp} className="flex justify-center mb-10">
            <Sparkles className="w-10 h-10 2xl:w-14 2xl:h-14 text-[#d4af37]" />
          </motion.div>
          
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl 2xl:text-7xl font-display font-light text-slate-900 mb-10 leading-tight">
            A Legacy of <span className="text-[#d4af37] italic font-serif">Gracious Living</span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-lg md:text-2xl 2xl:text-3xl text-slate-600 font-light leading-loose text-balance">
            Steeped in the rich traditions of Cambodia, our hotel offers a seamless blend of 
            ancient aesthetics and modern sophistication. From the moment you arrive, 
            you are not just a guest, but royalty returning home.
          </motion.p>
        </motion.div>
      </section>

      {/* 
        =============================================
        4. ROOMS SHOWCASE
        =============================================
      */}
      <section className="py-20 2xl:py-32 bg-slate-50 border-t border-slate-200">
        {/* ADDED: max-w-screen-2xl to prevent cards from becoming too wide/short on ultrawide */}
        <div className="container mx-auto px-6 max-w-screen-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4"
          >
            <div>
              <span className="text-[#d4af37] tracking-[0.2em] text-xs uppercase block mb-2">Accommodations</span>
              <h3 className="text-4xl 2xl:text-5xl font-display text-slate-900">Your Private Sanctuary</h3>
            </div>
            <Link href="/rooms">
              <Button variant="link" className="text-slate-900 hover:text-[#d4af37] p-0 text-lg">View All Suites <ArrowRight className="ml-2 w-5 h-5" /></Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 2xl:gap-12">
            <RoomCard 
              title="Deluxe River View" 
              price="From $450" 
              image="https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop"
              delay={0}
            />
            <RoomCard 
              title="Royal Angkor Suite" 
              price="From $850" 
              image="https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2670&auto=format&fit=crop"
              delay={0.2}
            />
            <RoomCard 
              title="The Emperor's Villa" 
              price="From $2,500" 
              image="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2670&auto=format&fit=crop"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* 
        =============================================
        5. WELLNESS & SPA
        =============================================
      */}
      <section className="py-32 2xl:py-48 relative overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-slate-900">
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=3270&auto=format&fit=crop')] bg-cover bg-fixed bg-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 max-w-screen-2xl">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-xl 2xl:max-w-2xl text-white"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6 text-[#d4af37]">
              <Flower2 className="w-6 h-6" />
              <span className="text-xs uppercase tracking-[0.2em]">Holistic Wellness</span>
            </motion.div>
            
            <motion.h3 variants={fadeInUp} className="text-5xl md:text-7xl 2xl:text-8xl font-display font-light mb-8 leading-none">
              Restore Your <br/> <span className="italic font-serif text-[#d4af37]">Inner Balance</span>
            </motion.h3>
            
            <motion.p variants={fadeInUp} className="text-slate-300 text-lg 2xl:text-xl font-light leading-relaxed mb-10">
              Drawing inspiration from ancient Khmer healing rituals, our award-winning spa 
              offers a tranquil escape from the world. Indulge in treatments using organic 
              botanicals sourced from the sacred Kulen Mountains.
            </motion.p>
            
            <motion.div variants={fadeInUp}>
              <Button className="h-14 px-10 bg-[#d4af37] text-white hover:bg-white hover:text-slate-900 rounded-none uppercase tracking-widest text-xs transition-all duration-300">
                Explore The Spa
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 
        =============================================
        6. CAMBODIAN HERITAGE
        =============================================
      */}
      <section className="py-24 2xl:py-32 bg-[#fcfbf9]">
        <div className="container mx-auto px-6 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row gap-16 2xl:gap-32 items-center">
             {/* Content */}
             <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: luxuryEase }}
              viewport={{ once: true }}
            >
              <span className="text-[#d4af37] tracking-[0.2em] text-xs uppercase block mb-4">Unforgettable Experiences</span>
              <h3 className="text-4xl md:text-5xl 2xl:text-6xl font-display text-slate-900 mb-6 leading-tight">
                Curated Journeys <br/> Through <span className="italic font-serif text-[#d4af37]">Time</span>
              </h3>
              <p className="text-slate-600 leading-loose mb-8 font-light 2xl:text-lg">
                Let our dedicated concierge arrange private sunrise tours of Angkor Wat, 
                exclusive helicopter flights over the Mekong, or authentic culinary classes 
                with our master chefs. We unlock the secrets of Cambodia just for you.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Private Sunrise Temple Tour", 
                  "Mekong River Sunset Cruise", 
                  "Traditional Apsara Dance Dinner"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-800 font-display 2xl:text-lg">
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="h-12 border-slate-300 hover:border-[#d4af37] hover:text-[#d4af37] text-slate-600 rounded-none uppercase tracking-widest text-xs">
                View Experiences
              </Button>
            </motion.div>

            {/* Images Grid */}
            <motion.div 
              className="flex-1 grid grid-cols-2 gap-4"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: luxuryEase }}
              viewport={{ once: true }}
            >
              <div className="space-y-4 mt-8">
                <div className="aspect-[3/4] bg-slate-200 w-full overflow-hidden">
                   <img src="https://i.pinimg.com/1200x/33/42/b6/3342b65ef0e9be4e29e9ffa60b547207.jpg" alt="Angkor Wat" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="aspect-[3/4] bg-slate-200 w-full overflow-hidden">
                   <img src="https://i.pinimg.com/736x/a0/49/f9/a049f9c499d325d6cac31dbed06448f0.jpg" alt="Khmer Culture" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 
        =============================================
        7. DINING SECTION
        =============================================
      */}
      <section className="py-20 md:py-32 2xl:py-48 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-6 max-w-screen-2xl">
          <div className="grid md:grid-cols-2 gap-16 2xl:gap-32 items-center">
            
            {/* Image Side */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: luxuryEase }}
              className="relative aspect-[4/5] overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center hover:scale-105 transition-transform duration-[2s]"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2574&auto=format&fit=crop')" }}
              />
              <div className="absolute bottom-0 left-0 p-8 2xl:p-12 bg-gradient-to-t from-black/80 to-transparent w-full">
                <div className="flex items-center gap-2 text-[#d4af37] mb-2">
                  <Star className="w-4 h-4 fill-[#d4af37]" />
                  <span className="text-xs uppercase tracking-widest">Fine Dining</span>
                </div>
                <p className="font-display text-2xl 2xl:text-4xl">Le Royal Khmer</p>
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="md:pl-10"
            >
              <motion.div variants={fadeInUp} className="mb-6 text-[#d4af37] flex items-center gap-3">
                <Utensils className="w-5 h-5" />
                <span className="text-xs uppercase tracking-[0.2em]">Culinary Artistry</span>
              </motion.div>
              
              <motion.h3 variants={fadeInUp} className="text-4xl md:text-6xl 2xl:text-7xl font-display font-light mb-8 leading-tight">
                Taste the <br/> <span className="italic font-serif text-[#d4af37]">Extraordinary</span>
              </motion.h3>
              
              <motion.p variants={fadeInUp} className="text-slate-400 text-lg 2xl:text-xl font-light leading-relaxed mb-10 max-w-lg">
                Experience the finest Khmer and French fusion cuisine. 
                Our executive chefs craft menus that celebrate local heritage with global flair,
                using ingredients sourced from our own organic gardens.
              </motion.p>
              
              <motion.div variants={fadeInUp}>
                <Button variant="outline" className="h-12 px-8 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black rounded-none uppercase tracking-widest text-xs transition-all duration-300">
                  Discover Dining
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 
        =============================================
        8. TESTIMONIALS (Social Proof)
        =============================================
      */}
      <section className="py-24 2xl:py-32 bg-white">
        <div className="container mx-auto px-6 text-center max-w-screen-2xl">
          <Quote className="w-12 h-12 text-[#d4af37]/30 mx-auto mb-8" />
          <h3 className="text-3xl 2xl:text-4xl font-display text-slate-900 mb-12">Guest Impressions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 2xl:gap-16">
            <TestimonialCard 
              text="An absolute masterpiece of hospitality. The attention to detail is unmatched in all of Southeast Asia."
              author="James W."
              location="London, UK"
              delay={0}
            />
            <TestimonialCard 
              text="The most magical stay of our lives. The sunrise view from the Royal Suite is something we will never forget."
              author="Sophie L."
              location="Paris, France"
              delay={0.2}
            />
            <TestimonialCard 
              text="True 7-star service. The staff anticipated our needs before we even realized them ourselves."
              author="Michael Chen"
              location="Singapore"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* 
        =============================================
        9. FINAL CTA
        =============================================
      */}
      <section className="relative py-32 md:py-48 2xl:py-64 flex items-center justify-center bg-slate-800 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_70%)]" />
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10 container mx-auto px-6 text-center"
        >
          <motion.div variants={fadeInUp} className="flex justify-center mb-8">
            <Palmtree className="w-12 h-12 text-[#d4af37] opacity-80" />
          </motion.div>

          <motion.h2 variants={fadeInUp} className="text-4xl sm:text-6xl lg:text-8xl 2xl:text-9xl font-display font-light text-white mb-8 leading-tight">
            Your Kingdom <br/> <span className="font-semibold italic font-serif text-transparent bg-gradient-to-r from-[#d4af37] via-[#f9f1d0] to-[#d4af37] bg-clip-text">Awaits</span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-base sm:text-lg md:text-2xl 2xl:text-3xl text-slate-400 mb-12 max-w-2xl 2xl:max-w-4xl mx-auto font-light leading-relaxed">
            Reserve your stay today and discover why discerning guests return to us again and again.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Link href="/rooms" className="inline-block">
              <Button size="lg" className="h-16 px-12 text-base bg-white text-slate-900 hover:bg-[#d4af37] hover:text-white transition-all duration-500 rounded-none shadow-[0_0_50px_-15px_rgba(255,255,255,0.3)]">
                <Calendar className="w-4 h-4 mr-3" />
                <span className="tracking-[0.2em] uppercase text-xs font-bold">Book Your Stay</span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

    </div>
  )
}

// --- HELPER COMPONENTS ---

function InfoItem({ icon: Icon, title, value, delay = 0 }: { icon: any, title: string, value: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      className="flex items-start gap-4 group"
    >
      <div className="p-3 border border-[#d4af37]/20 rounded-full group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10 transition-colors duration-500">
        <Icon className="w-5 h-5 text-[#d4af37]" />
      </div>
      <div>
        <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</h4>
        <p className="font-display text-lg 2xl:text-xl text-white font-light">{value}</p>
      </div>
    </motion.div>
  )
}

function RoomCard({ title, price, image, delay }: { title: string, price: string, image: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden mb-6">
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
        <motion.div 
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('${image}')` }}
        />
      </div>
      <div className="flex justify-between items-start border-b border-slate-200 pb-4 group-hover:border-[#d4af37] transition-colors duration-500">
        <div>
          <h4 className="text-xl 2xl:text-2xl font-display text-slate-900 mb-1 group-hover:text-[#d4af37] transition-colors duration-300">{title}</h4>
          <p className="text-xs uppercase tracking-widest text-slate-500">City View • 45sqm</p>
        </div>
        <span className="font-serif italic text-lg 2xl:text-xl text-slate-900">{price}</span>
      </div>
    </motion.div>
  )
}

function TestimonialCard({ text, author, location, delay }: { text: string, author: string, location: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      className="p-8 2xl:p-12 bg-slate-50 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex justify-center gap-1 text-[#d4af37] mb-6">
        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
      </div>
      <p className="text-slate-600 font-light italic mb-6 leading-relaxed 2xl:text-lg">"{text}"</p>
      <div>
        <h5 className="text-slate-900 font-display font-medium 2xl:text-xl">{author}</h5>
        <span className="text-xs text-slate-400 uppercase tracking-widest">{location}</span>
      </div>
    </motion.div>
  )
}