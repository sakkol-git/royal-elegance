"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getBookingsByUser } from "@/lib/supabase-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Star,
  DollarSign,
  ArrowRight,
  Hotel,
  Coffee,
  Activity
} from "lucide-react"
import type { Booking } from "@/lib/types"

interface ActivityStats {
  totalBookings: number
  completedBookings: number
  upcomingBookings: number
  totalSpent: number
  averageRating: number
  favoriteService: string
}

export function ActivityDashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ActivityStats | null>(null)

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

  useEffect(() => {
    if (user?.id) {
      loadUserActivity()
    }
  }, [user?.id])

  const loadUserActivity = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const userBookings = await getBookingsByUser(user.id)
      setBookings(userBookings)
      
      // Calculate statistics
      const now = new Date()
      const completed = userBookings.filter(b => b.status === 'checked_out')
      const upcoming = userBookings.filter(b => b.status === 'confirmed' && new Date(b.checkInDate) > now)
      
      // Calculate total spent (simplified calculation)
      const totalSpent = userBookings.reduce((sum, booking) => {
        // Use actual booking totals if available, otherwise calculate
        return sum + (booking.roomPrice + booking.servicesPrice + (booking.additionalCharges || 0) + (booking.taxAmount || 0) - (booking.discountAmount || 0))
      }, 0)

      // Mock favorite service analysis
      const serviceTypes = userBookings.map(b => b.bookingType || 'room')
      const serviceCount = serviceTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const favoriteService = Object.entries(serviceCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'rooms'

      setStats({
        totalBookings: userBookings.length,
        completedBookings: completed.length,
        upcomingBookings: upcoming.length,
        totalSpent,
        averageRating: 4.8, // Mock data
        favoriteService
      })
    } catch (error) {
      console.error("Error loading user activity:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBookingStatusBadge = (booking: Booking) => {
    const now = new Date()
    const checkInDate = new Date(booking.checkInDate)
    const checkOutDate = new Date(booking.checkOutDate)

    if (booking.status === 'checked_out') {
      return <Badge className="bg-green-500/20 text-green-700">Completed</Badge>
    } else if (booking.status === 'cancelled') {
      return <Badge className="bg-red-500/20 text-red-700">Cancelled</Badge>
    } else if (booking.status === 'no_show') {
      return <Badge className="bg-gray-500/20 text-gray-700">No Show</Badge>
    } else if (booking.status === 'checked_in') {
      return <Badge className="bg-blue-500/20 text-blue-700">Checked In</Badge>
    } else if (booking.status === 'confirmed') {
      return <Badge className="bg-green-500/20 text-green-700">Confirmed</Badge>
    } else if (booking.status === 'pending') {
      return <Badge className="bg-yellow-500/20 text-yellow-700">Pending</Badge>
    } else if (checkInDate <= now && checkOutDate >= now) {
      return <Badge className="bg-blue-500/20 text-blue-700">Active</Badge>
    } else if (checkInDate > now) {
      return <Badge className="bg-yellow-500/20 text-yellow-700">Upcoming</Badge>
    } else {
      return <Badge className="bg-gray-500/20 text-gray-700">Past</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              Total Bookings
            </div>
            <div className="text-3xl font-bold text-primary">
              {stats?.totalBookings || 0}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </div>
            <div className="text-3xl font-bold text-green-600">
              {stats?.completedBookings || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}% completion rate
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              Total Spent
            </div>
            <div className="text-3xl font-bold text-blue-600">
              ${(stats?.totalSpent || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Lifetime value
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Star className="w-4 h-4" />
              Avg Rating
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.averageRating || 0}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < Math.floor(stats?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest bookings and interactions</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Hotel className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-sm">Start booking to see your activity here</p>
              <Button className="mt-4">
                Browse Rooms
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {booking.bookingType === 'room' ? (
                      <Hotel className="w-6 h-6 text-primary" />
                    ) : (
                      <Coffee className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {booking.bookingReference || `Booking #${booking.id.slice(-8)}`}
                      </h4>
                      {getBookingStatusBadge(booking)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.checkInDate.toString())} - {formatDate(booking.checkOutDate.toString())}
                      </span>
                      {booking.guestCount && (
                        <span>{booking.guestCount} guests</span>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="icon">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      {stats && stats.totalBookings > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Booking Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion Rate</span>
                  <span className="font-medium">
                    {Math.round((stats.completedBookings / stats.totalBookings) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(stats.completedBookings / stats.totalBookings) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">Favorite Service</p>
                <div className="flex items-center gap-2">
                  {stats.favoriteService === 'room' ? (
                    <Hotel className="w-4 h-4 text-primary" />
                  ) : (
                    <Coffee className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-medium capitalize">{stats.favoriteService}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Hotel className="w-4 h-4 mr-2" />
                Book a Room
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Coffee className="w-4 h-4 mr-2" />
                Order Services
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Star className="w-4 h-4 mr-2" />
                Leave a Review
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}