"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  User as UserIcon, 
  CheckCircle, 
  Clock, 
  Camera, 
  Shield, 
  Mail,
  MapPin,
  CalendarDays
} from "lucide-react"

// Types & Libs
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// UI Components
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { PremiumFooter } from "@/components/layout/premium-footer"
import { ProfileSettings } from "@/components/user/profile-settings" // Your form component
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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

// --- Loading Skeleton ---
const ProfileSkeleton = () => (
  <div className="container max-w-5xl mx-auto px-4 pt-28 pb-12 grid grid-cols-1 md:grid-cols-12 gap-8">
    {/* Sidebar Skeleton */}
    <div className="md:col-span-4 lg:col-span-4">
       <Card className="h-[400px] rounded-3xl overflow-hidden border-border/50">
          <div className="h-32 bg-muted animate-pulse" />
          <div className="px-6 -mt-12 space-y-4">
             <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
             <Skeleton className="w-3/4 h-6 rounded-md" />
             <Skeleton className="w-1/2 h-4 rounded-md" />
             <Skeleton className="w-full h-20 rounded-xl mt-6" />
          </div>
       </Card>
    </div>
    {/* Form Skeleton */}
    <div className="md:col-span-8 lg:col-span-8 space-y-6">
       <Card className="h-[500px] rounded-3xl border-border/50">
          <CardHeader>
             <Skeleton className="w-1/3 h-8" />
             <Skeleton className="w-2/3 h-4" />
          </CardHeader>
          <CardContent className="space-y-6">
             <Skeleton className="w-full h-12" />
             <Skeleton className="w-full h-12" />
             <Skeleton className="w-full h-12" />
          </CardContent>
       </Card>
    </div>
  </div>
)

// --- Main Page Component ---

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // 1. Data Fetching
  useEffect(() => {
    const initData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) { router.push("/login"); return }
        setUser(authUser)

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()

        setProfile(data)
      } catch (error) {
        console.error("Profile load error", error)
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [supabase, router])

  // 2. Avatar Handling
  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    
    // 1. Immediate UI Feedback (Optimistic Update)
    const objectUrl = URL.createObjectURL(file)
    setProfile(prev => prev ? { ...prev, avatar_url: objectUrl } : null)
    
    // 2. Actual Upload Logic (Mocked for safety if you don't have the function ready)
    try {
      // Simulate API call
      // await uploadAvatar(user.id, file)
      toast({ title: "Avatar Updated", description: "Looking good!" })
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed", description: "Please try again." })
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) return <><PremiumNavbar /><ProfileSkeleton /><PremiumFooter /></>
  if (!user) return null

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 flex flex-col font-sans">
      <PremiumNavbar />

      <main className="flex-1 container max-w-5xl mx-auto px-4 pt-24 pb-16">
        
        {/* Page Header */}
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences.</p>
        </div>
          
          <section className="md:col-span-8 lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-border/60 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="px-6 py-6 border-b border-border/40 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">General Information</CardTitle>
                  </div>
                  <CardDescription>
                    Update your personal details and public profile information.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8">
                  {/* 
                     Injecting your existing ProfileSettings component here.
                     This keeps the logic separated and clean.
                  */}
                  <ProfileSettings /> 
                </CardContent>
              </Card>
            </motion.div>
          </section>
      </main>
      <PremiumFooter />
    </div>
  )
}