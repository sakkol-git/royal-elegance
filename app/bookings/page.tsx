"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Booking, Room, RoomType, Service } from "@/lib/types"
import { getBookingsByUser, getRooms, getRoomTypes, getServices, updateBooking } from "@/lib/supabase-service"
import { Calendar, Hotel, Sparkles, DollarSign, Users, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function BookingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set())

  const toggleBookingDetails = (bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId)
      } else {
        newSet.add(bookingId)
      }
      return newSet
    })
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) router.push("/login")
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch user bookings directly with authenticated client for RLS
        const { data: userBookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (bookingsError) throw bookingsError

        // Convert timestamps
        const userBookings = userBookingsData.map((booking: any) => ({
          ...booking,
          id: booking.id,
          createdAt: new Date(booking.created_at),
          updatedAt: new Date(booking.updated_at),
          checkInDate: new Date(booking.check_in_date),
          checkOutDate: new Date(booking.check_out_date),
          checkIn: new Date(booking.check_in_date), // Backward compatibility
          checkOut: new Date(booking.check_out_date), // Backward compatibility
          floorId: booking.floor_id,
          roomTypeId: booking.room_type_id,
          roomId: booking.room_id,
          userId: booking.user_id,
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          guestPhone: booking.guest_phone,
          guestCount: booking.guest_count,
          guests: booking.guest_count, // Backward compatibility
          bookingReference: booking.booking_reference,
          paymentMethod: booking.payment_method,
          paidAmount: booking.paid_amount,
          paymentStatus: booking.payment_status,
          bookingType: booking.room_id ? 'room' : 'service',
          totalPrice: booking.total_price,
          status: booking.status,
          services: booking.services || [],
        })) as Booking[]

        const [allRooms, allRoomTypes, allServices] = await Promise.all([
          getRooms(),
          getRoomTypes(),
          getServices(),
        ])

        setBookings(userBookings)
        setRooms(allRooms)
        setRoomTypes(allRoomTypes)
        setServices(allServices)

        console.log("=== BOOKINGS PAGE DATA ===")
        console.log("Loaded bookings:", userBookings.length)
        console.log("Bookings details:", userBookings.map(b => ({
          id: b.id,
          reference: b.bookingReference,
          status: b.status,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          guestName: b.guestName,
          totalPrice: b.totalPrice
        })))
        console.log("==========================")
      } catch (error) {
        console.error("Error fetching bookings:", error)
        toast({
          title: "Error",
          description: "Failed to load your bookings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoadingData(false)
      }
    }

    if (user) {
      fetchData()
      
      // Set up realtime subscription for bookings
      const channel = supabase
        .channel('bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'bookings',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('[Realtime] Booking change detected:', payload)
            // Refetch bookings when any change occurs
            fetchData()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [user, toast, supabase])

  const getRoomTypeForBooking = (booking: Booking) => {
    if (!booking.roomId) return null
    const room = rooms.find((r) => r.id === booking.roomId)
    if (!room) return null
    return roomTypes.find((rt) => rt.id === room.roomTypeId)
  }

  const getServicesForBooking = (booking: Booking) => {
    return services.filter((s) => booking.services.includes(s.id))
  }

  const handleCancelBooking = async (bookingId: string) => {
    console.log("Attempting to cancel booking with ID:", bookingId)
    console.log("Booking ID type:", typeof bookingId)
    console.log("Current bookings:", bookings.map(b => ({ 
      id: b.id, 
      idType: typeof b.id,
      status: b.status,
      userId: b.userId,
      guestName: b.guestName 
    })))
    
    const targetBooking = bookings.find(b => b.id === bookingId)
    console.log("Target booking found in local state:", targetBooking)
    
    try {
      const updatedBooking = await updateBooking(bookingId, { status: "cancelled" })
      console.log("Successfully updated booking:", updatedBooking)
      
      // Update local state with the actual updated booking
      setBookings(bookings.map((b) => (b.id === bookingId ? updatedBooking : b)))

      toast({
        title: "Booking cancelled successfully",
        description: `Booking ${updatedBooking.bookingReference || updatedBooking.id} has been cancelled.`,
      })
    } catch (error) {
      console.error("Error cancelling booking:", error)
      console.error("Booking ID that failed:", bookingId)
      
      let errorMessage = "Failed to cancel booking. Please try again."
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      } else if (error && typeof error === 'object' && 'error' in error) {
        errorMessage = String(error.error)
      }
      
      toast({
        title: "Error cancelling booking",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const upcomingBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false
    
    // Check if check-out date is in the future (booking is still active or upcoming)
    const checkOutDate = new Date(b.checkOut)
    const now = new Date()
    
    // Set time to start of day for fair comparison
    checkOutDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    
    const isUpcoming = checkOutDate >= now
    
    console.log("Booking check:", {
      id: b.id,
      reference: b.bookingReference,
      status: b.status,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      checkOutDate: checkOutDate,
      now: now,
      isUpcoming: isUpcoming
    })
    
    return isUpcoming
  })

  const pastBookings = bookings.filter((b) => {
    // Exclude cancelled bookings (they have their own tab now)
    if (b.status === "cancelled") return false
    
    const checkOutDate = new Date(b.checkOut)
    const now = new Date()
    
    // Set time to start of day
    checkOutDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    
    return checkOutDate < now || b.status === "checked_out" || b.status === "no_show"
  })

  const cancelledBookings = bookings.filter((b) => b.status === "cancelled")

  const completedStays = bookings.filter((b) => {
    // Only completed stays (no cancelled bookings)
    if (b.status === "cancelled") return false
    if (b.bookingType === "service") return false
    
    const checkOutDate = new Date(b.checkOut)
    const now = new Date()
    
    checkOutDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    
    return checkOutDate < now || b.status === "checked_out"
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: { variant: "default" as const, icon: CheckCircle2, label: "Confirmed" },
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      cancelled: { variant: "destructive" as const, icon: XCircle, label: "Cancelled" },
      completed: { variant: "outline" as const, icon: CheckCircle2, label: "Completed" },
    }

    const config = variants[status as keyof typeof variants] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getBookingTypeBadge = (type: string) => {
    const config = {
      room: { icon: Hotel, label: "Room Booking", className: "bg-blue-500/20 text-blue-700" },
      service: { icon: Sparkles, label: "Service Booking", className: "bg-purple-500/20 text-purple-700" },
      both: { icon: Hotel, label: "Room + Services", className: "bg-green-500/20 text-green-700" },
    }

    const typeConfig = config[type as keyof typeof config] || config.room
    const Icon = typeConfig.icon

    return (
      <Badge className={`gap-1 ${typeConfig.className}`}>
        <Icon className="w-3 h-3" />
        {typeConfig.label}
      </Badge>
    )
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />
      <main className="container mx-auto px-4 py-8 space-y-8" style={{ marginTop: "112px" }}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Bookings
            </h1>
            <p className="text-muted-foreground">
              View and manage all your reservations and booking history
            </p>
            {bookings.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Total bookings: <span className="font-semibold text-foreground">{bookings.length}</span>
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setLoadingData(true)
              const fetchData = async () => {
                if (!user) return
                try {
                  const { data: userBookingsData, error: bookingsError } = await supabase
                    .from("bookings")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })

                  if (bookingsError) throw bookingsError

                  const userBookings = userBookingsData.map((booking: any) => ({
                    ...booking,
                    id: booking.id,
                    createdAt: new Date(booking.created_at),
                    updatedAt: new Date(booking.updated_at),
                    checkInDate: new Date(booking.check_in_date),
                    checkOutDate: new Date(booking.check_out_date),
                    checkIn: new Date(booking.check_in_date),
                    checkOut: new Date(booking.check_out_date),
                    floorId: booking.floor_id,
                    roomTypeId: booking.room_type_id,
                    roomId: booking.room_id,
                    userId: booking.user_id,
                    guestName: booking.guest_name,
                    guestEmail: booking.guest_email,
                    guestPhone: booking.guest_phone,
                    guestCount: booking.guest_count,
                    guests: booking.guest_count,
                    bookingReference: booking.booking_reference,
                    paymentMethod: booking.payment_method,
                    paidAmount: booking.paid_amount,
                    paymentStatus: booking.payment_status,
                    bookingType: booking.room_id ? 'room' : 'service',
                    totalPrice: booking.total_price,
                    status: booking.status,
                    services: booking.services || [],
                  })) as Booking[]

                  setBookings(userBookings)
                  
                  // Calculate breakdown
                  const upcoming = userBookings.filter(
                    (b) => b.status !== "cancelled" && new Date(b.checkIn) > new Date()
                  ).length
                  const past = userBookings.filter(
                    (b) => b.status === "checked_out" || b.status === "no_show" || new Date(b.checkOut) < new Date()
                  ).length
                  const cancelled = userBookings.filter((b) => b.status === "cancelled").length
                  
                  toast({
                    title: "Refreshed",
                    description: `Total: ${userBookings.length} bookings (${upcoming} upcoming, ${past} history, ${cancelled} cancelled)`,
                  })
                } catch (error) {
                  console.error("Error fetching bookings:", error)
                  toast({
                    title: "Error",
                    description: "Failed to refresh bookings",
                    variant: "destructive",
                  })
                } finally {
                  setLoadingData(false)
                }
              }
              fetchData()
            }}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              Booking History ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2">
              <XCircle className="w-4 h-4" />
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
            <TabsTrigger value="stays" className="gap-2">
              <Hotel className="w-4 h-4" />
              Stay History ({completedStays.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Bookings */}
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Bookings</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have any upcoming reservations. Start planning your next stay!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => router.push("/rooms")}>
                      <Hotel className="w-4 h-4 mr-2" />
                      Browse Rooms
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/services")}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Browse Services
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map((booking) => {
                const roomType = getRoomTypeForBooking(booking)
                const bookingServices = getServicesForBooking(booking)
                const nights = Math.ceil(
                  (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                )
                const checkInDate = new Date(booking.checkIn)
                const checkOutDate = new Date(booking.checkOut)
                const daysUntilCheckIn = Math.ceil(
                  (checkInDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                const isExpanded = expandedBookings.has(booking.id)

                return (
                  <Card key={booking.id} className="glass-card overflow-hidden border-2 border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all duration-300 hover:shadow-lg">
                    {/* Compact List View */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 relative overflow-hidden cursor-pointer" onClick={() => toggleBookingDetails(booking.id)}>
                      <div className="absolute inset-0 bg-[url('/luxury-hotel-lobby.png')] opacity-10 bg-cover bg-center" />
                      <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl" />
                      
                      <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getBookingTypeBadge(booking.bookingType)}
                            {getStatusBadge(booking.status)}
                            {daysUntilCheckIn <= 7 && daysUntilCheckIn > 0 && (
                              <Badge className="bg-[#d4af37] text-black gap-1 animate-pulse">
                                <AlertCircle className="w-3 h-3" />
                                {daysUntilCheckIn} days away
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-display text-white font-semibold">
                            {roomType ? roomType.name : bookingServices[0]?.name || "Service Booking"}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-white/70">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                              {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                              {nights} {nights === 1 ? 'Night' : 'Nights'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                              {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#d4af37]">${booking.totalPrice}</p>
                            <p className="text-xs text-white/60">Total Amount</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#d4af37] text-[#000000] hover:bg-[#d4af37] hover:text-black transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookingDetails(booking.id)
                            }}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <CardContent className="p-6 space-y-6 animate-in slide-in-from-top duration-300">
                        {/* Stay Duration & Dates */}
                        <div className="glass-card p-5 border border-[#d4af37]/20">
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Check-In</p>
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5">
                                  <Calendar className="w-5 h-5 text-[#d4af37]" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                  <p className="text-sm text-muted-foreground">{checkInDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Check-Out</p>
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5">
                                  <Calendar className="w-5 h-5 text-[#d4af37]" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                  <p className="text-sm text-muted-foreground">{checkOutDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Duration</p>
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                                  <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
                                  <p className="text-sm text-muted-foreground">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Guest & Payment Information */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Guest Details */}
                          <div className="glass-card p-4 space-y-3 border border-slate-200">
                            <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-700">
                              <Users className="w-4 h-4 text-[#d4af37]" />
                              Guest Information
                            </h4>
                            <Separator />
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Name:</span>
                                <span className="font-semibold">{booking.guestName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-mono text-xs">{booking.guestEmail}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Phone:</span>
                                <span className="font-semibold">{booking.guestPhone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Guests:</span>
                                <span className="font-semibold">{booking.guestCount} {booking.guestCount === 1 ? 'person' : 'people'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Booking Ref:</span>
                                <span className="font-mono text-xs font-bold text-[#d4af37]">{booking.bookingReference}</span>
                              </div>
                            </div>
                          </div>

                          {/* Payment Details */}
                          <div className="glass-card p-4 space-y-3 border border-green-200 bg-green-50/50">
                            <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-green-800">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              Payment Details
                            </h4>
                            <Separator />
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Method:</span>
                                <Badge variant="outline" className="capitalize">{booking.paymentMethod}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge className="bg-green-600 text-white capitalize">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {booking.paymentStatus}
                                </Badge>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-muted-foreground font-semibold">Total Amount:</span>
                                <span className="font-bold text-2xl text-green-700">${booking.totalPrice}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Paid Amount:</span>
                                <span className="font-semibold text-green-600">${booking.paidAmount || booking.totalPrice}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Room Type Details */}
                        {roomType && (
                          <div className="glass-card p-4 space-y-3 border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/5 to-transparent">
                            <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-700">
                              <Hotel className="w-4 h-4 text-[#d4af37]" />
                              Room Details
                            </h4>
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full mt-1.5" />
                                <div>
                                  <p className="text-muted-foreground">Room Type</p>
                                  <p className="font-semibold">{roomType.name}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full mt-1.5" />
                                <div>
                                  <p className="text-muted-foreground">Base Price</p>
                                  <p className="font-semibold">${roomType.basePrice}/night</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full mt-1.5" />
                                <div>
                                  <p className="text-muted-foreground">Max Occupancy</p>
                                  <p className="font-semibold">{roomType.maxOccupancy} guests</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full mt-1.5" />
                                <div>
                                  <p className="text-muted-foreground">Booking Date</p>
                                  <p className="font-semibold text-xs">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Additional Services */}
                        {bookingServices.length > 0 && (
                          <div className="glass-card p-4 space-y-3 border border-purple-200 bg-purple-50/30">
                            <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-purple-800">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              Additional Services ({bookingServices.length})
                            </h4>
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-3">
                              {bookingServices.map((service) => (
                                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-purple-200 hover:border-purple-400 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-100">
                                      <Sparkles className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm">{service.name}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="ml-2">
                                    ${service.price}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" className="flex-1 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-white transition-all">
                            <Hotel className="w-4 h-4 mr-2" />
                            View Room Details
                          </Button>
                          <Button className="flex-1 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            Get Directions
                          </Button>
                          {booking.status === "confirmed" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="shadow-lg">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel Booking
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-card">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this booking? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>
                                    Yes, Cancel
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </TabsContent>

          {/* Booking History */}
          <TabsContent value="history" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Booking History</h3>
                  <p className="text-muted-foreground">
                    Your past bookings will appear here once you complete your first reservation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map((booking) => {
                const roomType = getRoomTypeForBooking(booking)
                const bookingServices = getServicesForBooking(booking)
                const nights = Math.ceil(
                  (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                )
                const checkInDate = new Date(booking.checkIn)
                const checkOutDate = new Date(booking.checkOut)
                const isExpanded = expandedBookings.has(booking.id)

                return (
                  <Card key={booking.id} className="glass-card overflow-hidden border border-slate-200 hover:border-slate-300 transition-all duration-300">
                    {/* Compact List View */}
                    <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 p-3 border-b cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleBookingDetails(booking.id)}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getBookingTypeBadge(booking.bookingType)}
                            {getStatusBadge(booking.status)}
                          </div>
                          <h3 className="text-base font-display font-semibold">
                            {roomType ? roomType.name : bookingServices[0]?.name || "Service Booking"}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono font-semibold text-[#d4af37]">
                              {booking.bookingReference}
                            </span>
                            <span>•</span>
                            <span>{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{nights}N • {booking.guests}G</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-700">${booking.totalPrice}</p>
                            <p className="text-xs text-muted-foreground">Paid</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookingDetails(booking.id)
                            }}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <CardContent className="p-4 space-y-4 animate-in slide-in-from-top duration-300">
                        {/* Condensed Info Grid */}
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-slate-100">
                              <Hotel className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-semibold">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-slate-100">
                              <Users className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Guests</p>
                              <p className="font-semibold">{booking.guests}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-100">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Paid</p>
                              <p className="font-bold text-green-700">${booking.totalPrice}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Booked On</p>
                              <p className="font-semibold text-xs">{new Date(booking.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Services if any */}
                        {bookingServices.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Additional Services ({bookingServices.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {bookingServices.map((service) => (
                                <Badge key={service.id} variant="secondary" className="text-xs">
                                  {service.name} • ${service.price}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Guest Info */}
                        <div className="pt-2 border-t text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Guest:</span>
                            <span className="font-semibold">{booking.guestName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-mono text-xs">{booking.guestEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-semibold">{booking.guestPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment:</span>
                            <Badge variant="outline" className="text-xs capitalize">{booking.paymentMethod}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </TabsContent>

          {/* Cancelled Bookings */}
          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Cancelled Bookings</h3>
                  <p className="text-muted-foreground">
                    You haven't cancelled any bookings. All your reservations are active!
                  </p>
                </CardContent>
              </Card>
            ) : (
              cancelledBookings.map((booking) => {
                const roomType = getRoomTypeForBooking(booking)
                const bookingServices = getServicesForBooking(booking)
                const nights = Math.ceil(
                  (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                )
                const checkInDate = new Date(booking.checkIn)
                const checkOutDate = new Date(booking.checkOut)
                const isExpanded = expandedBookings.has(booking.id)

                return (
                  <Card key={booking.id} className="glass-card overflow-hidden border border-red-200 hover:border-red-300 transition-all duration-300 opacity-75">
                    {/* Compact List View */}
                    <div className="bg-gradient-to-r from-red-50 via-red-50/50 to-red-50 p-3 border-b border-red-200 cursor-pointer hover:bg-red-100/50 transition-colors" onClick={() => toggleBookingDetails(booking.id)}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getBookingTypeBadge(booking.bookingType)}
                            {getStatusBadge(booking.status)}
                            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                              Refund Pending
                            </Badge>
                          </div>
                          <h3 className="text-base font-display font-semibold text-red-900">
                            {roomType ? roomType.name : bookingServices[0]?.name || "Service Booking"}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono font-semibold text-red-600">
                              {booking.bookingReference}
                            </span>
                            <span>•</span>
                            <span>{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{nights}N • {booking.guests}G</span>
                            <span>•</span>
                            <span className="text-red-600">Cancelled {booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600 line-through">${booking.totalPrice}</p>
                            <p className="text-xs text-muted-foreground">Cancelled</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookingDetails(booking.id)
                            }}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <CardContent className="p-4 space-y-4 bg-red-50/30 animate-in slide-in-from-top duration-300">
                        {/* Cancellation Info */}
                        <div className="glass-card p-4 border border-red-200 bg-red-50">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-red-100">
                              <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-red-900 mb-1">Booking Cancelled</h4>
                              <p className="text-sm text-red-700">
                                This booking was cancelled on {booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown date'}.
                                Refund processing typically takes 5-7 business days.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Condensed Info Grid */}
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-slate-100">
                              <Hotel className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-semibold">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-slate-100">
                              <Users className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Guests</p>
                              <p className="font-semibold">{booking.guests}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-red-100">
                              <DollarSign className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Amount</p>
                              <p className="font-bold text-red-600 line-through">${booking.totalPrice}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Booked On</p>
                              <p className="font-semibold text-xs">{new Date(booking.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Original Booking Dates */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Original Reservation Dates:</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="font-medium">Check-in:</span>
                              <span>{checkInDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <span>→</span>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="font-medium">Check-out:</span>
                              <span>{checkOutDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Room Type Info */}
                        {roomType && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Room Type:</p>
                            <div className="flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-[#d4af37]" />
                              <span className="font-semibold">{roomType.name}</span>
                              <Badge variant="secondary" className="text-xs">${roomType.basePrice}/night</Badge>
                            </div>
                          </div>
                        )}

                        {/* Services if any */}
                        {bookingServices.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Services Included ({bookingServices.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {bookingServices.map((service) => (
                                <Badge key={service.id} variant="secondary" className="text-xs">
                                  {service.name} • ${service.price}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Guest Info */}
                        <div className="pt-2 border-t text-xs space-y-1">
                          <p className="text-muted-foreground font-semibold mb-2">Guest Information:</p>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-semibold">{booking.guestName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-mono text-xs">{booking.guestEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-semibold">{booking.guestPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Method:</span>
                            <Badge variant="outline" className="text-xs capitalize">{booking.paymentMethod}</Badge>
                          </div>
                        </div>

                        {/* Rebook Option */}
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            className="w-full border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-white transition-all"
                            onClick={() => router.push("/rooms")}
                          >
                            <Hotel className="w-4 h-4 mr-2" />
                            Book Similar Room
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </TabsContent>

          {/* Stay History */}
          <TabsContent value="stays" className="space-y-4">
            {completedStays.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Hotel className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Stay History</h3>
                  <p className="text-muted-foreground">
                    Your completed hotel stays will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedStays.map((booking) => {
                const roomType = getRoomTypeForBooking(booking)
                const nights = Math.ceil(
                  (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                )
                const checkInDate = new Date(booking.checkIn)
                const checkOutDate = new Date(booking.checkOut)
                const bookingServices = getServicesForBooking(booking)
                const isExpanded = expandedBookings.has(booking.id)

                return (
                  <Card key={booking.id} className="glass-card overflow-hidden border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all duration-300">
                    {/* Compact List View */}
                    <div className="bg-gradient-to-r from-[#d4af37]/10 via-white to-[#d4af37]/10 p-3 border-b border-[#d4af37]/20 cursor-pointer hover:from-[#d4af37]/15 hover:to-[#d4af37]/15 transition-colors" onClick={() => toggleBookingDetails(booking.id)}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(booking.status)}
                            <Badge className="bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                          <h3 className="text-base font-display font-semibold flex items-center gap-2">
                            <Hotel className="w-4 h-4 text-[#d4af37]" />
                            {roomType?.name || "Room Stay"}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })} → {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                            <span>•</span>
                            <span>{nights}N • {booking.guests}G</span>
                            <span>•</span>
                            <span className="font-mono text-[#d4af37]">{booking.bookingReference}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-700">${booking.totalPrice}</p>
                            <p className="text-xs text-muted-foreground">${Math.round(booking.totalPrice / nights)}/night</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookingDetails(booking.id)
                            }}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-[#d4af37]" /> : <ChevronDown className="w-5 h-5 text-[#d4af37]" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <CardContent className="p-5 space-y-4 animate-in slide-in-from-top duration-300">
                        {/* Stay Metrics */}
                        <div className="grid md:grid-cols-4 gap-4">
                          <div className="glass-card p-4 border border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                                <Clock className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Nights</p>
                                <p className="text-2xl font-bold">{nights}</p>
                              </div>
                            </div>
                          </div>

                          <div className="glass-card p-4 border border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5">
                                <Users className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Guests</p>
                                <p className="text-2xl font-bold">{booking.guests}</p>
                              </div>
                            </div>
                          </div>

                          <div className="glass-card p-4 border border-green-200 bg-green-50/50">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                                <p className="text-2xl font-bold text-green-700">${booking.totalPrice}</p>
                              </div>
                            </div>
                          </div>

                          <div className="glass-card p-4 border border-[#d4af37]/30 bg-[#d4af37]/5">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#d4af37]/30 to-[#d4af37]/10">
                                <Hotel className="w-5 h-5 text-[#d4af37]" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg/Night</p>
                                <p className="text-xl font-bold text-[#d4af37]">${Math.round(booking.totalPrice / nights)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Room & Guest Details */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Room Information */}
                          {roomType && (
                            <div className="glass-card p-4 border border-slate-200 space-y-3">
                              <h4 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                                <Hotel className="w-4 h-4 text-[#d4af37]" />
                                Room Information
                              </h4>
                              <Separator />
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="font-semibold">{roomType.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Base Rate:</span>
                                  <span className="font-semibold">${roomType.basePrice}/night</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Max Occupancy:</span>
                                  <span className="font-semibold">{roomType.maxOccupancy} guests</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Booking Details */}
                          <div className="glass-card p-4 border border-slate-200 space-y-3">
                            <h4 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Booking Details
                            </h4>
                            <Separator />
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Reference:</span>
                                <span className="font-mono font-semibold text-xs">{booking.bookingReference}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Guest Name:</span>
                                <span className="font-semibold">{booking.guestName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Payment:</span>
                                <Badge variant="outline" className="capitalize text-xs">{booking.paymentMethod}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Booked:</span>
                                <span className="font-semibold text-xs">{new Date(booking.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Services if any */}
                        {bookingServices.length > 0 && (
                          <div className="glass-card p-4 border border-purple-200 bg-purple-50/30 space-y-3">
                            <h4 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-2 text-purple-800">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              Services Enjoyed ({bookingServices.length})
                            </h4>
                            <Separator />
                            <div className="flex flex-wrap gap-2">
                              {bookingServices.map((service) => (
                                <Badge key={service.id} variant="secondary" className="text-xs px-3 py-1">
                                  {service.name} • ${service.price}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                          <Button variant="outline" className="w-full border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-white transition-all">
                            <Hotel className="w-4 h-4 mr-2" />
                            Book This Room Again
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

