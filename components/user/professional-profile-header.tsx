"use client"

import React, { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { 
  Camera, 
  MapPin, 
  Calendar, 
  Shield, 
  Star, 
  Upload,
  User,
  Trophy,
  Clock,
  CheckCircle
} from "lucide-react"

interface ProfileStats {
  totalBookings: number
  completedBookings: number
  memberSince: string
  verificationStatus: 'complete' | 'partial' | 'none'
  loyaltyPoints: number
}

interface ProfessionalProfileHeaderProps {
  stats?: ProfileStats
}

export function ProfessionalProfileHeader({ stats }: ProfessionalProfileHeaderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data }: { data: { user: SupabaseUser | null } }) => {
      const u = (data as any)?.user ?? null
      setUser(u)
    })

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })

    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [])

  const updateProfile = async (updates: any) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: updates,
    })
    if (error) throw error
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      setAvatarUrl(previewUrl)

      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update profile with new avatar URL
      await updateProfile({ avatarUrl: previewUrl })

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to update avatar.",
        variant: "destructive",
      })
      // Reset to original avatar on error
      setAvatarUrl(user?.user_metadata?.avatar_url || "")
    } finally {
      setIsUploadingAvatar(false)
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

  const getVerificationProgress = () => {
    if (!stats) return 0
    let progress = 0
    if (user?.email_confirmed_at) progress += 33
    if (user?.phone_confirmed_at) progress += 33
    progress += 34 // MFA in future
    return progress
  }

  const getVerificationBadge = () => {
    const progress = getVerificationProgress()
    if (progress === 100) return { label: "Fully Verified", variant: "default" as const, color: "bg-green-500/20 text-green-700" }
    if (progress > 0) return { label: "Partially Verified", variant: "secondary" as const, color: "bg-yellow-500/20 text-yellow-700" }
    return { label: "Unverified", variant: "destructive" as const, color: "bg-red-500/20 text-red-700" }
  }

  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()
  const verificationBadge = getVerificationBadge()

  return (
    <Card className="glass-card overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      
      <CardContent className="relative -mt-16 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage src={avatarUrl} alt={user?.user_metadata?.full_name || "Profile"} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10">
                  {user?.user_metadata?.full_name ? getInitials(user.user_metadata.full_name) : <User className="w-12 h-12" />}
                </AvatarFallback>
              </Avatar>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer disabled:cursor-not-allowed"
              >
                {isUploadingAvatar ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left space-y-2">
              <div>
                <h1 className="text-3xl font-display font-bold">
                  {user?.user_metadata?.full_name || "Welcome"}
                </h1>
                <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {memberSince}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge 
                  variant={verificationBadge.variant}
                  className={verificationBadge.color}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {verificationBadge.label}
                </Badge>
                
                <Badge variant="outline" className="capitalize">
                  <Trophy className="w-3 h-3 mr-1" />
                  {user?.user_metadata?.role || "Guest"}
                </Badge>

                {stats && stats.loyaltyPoints > 0 && (
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    {stats.loyaltyPoints} Points
                  </Badge>
                )}
              </div>

              {/* Verification Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account Verification</span>
                  <span className="font-medium">{getVerificationProgress()}%</span>
                </div>
                <Progress value={getVerificationProgress()} className="h-2" />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-3 min-w-0 lg:min-w-[300px]">
            <div className="text-center p-3 rounded-lg bg-card/50 border border-border/50">
              <div className="text-2xl font-bold text-primary">
                {stats?.totalBookings || 0}
              </div>
              <div className="text-xs text-muted-foreground">Total Bookings</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-card/50 border border-border/50">
              <div className="text-2xl font-bold text-green-600">
                {stats?.completedBookings || 0}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            
            <div className="col-span-2 lg:col-span-1 text-center p-3 rounded-lg bg-card/50 border border-border/50">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600">
                <Clock className="w-5 h-5" />
                {user?.email_confirmed_at && user?.phone_confirmed_at ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  `${Math.round(getVerificationProgress())}%`
                )}
              </div>
              <div className="text-xs text-muted-foreground">Verification</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border/50">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2" />
            Update Location
          </Button>
          <Button variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Security Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}