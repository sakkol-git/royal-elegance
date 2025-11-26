"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, Lock, Monitor, Shield, Eye, EyeOff, Trash2 } from "lucide-react"

export function ProfileSettings() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { toast } = useToast()

  // Profile state
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data }: { data: { user: SupabaseUser | null } }) => {
      const u = (data as any)?.user ?? null
      setUser(u)
      if (u?.user_metadata?.full_name) {
        setFullName(u.user_metadata.full_name)
      }
      if (u?.user_metadata?.phone) {
        setPhone(u.user_metadata.phone)
      }
    })

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })

    const subscription = (data as any)?.subscription ?? data

    return () => subscription?.unsubscribe?.()
  }, [])

  useEffect(() => {
    loadSessions()
  }, [])

  const updateProfile = async (updates: any) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: updates,
    })
    if (error) throw error
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  const resendEmailVerification = async () => {
    const supabase = createClient()
    // Resend verification email logic
    const { data } = await supabase.auth.getUser()
    const user = (data as any)?.user ?? null
    if (!user?.email) throw new Error("No email found")

    // In a real app, call your email sending API
    // For now just notify user
    return Promise.resolve()
  }

  const getUserSessions = async () => {
    // Mock sessions for demo
    return [
      {
        id: "1",
        device: "Chrome on macOS",
        lastActive: new Date(Date.now() - 5000),
        location: "New York, USA",
      },
    ]
  }

  const deleteSession = async (sessionId: string) => {
    // Mock delete for demo
    return Promise.resolve()
  }

  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const userSessions = await getUserSessions()
      setSessions(userSessions)
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)

    try {
      await updateProfile({ fullName, phone })
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)

    try {
      await updatePassword(currentPassword, newPassword)
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      await resendEmailVerification()
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)
      toast({
        title: "Session Deleted",
        description: "The session has been removed.",
      })
      loadSessions()
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete session.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center text-muted-foreground">
          Please sign in to view your profile settings.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="verification">
            <Shield className="w-4 h-4 mr-2" />
            Verification
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email} disabled className="glass" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="glass pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="glass pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="glass pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active sessions across devices</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active sessions found</div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-border/50 bg-card/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{session.device_info || "Unknown Device"}</p>
                          <p className="text-sm text-muted-foreground">
                            Last active: {new Date(session.last_activity).toLocaleString()}
                          </p>
                          {session.ip_address && (
                            <p className="text-xs text-muted-foreground">IP: {session.ip_address}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Account Verification</CardTitle>
              <CardDescription>Verify your email and phone number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Verification */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {user.email_confirmed_at ? (
                    <Badge className="bg-green-500/20 text-green-700">Verified</Badge>
                  ) : (
                    <Badge variant="destructive">Not Verified</Badge>
                  )}
                </div>
                {!user.email_confirmed_at && (
                  <Button variant="outline" onClick={handleResendVerification} className="w-full">
                    Resend Verification Email
                  </Button>
                )}
              </div>

              <Separator />

              {/* Phone Verification */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone Verification</p>
                      <p className="text-sm text-muted-foreground">{user.user_metadata?.phone || "No phone number"}</p>
                    </div>
                  </div>
                  {user.phone_confirmed_at ? (
                    <Badge className="bg-green-500/20 text-green-700">Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Not Verified</Badge>
                  )}
                </div>
                {user.user_metadata?.phone && !user.phone_confirmed_at && (
                  <Button variant="outline" className="w-full" disabled>
                    Verify Phone (Coming Soon)
                  </Button>
                )}
              </div>

              <Separator />

              {/* MFA Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                  </div>
                  {false ? (
                    <Badge className="bg-green-500/20 text-green-700">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                <Button variant="outline" className="w-full" disabled>
                  {false ? "Manage 2FA" : "Enable 2FA"} (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

