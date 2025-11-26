"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User as UserIcon, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Camera, 
  Mail, 
  Shield, 
  CreditCard,
  ChevronRight,
  LogOut
} from "lucide-react"

// Types & Libs
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getBookingsByUser } from "@/lib/supabase-service"
import type { Booking } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

// UI Components
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { ProfileSettings } from "@/components/user/profile-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import Loading from "@/components/ui/loading"

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    confirmed: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200",
    pending: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200",
    checked_out: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200",
    cancelled: "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-200",
    default: "bg-slate-100 text-slate-700 border-slate-200"
  }

  const statusKey = status as keyof typeof styles
  const className = styles[statusKey] || styles.default

  return (
    <Badge variant="outline" className={`capitalize px-3 py-1 border ${className}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

const BookingItem = ({ booking }: { booking: Booking }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-border/40 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-300"
  >
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
      <Calendar className="w-5 h-5" />
    </div>
    
    <div className="flex-1 space-y-1">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-foreground">Booking #{booking.id.slice(-8)}</h4>
        <StatusBadge status={booking.status} />
      </div>
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="w-3 h-3" />
        {new Date(booking.checkInDate).toLocaleDateString()} — {new Date(booking.checkOutDate).toLocaleDateString()}
      </p>
    </div>

    <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
      <div className="text-right">
        <p className="text-sm font-medium text-muted-foreground">Total</p>
        <p className="text-lg font-bold text-primary">${booking.totalPrice}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  </motion.div>
)

// --- Types ---
interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string | null
  avatar_url: string | null
  email_verified: boolean
  created_at: string
}

// --- Main Component ---

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // 1. Data Fetching
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUser(user)

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        setProfile(profileData)
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }
    getUser()

    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
      if (!session?.user) router.push("/login")
    })

    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [supabase, router])

  // 2. Load Bookings when user is ready
  useEffect(() => {
    if (user?.id) {
      loadBookings()
    }
  }, [user?.id])

  // 3. Cleanup Blob URLs
  useEffect(() => {
    return () => {
      if (profile?.avatar_url?.startsWith('blob:')) {
        URL.revokeObjectURL(profile.avatar_url)
      }
    }
  }, [profile?.avatar_url])

  const loadBookings = async () => {
    if (!user?.id) return
    setIsLoadingBookings(true)
    try {
      const userBookings = await getBookingsByUser(user.id)
      setBookings(userBookings.slice(0, 5))
    } catch (error) {
      console.error("Error loading bookings:", error)
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image.", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Max size is 5MB.", variant: "destructive" })
      return
    }

    setIsUploadingAvatar(true)
    try {
      if (profile?.avatar_url?.startsWith('blob:')) {
        URL.revokeObjectURL(profile.avatar_url)
      }
      const previewUrl = URL.createObjectURL(file)
      await supabase
        .from("profiles")
        .update({ avatar_url: previewUrl })
        .eq("id", user!.id)

      setProfile(prev => prev ? { ...prev, avatar_url: previewUrl } : null)
      toast({ title: "Success", description: "Profile picture updated." })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  if (loading) return <Loading message="Loading profile..." size="md" />
  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />
      
      {/* Main Content Container - Grid Layout */}
      <main className="container max-w-6xl mx-auto px-4 pt-28 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: User Profile Card (Sticky on Desktop) */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-hidden border-border/60 shadow-md rounded-2xl">
                {/* Decorative Header Background */}
                <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
                
                <CardContent className="relative px-6 pb-8 pt-0 text-center">
                  {/* Avatar Section */}
                  <div className="relative -mt-16 mb-4 inline-block group">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl">
                      <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-muted text-muted-foreground">
                        {profile?.full_name ? getInitials(profile.full_name) : <UserIcon className="w-10 h-10 sm:w-12 sm:h-12" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      aria-label="Change profile picture"
                    >
                      {isUploadingAvatar ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>

                  {/* User Info */}
                  <div className="space-y-1 mb-6">
                    <h2 className="text-xl font-bold text-foreground">
                      {profile?.full_name || "User Profile"}
                    </h2>
                    <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <Badge variant="secondary" className="px-3 py-1 bg-muted/50">
                      {profile?.role || "Guest"}
                    </Badge>
                    {profile?.email_verified ? (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                        Pending
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3 text-sm text-muted-foreground text-left px-2">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric'}) : 'Recently'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span>{bookings.length} Total Bookings</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Tabs & Content */}
          <div className="md:col-span-8 lg:col-span-9">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <AnimatePresence>
                  {/* Settings Content */}
                  <TabsContent key="profile" value="profile" className="mt-0 focus-visible:outline-none">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProfileSettings />
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}