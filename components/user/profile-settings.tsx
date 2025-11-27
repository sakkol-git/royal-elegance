"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, Lock, Monitor, Shield, Mail, Phone, 
  Camera, Loader2, Save, Trash2, Eye, EyeOff, 
  LogOut, AlertCircle, CheckCircle2 
} from "lucide-react"

// Types & Libs
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// --- Types ---

interface ProfileData {
  fullName: string
  phone: string
  avatarUrl: string | null
}

interface Session {
  id: string
  device_info: string
  last_activity: string
  ip_address?: string
  is_current?: boolean
}

// --- Main Layout Component ---

export function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("general")
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setIsLoading(false)
    }
    init()
  }, [supabase])

  const menuItems = [
    { id: "general", label: "General", icon: User, description: "Profile details & avatar" },
    { id: "security", label: "Security", icon: Lock, description: "Password & 2FA" },
    { id: "sessions", label: "Sessions", icon: Monitor, description: "Manage devices" },
    { id: "verification", label: "Verification", icon: Shield, description: "Identity status" },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and set e-mail preferences.</p>
      </div>
      
      <Separator />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/5">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-3 whitespace-nowrap",
                  activeTab === item.id ? "bg-secondary font-medium" : "text-muted-foreground"
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "general" && <GeneralSection user={user} />}
              {activeTab === "security" && <SecuritySection />}
              {activeTab === "sessions" && <SessionsSection />}
              {activeTab === "verification" && <VerificationSection user={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// --- Sub-Components ---

// 1. General Profile Section
function GeneralSection({ user }: { user: SupabaseUser }) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    fullName: user.user_metadata?.full_name || "",
    phone: user.user_metadata?.phone || "",
    avatarUrl: user.user_metadata?.avatar_url || null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName, phone: formData.phone }
      })
      if (error) throw error
      toast({ title: "Success", description: "Profile updated successfully." })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This information will be displayed publicly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Avatar Upload Block */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-border cursor-pointer">
                <AvatarImage src={formData.avatarUrl || ""} className="object-cover"/>
                <AvatarFallback className="text-xl bg-muted">{formData.fullName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Profile Picture</h4>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                JPG, GIF or PNG. Max size of 2MB.
              </p>
              <Button variant="outline" size="sm" className="h-8 text-xs mt-2">Upload New</Button>
            </div>
          </div>

          <Separator />

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input value={user.email} disabled className="bg-muted/50" />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> Email cannot be changed here.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                placeholder="Jane Doe"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/40 px-6 py-4">
          <p className="text-xs text-muted-foreground">Last updated: Today</p>
          <Button type="submit" form="profile-form" disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// 2. Security Section
function SecuritySection() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [showPwd, setShowPwd] = useState({ current: false, new: false })

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Mismatch", description: "New passwords do not match.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new })
      if (error) throw error
      toast({ title: "Success", description: "Password updated successfully." })
      setPasswords({ current: "", new: "", confirm: "" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your password to keep your account secure.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
            <div className="relative">
              <Input
                id="current"
                type={showPwd.current ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showPwd.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t bg-muted/40 px-6 py-4 justify-end">
        <Button onClick={handleUpdatePassword} disabled={isSaving || !passwords.new}>
           {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
           Update Password
        </Button>
      </CardFooter>
    </Card>
  )
}

// 3. Sessions Section
function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching
    setTimeout(() => {
      setSessions([
        { id: "1", device_info: "Chrome on macOS", last_activity: new Date().toISOString(), ip_address: "192.168.1.1", is_current: true },
        { id: "2", device_info: "Safari on iPhone", last_activity: new Date(Date.now() - 86400000).toISOString(), ip_address: "10.0.0.1" },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>Manage your active sessions across devices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
             {[1,2].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {session.device_info}
                    {session.is_current && <Badge variant="secondary" className="text-[10px] h-5">Current</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.ip_address} • {new Date(session.last_activity).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!session.is_current && (
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/40 px-6 py-4">
         <Button variant="destructive" size="sm" className="ml-auto">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out All Devices
         </Button>
      </CardFooter>
    </Card>
  )
}

// 4. Verification Section
function VerificationSection({ user }: { user: SupabaseUser }) {
  const { toast } = useToast()

  const handleResend = () => {
    toast({ title: "Sent", description: "Verification email sent to " + user.email })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
          <CardDescription>Verify your identity to unlock all features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Email Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
            <div className="flex gap-4 items-center">
               <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
               </div>
               <div>
                  <h4 className="font-medium text-sm">Email Address</h4>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
               </div>
            </div>
            {user.email_confirmed_at ? (
               <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
               </Badge>
            ) : (
               <Button size="sm" variant="outline" onClick={handleResend}>Verify</Button>
            )}
          </div>

          {/* MFA Upsell */}
          {!user.user_metadata?.mfa_enabled && (
             <Alert className="bg-amber-500/10 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Security Recommendation</AlertTitle>
               <AlertDescription className="text-xs mt-1">
                 Enable Two-Factor Authentication (2FA) to add an extra layer of security to your account.
               </AlertDescription>
             </Alert>
          )}

        </CardContent>
      </Card>
    </div>
  )
}